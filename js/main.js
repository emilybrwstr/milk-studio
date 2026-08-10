// Sticky header state — stays hidden until the splash screen is scrolled past
const header = document.getElementById('siteHeader');
const splash = document.getElementById('top');
const onScroll = () => {
  const threshold = Math.max(splash.offsetHeight - 120, 80);
  header.classList.toggle('scrolled', window.scrollY > threshold);
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in-view'));
}

// Mobile only: once the splash intro animation finishes, auto-advance to the
// hero. Cancelled if the visitor starts scrolling on their own first.
const isMobile = window.matchMedia('(max-width: 760px)').matches;
const reducesMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (isMobile && !reducesMotion) {
  let userScrolled = false;
  const markScrolled = () => { userScrolled = true; };
  window.addEventListener('wheel', markScrolled, { once: true, passive: true });
  window.addEventListener('touchmove', markScrolled, { once: true, passive: true });
  window.addEventListener('keydown', markScrolled, { once: true });

  setTimeout(() => {
    if (userScrolled || window.scrollY > 40) return;
    const hero = document.querySelector('.hero');
    if (hero) hero.scrollIntoView({ behavior: 'smooth' });
  }, 2000);
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Booking buttons open the Calendly popup instead of navigating away;
// falls back to a normal link if the Calendly widget fails to load.
document.querySelectorAll('[data-book-link]').forEach((link) => {
  link.addEventListener('click', (e) => {
    if (typeof Calendly === 'undefined') return;
    e.preventDefault();
    Calendly.initPopupWidget({
      url: 'https://calendly.com/emily-milkstudio/appointment?hide_event_type_details=1&hide_gdpr_banner=1',
    });
  });
});
