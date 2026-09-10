// status: 'available' (posted, bookable) | 'booked' (posted, taken, not yet
// recreated) | 'archived' (posted, taken, recreated — links to the real
// archive) | 'queued' (not posted yet — sits out of the grid entirely until
// manually promoted to fill an available slot as one gets booked). Only 6
// should be 'available' at once; promote the next queued look by hand when
// one of the 6 gets booked, rather than moving anything else's position.
const LOOKS = [
  { img: 'images/the-edit/IMG_7950.JPG', title: 'emerald cage', status: 'available', caption: 'stiletto claws wrapped in liquid chrome.', design: 65, addons: { length: 'long', fullChrome: 'all', chrome: 'all', rhinestones: 'all', handPainted: 'all' }, likes: 289 },
  { img: 'images/the-edit/IMG_7951.JPG', title: 'gilded whisper', status: 'queued', caption: 'barely-there nude with a gold cuff at the base. quiet luxury, loud nails 🤎', design: 35, addons: { length: 'long', chrome: 'all', rhinestones: 'all' }, likes: 241 },
  { img: 'images/the-edit/IMG_7952.JPG', title: 'chrome reverie', status: 'available', caption: 'blushed pink melting into mirrored chrome, slay', design: 30, addons: { fullChrome: 'all', aura: 'all' }, likes: 342 },
  { img: 'images/the-edit/IMG_7954.JPG', title: 'molten gold', status: 'queued', caption: '3D gold wire poured straight onto bare nail. it\'s basically jewelry 🫧', design: 30, addons: { chrome: 'all', handPainted: 'all' }, likes: 198 },
  { img: 'images/the-edit/IMG_7955.JPG', title: 'lilac static', status: 'queued', caption: 'hand-painted lilac static over milky white. felt cute, might still book it 💜', design: 35, addons: { length: 'long', aura: 'all', handPainted: 'all' }, likes: 167 },
  { img: 'images/the-edit/IMG_7956.JPG', title: 'wild card', status: 'booked', caption: 'tortoiseshell, chrome marble, and a french tip that didn\'t get the memo. chaos, curated 🐆', design: 32, addons: { length: 'long', handPainted: 'all', aura: 2, rhinestones: 2, chrome: 2 }, likes: 224 },
  { img: 'images/the-edit/IMG_7957.JPG', title: 'star charm', status: 'available', caption: 'stars, dots, marble, pearls — every ring on my hand had a say in this one ⭐', design: 38, addons: { chrome: 1, aura: 3, handPainted: 'all', rhinestones: 'all' }, likes: 311 },
  { img: 'images/the-edit/IMG_7960.JPG', title: 'midnight merlot', status: 'available', caption: 'wine-stained french tips 🍷', design: 47, addons: { length: 'long', aura: 'all', chrome: 'all', threeDElements: 6 }, likes: 156 },
  { img: 'images/the-edit/IMG_7961.JPG', title: 'bruised petal', status: 'available', caption: 'airbrushed red-violet blush with little pearl drops. looks bitten, not bad 🩸', design: 45, addons: { aura: 'all', handPainted: 'all', rhinestones: 'all' }, likes: 229 },
  { img: 'images/the-edit/IMG_7962.JPG', title: 'liquid mercury', status: 'available', caption: 'basically a mirror at this point 🪞', design: 50, addons: { length: 'long', chrome: 'all', aura: 'all', handPainted: 'all' }, likes: 267 },
  { img: 'images/the-edit/IMG_7964.JPG', title: 'jade current', status: 'queued', caption: 'jade ombré with molten chrome swirls running through it 🌿', design: 50, addons: { length: 'long', chrome: 'all', aura: 'all', handPainted: 'all' }, likes: 182 },
  { img: 'images/the-edit/IMG_7965.JPG', title: 'armoured ombre', status: 'available', caption: 'armoured ombre ⛓️ 🍐', design: 50, addons: { length: 'long', aura: 'all', chrome: 'all', rhinestones: 'all' }, likes: 205 },
  { img: 'images/the-edit/IMG_7967.JPG', title: 'honey chrome', status: 'available', caption: 'ombré gold chrome, need i say more?', design: 35, addons: { length: 'long', aura: 'all', chrome: 'all' }, likes: 163 },
  { img: 'images/the-edit/IMG_7969.JPG', title: 'renegade', status: 'queued', caption: 'rhinestones, a real nail piercing, snakeskin — this one\'s not for the faint of heart ⚡', design: 40, addons: { length: 'long', rhinestones: 4, handPainted: 'all', threeDElements: 4, nailPiercing: 2 }, likes: 372 },
  { img: 'images/the-edit/IMG_7970.JPG', title: 'tidal pattern', status: 'queued', caption: 'teal, chrome, and little glass bubbles on repeat. giving mermaidcore 🌊', design: 32, addons: { fullChrome: 4, aura: 4, handPainted: 2, threeDElements: 6 }, likes: 194 },
  { img: 'images/the-edit/IMG_7971.JPG', title: 'gilded muse', status: 'available', caption: 'hand-laid gold filigree over warm cream. old money, new nails ✨', design: 47, addons: { length: 'long', frenchTip: true, chrome: 6, rhinestones: 4, handPainted: 6 }, likes: 276 },
];

const TILE_CAPTION_BODY = {
  booked: `
    <span class="ig-tile-booked-label">booked!</span>
    <span class="ig-tile-booked-sub">&#9733; coming soon to the archive &#9733;</span>
  `,
  archived: `
    <span class="ig-tile-archived-star">&#9733;</span>
    <span>this set's been moved to the archive<br>click here to take a look!</span>
  `,
};

// Queued looks aren't posted yet — they never touch the DOM, so "how many
// looks" and every tab count below only ever reflect what's actually live.
const VISIBLE_LOOKS = LOOKS.filter((l) => l.status !== 'queued');

const grid = document.getElementById('igGrid');
LOOKS.forEach((look, i) => {
  if (look.status === 'queued') return;
  const taken = look.status === 'booked' || look.status === 'archived';
  const tile = document.createElement('div');
  tile.className = taken ? `ig-tile ig-tile--${look.status}` : 'ig-tile';
  tile.dataset.status = look.status;
  tile.innerHTML = taken ? `
    <img src="${look.img}" alt="${look.title}">
    <div class="ig-tile-archived-caption">
      ${TILE_CAPTION_BODY[look.status]}
    </div>
  ` : `
    <img src="${look.img}" alt="${look.title}">
    <div class="ig-tile-veil">
      <span class="ig-tile-stat">&#9825; ${look.likes}</span>
    </div>
  `;
  tile.addEventListener('click', () => openPost(i));
  grid.appendChild(tile);
});

const availableCount = VISIBLE_LOOKS.filter(l => l.status === 'available').length;
const takenCount = VISIBLE_LOOKS.filter(l => l.status === 'booked' || l.status === 'archived').length;
document.getElementById('postCount').textContent = VISIBLE_LOOKS.length;
document.getElementById('tabCountAll').textContent = VISIBLE_LOOKS.length;
document.getElementById('tabCountAvailable').textContent = availableCount;
document.getElementById('tabCountArchived').textContent = takenCount;

const tabs = document.querySelectorAll('.ig-tab');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    const filter = tab.dataset.filter;
    document.querySelectorAll('.ig-tile').forEach(tile => {
      const status = tile.dataset.status;
      const show = filter === 'all'
        || (filter === 'available' && status === 'available')
        || (filter === 'archived' && (status === 'booked' || status === 'archived'));
      tile.classList.toggle('is-filtered-out', !show);
    });
  });
});

const BASE_OPTIONS = [
  { label: 'Gel-X full set — with overlay', price: 60, serviceId: 'gel-x-full-set' },
  { label: 'Gel-X full set — no overlay', price: 45, serviceId: 'gel-x-full-set-no-overlay' },
  { label: 'Refill — existing long set', price: 45, serviceId: 'refill' },
];

const ART_KEYS = ['chrome', 'fullChrome', 'aura', 'ombre', 'rhinestones', 'threeDElements', 'nailPiercing', 'handPainted', 'handPaintedComplex'];

function buildBookingState(look, base) {
  const state = {
    step: 3,
    serviceId: base.serviceId,
    lengthId: look.addons.length || 'standard',
    frenchTip: !!look.addons.frenchTip,
    catEye: !!look.addons.catEye,
    repairQty: 2,
    repairOver7Days: false,
    removalNeeded: false,
    removalTypeId: 'own',
    removalOnlyTypeId: 'own',
    editDiscount: 0.5,
    editLookTitle: look.title,
  };
  ART_KEYS.forEach((key) => {
    const v = look.addons[key];
    state[key] = v === 'all' ? { qty: 0, all: true } : { qty: v || 0, all: false };
  });
  return state;
}

const baseSelect = document.getElementById('igBaseSelect');
BASE_OPTIONS.forEach((opt, i) => {
  const o = document.createElement('option');
  o.value = i;
  o.textContent = `${opt.label} — $${opt.price}`;
  baseSelect.appendChild(o);
});

let currentLook = null;
let currentIndex = null;
// Only visible (posted) looks are reachable via the arrows — queued ones
// aren't in the grid at all, so skip straight past them.
const visibleIndices = LOOKS.map((_, i) => i).filter((i) => LOOKS[i].status !== 'queued');
function showAdjacent(direction) {
  const pos = visibleIndices.indexOf(currentIndex);
  if (pos === -1) return;
  const nextPos = (pos + direction + visibleIndices.length) % visibleIndices.length;
  openPost(visibleIndices[nextPos]);
}
function updateModalPricing() {
  if (!currentLook) return;
  const base = BASE_OPTIONS[baseSelect.value];
  const designNow = Math.round(currentLook.design * 0.5);
  document.getElementById('igBasePrice').textContent = `$${base.price}`;
  document.getElementById('igDesignFull').textContent = `$${currentLook.design}`;
  document.getElementById('igDesignNow').textContent = `$${designNow}`;
  document.getElementById('igModalTotal').textContent = `$${base.price + designNow}`;
}
baseSelect.addEventListener('change', updateModalPricing);

const backdrop = document.getElementById('igBackdrop');
function openPost(i) {
  const look = LOOKS[i];
  currentLook = look;
  currentIndex = i;
  document.getElementById('igModalImg').src = look.img;
  document.getElementById('igModalImg').alt = look.title;
  document.getElementById('igModalName').textContent = 'theedit';
  document.getElementById('igModalLikes').textContent = `${look.likes} likes`;
  document.getElementById('igModalCaption').textContent = look.caption;

  const isTaken = look.status === 'booked' || look.status === 'archived';
  document.getElementById('igModalBooking').hidden = isTaken;
  document.getElementById('igModalCta').hidden = isTaken;
  document.getElementById('igModalArchived').hidden = !isTaken;
  document.getElementById('igModalArchivedCta').hidden = look.status !== 'archived';
  if (isTaken) {
    const label = document.getElementById('igModalArchivedLabel');
    const text = document.getElementById('igModalArchivedText');
    if (look.status === 'booked') {
      label.textContent = '★ booked';
      text.textContent = "this set's already been booked ♡ will appear in the archive soon";
    } else {
      label.textContent = '★ already booked';
      text.textContent = "this set's been moved to the archive ♡ take a look at how it turned out, or start building something inspired by it.";
    }
    backdrop.classList.add('is-open');
    return;
  }

  baseSelect.value = 0;
  updateModalPricing();

  backdrop.classList.add('is-open');
}
document.getElementById('igModalCta').addEventListener('click', (e) => {
  if (!currentLook) return;
  e.preventDefault();
  const base = BASE_OPTIONS[baseSelect.value];
  const bookingState = buildBookingState(currentLook, base);
  try {
    sessionStorage.setItem('cb-state', JSON.stringify(bookingState));
  } catch (_) {}
  window.location.href = 'custom-booking.html';
});

document.getElementById('igClose').addEventListener('click', () => backdrop.classList.remove('is-open'));
document.getElementById('igPrevBtn').addEventListener('click', () => showAdjacent(-1));
document.getElementById('igNextBtn').addEventListener('click', () => showAdjacent(1));
document.addEventListener('keydown', (e) => {
  if (!backdrop.classList.contains('is-open')) return;
  if (e.key === 'ArrowLeft') showAdjacent(-1);
  else if (e.key === 'ArrowRight') showAdjacent(1);
  else if (e.key === 'Escape') backdrop.classList.remove('is-open');
});

// Swipe between looks on the photo itself, same gesture as the archive's viewer.
let swipeStartX = null;
const modalPhoto = document.querySelector('.ig-modal-photo');
modalPhoto.addEventListener('touchstart', (e) => { swipeStartX = e.touches[0].clientX; }, { passive: true });
modalPhoto.addEventListener('touchend', (e) => {
  if (swipeStartX === null) return;
  const dx = e.changedTouches[0].clientX - swipeStartX;
  if (Math.abs(dx) > 40) showAdjacent(dx < 0 ? 1 : -1);
  swipeStartX = null;
});

// Header "Book Now" stands in for Instagram's follow button visually, but
// there's no generic set to book here — every look has its own base +
// design, so this opens today's featured pick (the newest available look)
// straight into its real, pre-populated booking modal instead of dropping
// people on a blank, context-less Build Your Set form.
document.getElementById('igHeaderBookBtn').addEventListener('click', () => {
  const idx = LOOKS.findIndex((l) => l.status === 'available');
  if (idx > -1) openPost(idx);
});
backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.classList.remove('is-open'); });