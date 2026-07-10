// Hero video autoplay: the visible element starts with no src. A detached
// probe video asks the browser whether muted autoplay is allowed. Only
// then does the real element get its media — a visible video whose
// autoplay was denied paints a permanent native play button in Safari,
// and this way it never enters that state.
(function () {
  const heroVideo = document.querySelector('#hero video');
  if (!heroVideo) return;

  const HERO_SRC = 'FairwayOffice - HD 720p.mp4';
  heroVideo.defaultMuted = true;
  heroVideo.muted = true;
  heroVideo.playsInline = true;

  function attachAndPlay() {
    heroVideo.src = HERO_SRC;
    const p = heroVideo.play();
    if (p) p.catch(() => {});
  }

  const probe = document.createElement('video');
  probe.defaultMuted = true;
  probe.muted = true;
  probe.playsInline = true;
  probe.src = HERO_SRC;

  const attempt = probe.play();
  if (!attempt) {
    // Old browsers where play() returns undefined
    attachAndPlay();
    return;
  }

  attempt.then(
    () => {
      probe.pause();
      probe.removeAttribute('src');
      probe.load();
      attachAndPlay();
    },
    (e) => {
      // Only NotAllowedError means the autoplay policy blocked playback.
      // Anything else (e.g. AbortError from background power saving) is
      // transient: attach the real media and retry when visible.
      if (!e || e.name !== 'NotAllowedError') {
        attachAndPlay();
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden && heroVideo.paused) {
            const p = heroVideo.play();
            if (p) p.catch(() => {});
          }
        });
        return;
      }
      // Autoplay denied. Safari renders an MP4 poster as an animated
      // image (like a GIF), exempt from the autoplay policy, so the hero
      // keeps moving with no playable media and hence no play button.
      // Real playback starts on the first gesture that grants user
      // activation (scroll does not).
      heroVideo.poster = HERO_SRC;
      const kick = () => {
        attachAndPlay();
        window.removeEventListener('pointerdown', kick);
        window.removeEventListener('keydown', kick);
      };
      window.addEventListener('pointerdown', kick, { passive: true });
      window.addEventListener('keydown', kick);
    },
  );
})();

// Scroll reveal
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    });
  },
  { threshold: 0.12 },
);

document
  .querySelectorAll('.reveal, .stat-card')
  .forEach((el) => revealObserver.observe(el));

// Collage panel stagger animation
const collageEl = document.querySelector('.collage');
if (collageEl) {
  const collageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        collageEl.classList.add('panels-visible');
        collageObserver.unobserve(collageEl);
      });
    },
    { threshold: 0.1 },
  );
  collageObserver.observe(collageEl);
}

// Mobile courses reveal (the opacity:0 rule only exists under the
// max-width:960px media query, so observing unconditionally is a
// no-op on wider viewports and avoids relying on a one-time,
// load-time matchMedia check that can race with the viewport
// settling in Safari/Firefox)
const mobileRevealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      mobileRevealObserver.unobserve(e.target);
    });
  },
  { threshold: 0.1 },
);
document
  .querySelectorAll('.m-reveal')
  .forEach((el) => mobileRevealObserver.observe(el));

// Courses sticky scroll
(function () {
  const wrapper = document.querySelector('.courses-scroll-wrapper');
  const bgs = document.querySelectorAll('.course-bg'); // 6: [0]=overview, [1-5]=courses
  const overview = document.querySelector('.courses-overview-text');
  const panels = document.querySelectorAll('.course-panel'); // 5 panels, index 0-4
  const logoItems = document.querySelectorAll('.course-logo-item');
  const progressEl = document.querySelector('.courses-nav-progress');
  const COURSE_N = 5;
  const STATES = COURSE_N + 1; // 6 total states (0=overview, 1-5=courses)
  // Progress bar top (px from .courses-nav top) per course index 0-4
  const PROG_TOPS = [16, 129, 210, 308, 394];

  let current = -2; // force first run

  const titleEl = document.querySelector('.courses-title');

  // courseIdx: -1 = overview, 0-4 = courses
  function setActive(courseIdx) {
    if (courseIdx === current) return;
    current = courseIdx;

    // Title shrinks when a course is active
    if (titleEl)
      titleEl.classList.toggle('courses-title--small', courseIdx !== -1);

    // Background: bg[0]=overview, bg[courseIdx+1]=course bg
    bgs.forEach((el, i) => el.classList.toggle('active', i === courseIdx + 1));

    // Overview text
    if (overview) overview.classList.toggle('active', courseIdx === -1);

    // Course panels
    panels.forEach((el, i) => el.classList.toggle('active', i === courseIdx));

    // Logo items (none active in overview)
    logoItems.forEach((el, i) =>
      el.classList.toggle('active', i === courseIdx),
    );

    // Progress bar
    if (progressEl) {
      progressEl.style.opacity = courseIdx === -1 ? '0' : '1';
      if (courseIdx >= 0) progressEl.style.top = PROG_TOPS[courseIdx] + 'px';
    }
  }

  function onScroll() {
    const rect = wrapper.getBoundingClientRect();
    const total = wrapper.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    const scrolled = Math.max(0, -rect.top);
    const pct = Math.min(scrolled / total, 1);
    // rawIdx: 0=overview, 1-5=courses (floor of 6 equal slots)
    const rawIdx = Math.min(Math.floor(pct * STATES), STATES - 1);
    setActive(rawIdx - 1); // convert to courseIdx (-1 to 4)
  }

  // Click logo → scroll to center of that course's slot
  // Each course occupies 1/STATES of total scroll, starting at slot 1
  // Use (slot + 0.5) to land in the middle → avoids float-point boundary issues
  function scrollToCourse(courseIdx) {
    const total = wrapper.offsetHeight - window.innerHeight;
    const pct = (1 + courseIdx + 0.5) / STATES;
    const pageTop = wrapper.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: pageTop + pct * total, behavior: 'smooth' });
  }

  logoItems.forEach((el) => {
    const idx = Number.parseInt(el.dataset.course, 10);
    el.addEventListener('click', () => scrollToCourse(idx));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') scrollToCourse(idx);
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  setActive(-1); // start in overview state
})();
