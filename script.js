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
