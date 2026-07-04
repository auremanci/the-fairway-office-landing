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

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const range = req.headers.range;
      if (range && ext === '.mp4') {
        // Parse "bytes=start-end", "bytes=start-" and "bytes=-suffix"
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        let start;
        let end;
        if (match && (match[1] !== '' || match[2] !== '')) {
          if (match[1] === '') {
            // Suffix range: last N bytes
            const suffix = Number.parseInt(match[2], 10);
            start = Math.max(0, stat.size - suffix);
            end = stat.size - 1;
          } else {
            start = Number.parseInt(match[1], 10);
            end =
              match[2] === ''
                ? stat.size - 1
                : Math.min(Number.parseInt(match[2], 10), stat.size - 1);
          }
        }
        if (start === undefined || start > end || start >= stat.size) {
          res.writeHead(416, {
            'Content-Range': `bytes */${stat.size}`,
          });
          res.end();
          return;
        }
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Type': contentType,
        });
        fs.createReadStream(filePath, { start, end })
          .on('error', () => res.destroy())
          .pipe(res);
        return;
      }

      const headers = {
        'Content-Type': contentType,
        'Content-Length': stat.size,
      };
      if (ext === '.mp4') headers['Accept-Ranges'] = 'bytes';
      res.writeHead(200, headers);
      fs.createReadStream(filePath)
        .on('error', () => res.destroy())
        .pipe(res);
    });
  })
  .listen(PORT, () =>
    console.log(`Server running on http://localhost:${PORT}`),
  );
