# milk studio website

Static site — just open `index.html`, no build step required.

## Still needs your real info

Search for these in the code and swap them in:

- **Instagram** — elements with `data-social-link` point to `#`. Replace with your profile URL and update the visible `@milkstudio` handle text.
- **Gallery photos** — `.gallery-grid` in `index.html` has 6 placeholder tiles (`.gallery-tile`). Swap each `<div class="gallery-tile ...">` for an `<img>` once you have real photos of your work.
- **Location/hours** — `#contact` currently says "North York, Toronto" and "By appointment only." Adjust if needed.

## Structure

- `index.html` — page content
- `css/styles.css` — all styling (colors/fonts are defined as CSS variables at the top of the file)
- `js/main.js` — sticky header, mobile menu, scroll animations
