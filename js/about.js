// Animates the About page's DM thread — messages arrive one at a time with
// a brief "typing…" beat first, like a real conversation loading in.
// Progressive enhancement: without JS (or with reduced motion requested),
// every message is already in the markup and simply shows at once.
(function () {
  const container = document.getElementById('aboutMessages');
  if (!container) return;

  const reducesMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducesMotion) return;

  const TYPING_MS = 700;
  const GAP_MS = 250;
  const DIVIDER_PAUSE_MS = 450;

  const items = Array.from(container.children);
  items.forEach((el) => { el.style.display = 'none'; });

  const typing = document.createElement('div');
  typing.className = 'about-typing';
  typing.setAttribute('aria-hidden', 'true');
  typing.innerHTML = '<span></span><span></span><span></span>';

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function playback() {
    for (const el of items) {
      if (el.classList.contains('about-msg-time')) {
        await wait(DIVIDER_PAUSE_MS);
        el.style.display = '';
        el.scrollIntoView({ behavior: 'smooth', block: 'end' });
        continue;
      }

      container.insertBefore(typing, el);
      typing.style.display = '';
      typing.scrollIntoView({ behavior: 'smooth', block: 'end' });
      await wait(TYPING_MS);
      typing.style.display = 'none';

      el.style.display = '';
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
      await wait(GAP_MS);
    }
    typing.remove();
  }

  playback();
})();
