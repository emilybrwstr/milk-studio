# milk studio website

Static site — just open `index.html`, no build step required.

## Still needs your real info

Search for these in the code and swap them in:

- **Booking link** — every element with `data-book-link` in `index.html` points to `#`. Replace with your Vagaro/Booksy/Calendly URL once you have one.
- **Instagram** — elements with `data-social-link` point to `#`. Replace with your profile URL and update the visible `@milkstudio` handle text.
- **Gallery photos** — `.gallery-grid` in `index.html` has 6 placeholder tiles (`.gallery-tile`). Swap each `<div class="gallery-tile ...">` for an `<img>` once you have real photos of your work.
- **Pricing** — the `#services` section has starting prices for Gel Manicure, Builder Gel/BIAB, Full Set, and Nail Art. Update to your actual rates.
- **Location/hours** — `#contact` currently says "North York, Toronto" and "By appointment only." Adjust if needed.

## Structure

- `index.html` — page content
- `css/styles.css` — all styling (colors/fonts are defined as CSS variables at the top of the file)
- `js/main.js` — sticky header, mobile menu, scroll animations
