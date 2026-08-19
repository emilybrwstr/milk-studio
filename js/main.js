// Sticky header state. On the homepage it stays hidden until the intro
// (logo/menu) screen has been scrolled past. On subpages with a shader
// page-hero it's shown right away and turns solid/blurred once scrolled
// past the banner. On pages with neither (book.html) it's just solid from
// the start — there's no shader banner for the white/transparent style to
// make sense against.
const header = document.getElementById('siteHeader');
const intro = document.getElementById('intro');
const pageHero = document.querySelector('.page-hero');
if (!intro) header.classList.add('header-visible');
if (!intro && !pageHero) header.classList.add('header-blurred');
const onScroll = () => {
  const heroAnchor = intro || pageHero;
  if (!heroAnchor) return;
  const threshold = Math.max(heroAnchor.offsetHeight - 120, 80);
  header.classList.toggle(intro ? 'scrolled' : 'header-blurred', window.scrollY > threshold);
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

// ---------------------------------------------------------------------------
// Intro swipe (homepage only — subpages have no #intro). The logo and menu
// occupy the same fixed screen. Scrolling (or swiping, or arrow keys) swipes
// the logo up and off, and the menu up and in — it never looks like the page
// itself is scrolling. Scrolling further does nothing once the menu is
// showing — the rest of the site is only reached by clicking a menu item,
// which releases the capture so normal scrolling works on whatever section
// (or page) you land on.
// ---------------------------------------------------------------------------
if (intro) {
const reducesMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let introState = 'logo'; // 'logo' | 'menu'
let introLocked = false;
let introReleased = false;

const showMenu = () => {
  if (introState !== 'logo' || introLocked) return false;
  introState = 'menu';
  intro.classList.add('menu-active');
  introLocked = true;
  setTimeout(() => { introLocked = false; }, reducesMotion ? 0 : 900);
  return true;
};

const showLogo = () => {
  if (introState !== 'menu' || introLocked) return false;
  introState = 'logo';
  intro.classList.remove('menu-active');
  introLocked = true;
  setTimeout(() => { introLocked = false; }, reducesMotion ? 0 : 900);
  return true;
};

// Menu links release the capture as part of navigating away, so normal
// scrolling works once you land on that section.
document.querySelectorAll('.flip-link').forEach((link) => {
  link.addEventListener('click', () => { introReleased = true; });
});

if (reducesMotion) {
  // No swipe theatrics — just show the menu; clicks still drive navigation.
  showMenu();
} else {
  // Listen on window (not just .intro) so capture works regardless of where
  // on the page the scroll/touch originates.
  window.addEventListener(
    'wheel',
    (e) => {
      if (introReleased) return;
      e.preventDefault();
      if (introLocked) return;
      if (e.deltaY > 10 && introState === 'logo') {
        showMenu();
      } else if (e.deltaY < -10 && introState === 'menu') {
        showLogo();
      }
    },
    { passive: false }
  );

  let touchStartY = null;
  let touchTriggered = false;
  window.addEventListener('touchstart', (e) => {
    if (introReleased) return;
    touchStartY = e.touches[0].clientY;
    touchTriggered = false;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (introReleased || touchStartY === null) return;
    const dy = touchStartY - e.touches[0].clientY; // positive = swiping up
    if (Math.abs(dy) > 5) e.preventDefault();
    if (touchTriggered || introLocked) return;
    if (dy > 40 && introState === 'logo') {
      touchTriggered = showMenu();
    } else if (dy < -40 && introState === 'menu') {
      touchTriggered = showLogo();
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    touchStartY = null;
    touchTriggered = false;
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (introReleased) return;
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
      e.preventDefault();
      if (!introLocked && introState === 'logo') showMenu();
    } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
      e.preventDefault();
      if (!introLocked && introState === 'menu') showLogo();
    }
  });

  // Mobile only: auto-swipe to the menu after a moment, unless the visitor
  // has already started interacting themselves.
  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  if (isMobile) {
    let userActed = false;
    const markActed = () => { userActed = true; };
    window.addEventListener('wheel', markActed, { once: true, passive: true });
    window.addEventListener('touchstart', markActed, { once: true, passive: true });
    window.addEventListener('keydown', markActed, { once: true });
    setTimeout(() => {
      if (!userActed) showMenu();
    }, 3400);
  }
}
}

// Size the flip-menu text to fill the available width as much as possible
// without wrapping — one uniform size for all four, fit to the widest line
// ("preset designs"), recalculated on resize and once the font loads. Each
// link is a counter number (::before) plus a .flip-link-text span; the
// number's width doesn't scale with the fit size, so it's reserved as a
// flat allowance rather than measured live.
const fitFlipMenu = () => {
  const list = document.querySelector('.flip-menu-list');
  const links = [...document.querySelectorAll('.flip-link')];
  const texts = [...document.querySelectorAll('.flip-link-text')];
  if (!list || !texts.length) return;

  const listStyle = getComputedStyle(list);
  const numberAllowance = window.matchMedia('(max-width: 480px)').matches ? 46 : 90;
  const availableWidth =
    list.clientWidth - parseFloat(listStyle.paddingLeft) - parseFloat(listStyle.paddingRight) - numberAllowance;

  // Measure each label's true unwrapped width at a neutral probe size —
  // force nowrap during the probe, since scrollWidth on a wrapped block
  // only reflects its widest wrapped line, not the full text width.
  const probeSize = 200;
  let widestRatio = 0;
  texts.forEach((text) => {
    const prevSize = text.style.fontSize;
    const prevWhiteSpace = text.style.whiteSpace;
    text.style.fontSize = `${probeSize}px`;
    text.style.whiteSpace = 'nowrap';
    widestRatio = Math.max(widestRatio, text.scrollWidth / probeSize);
    text.style.fontSize = prevSize;
    text.style.whiteSpace = prevWhiteSpace;
  });
  if (!widestRatio) return;

  const lineHeight = parseFloat(getComputedStyle(texts[0]).lineHeight) / probeSize || 1.0;
  const heightFitSize = (window.innerHeight * 0.7) / (texts.length * lineHeight);
  const widthFitSize = (availableWidth * 0.98) / widestRatio;

  const minSize = window.matchMedia('(max-width: 480px)').matches ? 24 : 44;
  let size = Math.max(Math.min(widthFitSize, heightFitSize, 220), minSize);
  texts.forEach((text) => { text.style.fontSize = `${size}px`; });

  // Safety net: if anything still wraps to a second line (detected by
  // rendered height, since a wrapped block's scrollWidth never exceeds its
  // own box), shrink further rather than trust the estimate alone.
  const singleLineHeight = () => parseFloat(getComputedStyle(texts[0]).lineHeight);
  for (let i = 0; i < 6; i++) {
    const wrapped = links.some((link) => link.getBoundingClientRect().height > singleLineHeight() * 1.4);
    if (!wrapped) break;
    size *= 0.94;
    texts.forEach((text) => { text.style.fontSize = `${size}px`; });
  }
};
fitFlipMenu();
window.addEventListener('resize', fitFlipMenu);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(fitFlipMenu);
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
