// Mounts the real @paper-design/shaders-react Warp shader into the splash
// background, loaded straight from a CDN as native ES modules — no build
// step, since the rest of this site is plain static HTML/CSS/JS.
// Falls back to the plain CSS background (see .splash-bg) if the module
// fails to load, WebGL is unavailable, or the visitor prefers reduced motion.
(async () => {
  const container = document.getElementById('splashShader');
  if (!container) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  try {
    // react/react-dom resolve via the import map in index.html, so this
    // shares the exact same React instance as the shader package below.
    const [{ default: React }, { createRoot }, { Warp }] = await Promise.all([
      import('react'),
      import('react-dom/client'),
      import('https://esm.sh/@paper-design/shaders-react@0.0.80?external=react,react-dom'),
    ]);

    const root = createRoot(container);
    root.render(
      React.createElement(Warp, {
        style: { height: '100%', width: '100%' },
        proportion: 0.45,
        softness: 1,
        distortion: 0.25,
        swirl: 0.8,
        swirlIterations: 10,
        shape: 'checks',
        shapeScale: 0.1,
        scale: 1,
        rotation: 0,
        speed: 1,
        // milk studio brand tones in place of the demo's magenta/pink
        colors: ['hsl(2, 67%, 25%)', 'hsl(6, 38%, 54%)', 'hsl(32, 50%, 90%)', 'hsl(33, 100%, 98%)'],
      })
    );
  } catch (err) {
    console.warn('[milk studio] Splash shader failed to load — using static background.', err);
  }
})();
