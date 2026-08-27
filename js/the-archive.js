// Numbered 1–19 by Emily, oldest to newest — matches the grid's own
// top-to-bottom order and the "scrolled to newest by default" behaviour
// below. Type is inferred from each file's real extension (.MOV = video,
// everything else = image) rather than hardcoded per item.
const FILES = [
  '1.png', '2.JPG', '3.JPG', '4.jpeg', '5.MOV', '6.jpeg', '7.JPG', '8.JPG',
  '9.MOV', '10.JPG', '11.JPG', '12.MOV', '13.JPG', '14.jpeg', '15.JPG',
  '16.JPG', '17.JPG', '18.JPG', '19.jpg',
];
const PHOTOS = FILES.map((name, i) => ({
  img: `images/portfolio/${name}`,
  title: `set ${i + 1}`,
  type: /\.mov$/i.test(name) ? 'video' : 'image',
}));

document.getElementById('libCount').textContent = `${PHOTOS.length} Photos`;

function formatDuration(sec) {
  if (!isFinite(sec)) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Video elements are muted/inline/preload=metadata so the grid and filmstrip
// can use the real first frame as their thumbnail instead of a separate
// poster image — no extra assets needed for each clip.
function mediaTag(p, { controls } = {}) {
  if (p.type === 'video') {
    return `<video src="${p.img}" muted playsinline preload="metadata" ${controls ? 'controls' : ''}></video>`;
  }
  return `<img src="${p.img}" alt="${p.title}" loading="lazy">`;
}
function playBadge() {
  return `<svg class="lib-thumb-play" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>`;
}

const libGrid = document.getElementById('libGrid');
PHOTOS.forEach((p, i) => {
  const thumb = document.createElement('div');
  thumb.className = 'lib-thumb';
  thumb.innerHTML = p.type === 'video'
    ? `${mediaTag(p)}${playBadge()}<span class="lib-thumb-duration"></span>`
    : `${mediaTag(p)}<svg class="lib-thumb-heart" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.4-9.3-8.8C1.3 8 3 4.8 6.3 4.8c2 0 3.3 1.1 4 2.2.7-1.1 2-2.2 4-2.2 3.3 0 5 3.2 3.6 6.4C19 15.6 12 20 12 20z"/></svg>`;
  thumb.addEventListener('click', () => openViewer(i));
  if (p.type === 'video') {
    const video = thumb.querySelector('video');
    const durationEl = thumb.querySelector('.lib-thumb-duration');
    video.addEventListener('loadedmetadata', () => { durationEl.textContent = formatDuration(video.duration); });
  }
  libGrid.appendChild(thumb);
});

// Real iOS Photos opens already scrolled to the bottom of the grid (the
// newest photo, last in source order) — older ones are above, reached by
// scrolling/swiping up, not down.
const libGridWrap = document.querySelector('.lib-grid-wrap');
function scrollLibraryToNewest() {
  libGridWrap.scrollTop = libGridWrap.scrollHeight;
}
scrollLibraryToNewest();

const track = document.getElementById('viewerTrack');
PHOTOS.forEach((p) => {
  const slide = document.createElement('div');
  slide.className = 'viewer-slide';
  slide.innerHTML = mediaTag(p, { controls: true });
  track.appendChild(slide);
});

const filmstrip = document.getElementById('filmstrip');
PHOTOS.forEach((p, i) => {
  const t = document.createElement('div');
  t.className = 'film-thumb';
  t.innerHTML = p.type === 'video' ? `${mediaTag(p)}${playBadge()}` : mediaTag(p);
  t.addEventListener('click', () => goToPhoto(i));
  filmstrip.appendChild(t);
});

const screenLibrary = document.getElementById('screenLibrary');
const screenViewer = document.getElementById('screenViewer');
let currentIndex = 0;
const favorited = new Set();

function renderViewer() {
  track.style.transform = `translateX(-${currentIndex * 100}%)`;
  document.querySelectorAll('.film-thumb').forEach((t, i) => t.classList.toggle('is-active', i === currentIndex));
  const activeThumb = document.querySelectorAll('.film-thumb')[currentIndex];
  // Manual horizontal scroll instead of scrollIntoView: the filmstrip only
  // scrolls on the x-axis, so a block-axis "nearest" search with no
  // vertically-scrollable ancestor between it and the viewport falls back to
  // scrolling the whole page — this keeps the scroll fully contained.
  if (activeThumb) {
    const wrap = document.querySelector('.filmstrip-wrap');
    const target = activeThumb.offsetLeft - (wrap.clientWidth - activeThumb.clientWidth) / 2;
    wrap.scrollTo({ left: target, behavior: 'smooth' });
  }
  document.getElementById('viewerFavBtn').classList.toggle('is-fav', favorited.has(currentIndex));
}

function goToPhoto(i) {
  currentIndex = i;
  renderViewer();
}

function openViewer(i) {
  currentIndex = i;
  renderViewer();
  screenViewer.classList.add('is-open');
}
function closeViewer() {
  screenViewer.classList.remove('is-open');
}
document.getElementById('viewerBack').addEventListener('click', closeViewer);

document.getElementById('viewerFavBtn').addEventListener('click', () => {
  if (favorited.has(currentIndex)) favorited.delete(currentIndex); else favorited.add(currentIndex);
  document.getElementById('viewerFavBtn').classList.toggle('is-fav', favorited.has(currentIndex));
});

// Swipe support on the photo itself
let touchStartX = null;
const photoWrap = document.querySelector('.viewer-photo-wrap');
photoWrap.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
photoWrap.addEventListener('touchend', (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) {
    if (dx < 0 && currentIndex < PHOTOS.length - 1) goToPhoto(currentIndex + 1);
    else if (dx > 0 && currentIndex > 0) goToPhoto(currentIndex - 1);
  }
  touchStartX = null;
});
// Click left/right half of the photo to step through, for non-touch testing too.
photoWrap.addEventListener('click', (e) => {
  const rect = photoWrap.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  if (clickX > rect.width / 2 && currentIndex < PHOTOS.length - 1) goToPhoto(currentIndex + 1);
  else if (clickX <= rect.width / 2 && currentIndex > 0) goToPhoto(currentIndex - 1);
});

// Lock screen — swipe up (touch or mouse-drag, for desktop testing) to unlock.
const screenLock = document.getElementById('screenLock');
const iphoneScreen = document.querySelector('.iphone-screen');
const UNLOCK_THRESHOLD = 70;

function unlock() {
  screenLock.style.transform = '';
  screenLock.classList.add('is-unlocked');
  iphoneScreen.classList.add('is-unlocked');
  scrollLibraryToNewest();
}

let dragStartY = null;
function dragMove(y) {
  if (dragStartY === null) return;
  const dy = Math.min(0, y - dragStartY);
  screenLock.style.transform = `translateY(${dy}px)`;
}
function dragEnd(y) {
  if (dragStartY === null) return;
  const dy = y - dragStartY;
  dragStartY = null;
  if (dy < -UNLOCK_THRESHOLD) unlock();
  else screenLock.style.transform = '';
}

screenLock.addEventListener('touchstart', (e) => { dragStartY = e.touches[0].clientY; }, { passive: true });
screenLock.addEventListener('touchmove', (e) => dragMove(e.touches[0].clientY), { passive: true });
screenLock.addEventListener('touchend', (e) => dragEnd(e.changedTouches[0].clientY));

let mouseDragging = false;
screenLock.addEventListener('mousedown', (e) => { mouseDragging = true; dragStartY = e.clientY; });
window.addEventListener('mousemove', (e) => { if (mouseDragging) dragMove(e.clientY); });
window.addEventListener('mouseup', (e) => { if (mouseDragging) { mouseDragging = false; dragEnd(e.clientY); } });

// Tapping the hint itself also unlocks, as a click-only fallback.
document.getElementById('lockSwipeHint').addEventListener('click', unlock);
