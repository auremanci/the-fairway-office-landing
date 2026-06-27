const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3456;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.join(ROOT, urlPath);
    const ext = path.extname(filePath);
    const contentType = MIME[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const headers = { 'Content-Type': contentType };
      if (ext === '.mp4') {
        const stat = fs.statSync(filePath);
        const range = req.headers.range;
        if (range) {
          const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
          const start = Number.parseInt(startStr, 10);
          const end = endStr ? Number.parseInt(endStr, 10) : stat.size - 1;
          const chunkSize = end - start + 1;
          const stream = fs.createReadStream(filePath, { start, end });
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': 'video/mp4',
          });
          stream.pipe(res);
          return;
        }
        headers['Content-Length'] = stat.size;
        headers['Accept-Ranges'] = 'bytes';
      }

      res.writeHead(200, headers);
      res.end(data);
    });
  })
  .listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`),
  );
