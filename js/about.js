// Animates the About page's DM thread — messages arrive one at a time with
// a brief "typing…" beat first, like a real conversation loading in.
// Progressive enhancement: without JS (or with reduced motion requested),
// every message is already in the markup and simply shows at once.
(function () {
  const container = document.getElementById('aboutMessages');
  if (!container) return;

  const reducesMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducesMotion) return;

  // Shorter bubbles feel like a quick reply; longer ones (and the image)
  // get a longer "typing…" beat, like she's actually writing them out.
  const SHORT_TYPING_MS = 2000;
  const LONG_TYPING_MS = 4000;
  const LENGTH_THRESHOLD = 45;
  const GAP_MS = 250;
  const DIVIDER_PAUSE_MS = 450;

  const items = Array.from(container.children);
  items.forEach((el) => { el.style.display = 'none'; });

  const typing = document.createElement('div');
  typing.className = 'about-typing';
  typing.setAttribute('aria-hidden', 'true');
  typing.innerHTML = '<span></span><span></span><span></span>';

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function typingDurationFor(el) {
    if (el.classList.contains('about-bubble-img')) return LONG_TYPING_MS;
    const length = el.textContent.trim().length;
    return length > LENGTH_THRESHOLD ? LONG_TYPING_MS : SHORT_TYPING_MS;
  }

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
      await wait(typingDurationFor(el));
      typing.style.display = 'none';

      el.style.display = '';
      el.scrollIntoView({ behavior: 'smooth', block: 'end' });
      await wait(GAP_MS);
    }
    typing.remove();
  }

  playback();
})();
