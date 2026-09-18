// True masonry for the reviews wall, built in JS rather than CSS columns.
// CSS column-count clips anything that overflows a column's fragment box
// (including the pin, which pokes out above each card) — how aggressively
// varies by browser, and it kept coming back. Plain JS columns are just
// normal vertical flex stacks with no fragmentation involved, so nothing
// can clip regardless of browser. Without JS, .wol-wall's own CSS already
// wraps cards in a plain responsive row as a fallback.
(function () {
  const wall = document.getElementById('wolWall');
  if (!wall) return;
  const cards = Array.from(wall.querySelectorAll('.wol-card'));
  if (!cards.length) return;

  cards.forEach((card, i) => { card.dataset.variant = i % 4; });

  function columnCount() {
    const w = window.innerWidth;
    if (w <= 560) return 1;
    if (w <= 860) return 2;
    return 3;
  }

  function layout() {
    const cols = columnCount();
    wall.innerHTML = '';
    const colEls = [];
    for (let i = 0; i < cols; i++) {
      const col = document.createElement('div');
      col.className = 'wol-wall-col';
      wall.appendChild(col);
      colEls.push(col);
    }
    const heights = new Array(cols).fill(0);
    cards.forEach((card) => {
      let shortest = 0;
      for (let i = 1; i < cols; i++) {
        if (heights[i] < heights[shortest]) shortest = i;
      }
      colEls[shortest].appendChild(card);
      heights[shortest] = colEls[shortest].getBoundingClientRect().height;
    });
  }

  layout();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 150);
  });
})();
