// Custom booking builder — service + add-on picker with a live price/duration
// total. Step 4 hands off to the real Calendly event (a single event type
// configured with several selectable durations), picking whichever
// configured duration is closest to the calculated total — actual
// scheduling, availability, confirmation emails, and reminders are all
// handled by Calendly itself from that point on.
const CALENDLY_URL = 'https://calendly.com/milkstudio/gel-x-full-set-clone';
const CALENDLY_DURATIONS = [120, 180, 240, 300]; // minutes: 2/3/4/5 hr

function nearestCalendlyDuration(totalMinutes) {
  // On an exact tie between two options, prefer the longer one — running
  // short on a booked slot is worse than a little extra buffer.
  return CALENDLY_DURATIONS.reduce((closest, d) => {
    const diff = Math.abs(d - totalMinutes);
    const closestDiff = Math.abs(closest - totalMinutes);
    return diff < closestDiff || (diff === closestDiff && d > closest) ? d : closest;
  });
}

const SERVICES = [
  {
    id: 'gel-manicure',
    name: 'Gel manicure',
    price: 30,
    duration: 60,
    allowsLengthUpgrade: false,
    allowsNailArt: true,
    allowsRemoval: true,
  },
  {
    id: 'builder-gel-manicure',
    name: 'Builder gel manicure',
    price: 45,
    duration: 90,
    allowsLengthUpgrade: false,
    allowsNailArt: true,
    allowsRemoval: true,
  },
  {
    id: 'gel-x-full-set',
    name: 'Gel-X full set',
    price: 55,
    duration: 150,
    allowsLengthUpgrade: true,
    allowsNailArt: true,
    allowsRemoval: true,
  },
  {
    id: 'gel-x-full-set-no-overlay',
    name: 'Gel-X full set',
    price: 45,
    duration: 90,
    allowsLengthUpgrade: true,
    allowsNailArt: true,
    allowsRemoval: true,
  },
  {
    id: 'refill',
    name: 'Refill',
    price: 40,
    duration: 90,
    allowsLengthUpgrade: false,
    allowsNailArt: true,
    allowsRemoval: false,
  },
  {
    id: 'refill-builder',
    name: 'Refill',
    price: 35,
    duration: 90,
    allowsLengthUpgrade: false,
    allowsNailArt: true,
    allowsRemoval: false,
  },
  {
    id: 'removal-only',
    name: 'Removal',
    price: 15,
    duration: 25,
    allowsLengthUpgrade: false,
    allowsNailArt: false,
    allowsRemoval: false,
    isRemovalOnly: true,
  },
  {
    id: 'repair',
    name: 'Repair',
    price: 0,
    duration: 30,
    allowsLengthUpgrade: false,
    allowsNailArt: false,
    allowsRemoval: false,
    isRepair: true,
  },
];

const LENGTH_UPGRADES = [
  { id: 'standard', name: 'Short to medium', priceDelta: 0, durationDelta: 0 },
  { id: 'long', name: 'Long', priceDelta: 5, durationDelta: 15 },
  { id: 'extra-long', name: 'Extra long', priceDelta: 10, durationDelta: 20 },
];

// Flat, stackable nail-art picks — a client can select any combination.
const FLAT_ART_ITEMS = [
  { key: 'frenchTip', name: 'French tip', price: 5, duration: 15 },
  { key: 'catEye', name: 'Cat eye', price: 10, duration: 15 },
];

// Per-nail nail-art add-ons — each can either be a specific nail count, or
// the flat "all nails" rate (cheaper in time than 10x the per-nail rate,
// since doing every nail at once is faster per-nail in practice).
const PER_NAIL_ART_ITEMS = [
  { key: 'chrome', name: 'Isolated chrome', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  { key: 'fullChrome', name: 'Full chrome', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  { key: 'aura', name: 'Aura nails', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  { key: 'rhinestones', name: 'Rhinestones', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  { key: 'threeDElements', name: '3D elements', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  { key: 'nailPiercing', name: 'Nail piercing', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  { key: 'handPainted', name: 'Hand painted designs', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
];

// The first 2 nails in a repair booking are free (within 7 days of the
// original appointment — eligibility is confirmed by hand when following
// up, since the price builder can't know how long ago that was); any nail
// beyond those first 2 is charged per-nail on top.
const REPAIR_PAID = { pricePerNail: 10, durationPerNail: 15, freeNails: 2, min: 1, max: 10 };

// Add-on for removing an existing set on the same visit as a new one — the
// standalone soak-off tiers live on their own "removal-only" service
// instead, since they don't need a new set at all.
const REMOVAL_TYPES = [
  { id: 'own', name: 'Existing set removal — my own soft gel', priceDelta: 5, durationDelta: 20 },
  { id: 'other', name: "Existing set removal — another tech's soft gel", priceDelta: 10, durationDelta: 25 },
];

// Whose gel is being removed, for a removal-only booking (no new set). The
// base "removal-only" service price/duration already covers "my own soft
// gel"; this only adds the delta for the other-tech tier.
const REMOVAL_ONLY_TYPES = [
  { id: 'own', name: 'My own soft gel', priceDelta: 0, durationDelta: 0 },
  { id: 'other', name: "Another tech's soft gel", priceDelta: 5, durationDelta: 5 },
];

const STORAGE_KEY = 'cb-state';

const state = {
  step: 1,
  serviceId: null,
  lengthId: 'standard',
  frenchTip: false,
  catEye: false,
  chrome: { qty: 0, all: false },
  fullChrome: { qty: 0, all: false },
  aura: { qty: 0, all: false },
  rhinestones: { qty: 0, all: false },
  threeDElements: { qty: 0, all: false },
  nailPiercing: { qty: 0, all: false },
  handPainted: { qty: 0, all: false },
  repairQty: 2,
  removalNeeded: false,
  removalTypeId: 'own',
  removalOnlyTypeId: 'own',
};

function formatPrice(n) {
  return n === 0 ? 'Free' : `$${n}`;
}

function formatDuration(totalMin) {
  if (totalMin <= 0) return '0 min';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h}h ${m}m`;
}

function computeSummary() {
  const service = SERVICES.find((s) => s.id === state.serviceId) || null;
  const lineItems = [];
  let price = 0;
  let duration = 0;

  const add = (label, p, d) => {
    lineItems.push({ label, price: p, duration: d });
    price += p;
    duration += d;
  };

  if (service) {
    if (service.isRepair) {
      // Replaces the generic base-service line entirely: the first
      // REPAIR_PAID.freeNails are covered by service.duration at no
      // charge, and any nail beyond that adds its own price/time on top.
      const paidQty = Math.max(0, state.repairQty - REPAIR_PAID.freeNails);
      add(
        `Repair — ${state.repairQty} nail${state.repairQty === 1 ? '' : 's'}`,
        REPAIR_PAID.pricePerNail * paidQty,
        service.duration + REPAIR_PAID.durationPerNail * paidQty
      );
    } else {
      add(service.name, service.price, service.duration);
    }

    if (service.allowsLengthUpgrade && state.lengthId !== 'standard') {
      const len = LENGTH_UPGRADES.find((l) => l.id === state.lengthId);
      if (len) add(len.name, len.priceDelta, len.durationDelta);
    }

    if (service.allowsNailArt) {
      FLAT_ART_ITEMS.forEach((item) => {
        if (state[item.key]) add(item.name, item.price, item.duration);
      });
      PER_NAIL_ART_ITEMS.forEach((item) => {
        const addonState = state[item.key];
        if (addonState.all) {
          add(`${item.name} — all nails`, item.allPrice, item.allDuration);
        } else if (addonState.qty > 0) {
          add(`${item.name} × ${addonState.qty}`, item.pricePerNail * addonState.qty, item.durationPerNail * addonState.qty);
        }
      });
    }

    if (service.allowsRemoval && state.removalNeeded) {
      const t = REMOVAL_TYPES.find((t) => t.id === state.removalTypeId) || REMOVAL_TYPES[0];
      add(t.name, t.priceDelta, t.durationDelta);
    }

    if (service.isRemovalOnly) {
      const t = REMOVAL_ONLY_TYPES.find((t) => t.id === state.removalOnlyTypeId) || REMOVAL_ONLY_TYPES[0];
      if (t.priceDelta || t.durationDelta) add(t.name, t.priceDelta, t.durationDelta);
    }
  }

  return { service, lineItems, totalPrice: price, totalDuration: duration };
}

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const steps = {
  1: document.getElementById('step-1'),
  2: document.getElementById('step-2'),
  3: document.getElementById('step-3'),
  4: document.getElementById('step-4'),
};
const progress = document.getElementById('cbProgress');
const summaryBar = document.getElementById('summaryBar');
const summaryPrice = document.getElementById('summaryPrice');
const summaryDuration = document.getElementById('summaryDuration');
const backBtn = document.getElementById('backBtn');
const nextBtn = document.getElementById('nextBtn');
const lengthSection = document.getElementById('lengthSection');
const removalOnlySection = document.getElementById('removalOnlySection');
const step2SubDefault = document.getElementById('step2SubDefault');
const step2SubRemovalOnly = document.getElementById('step2SubRemovalOnly');
const nailArtSection = document.getElementById('nailArtSection');
const repairSection = document.getElementById('repairSection');
const removalSection = document.getElementById('removalSection');
const removalToggle = document.getElementById('removalToggle');
const removalSubchoices = document.getElementById('removalSubchoices');
const frenchTipToggle = document.getElementById('frenchTipToggle');
const catEyeToggle = document.getElementById('catEyeToggle');
const repairMinus = document.getElementById('repairMinus');
const repairPlus = document.getElementById('repairPlus');
const repairValue = document.getElementById('repairValue');
const reviewList = document.getElementById('reviewList');
const reviewTotalPrice = document.getElementById('reviewTotalPrice');
const reviewTotalDuration = document.getElementById('reviewTotalDuration');
const confirmationRecap = document.getElementById('confirmationRecap');
const confirmationDuration = document.getElementById('confirmationDuration');
const calendlyEmbed = document.getElementById('calendlyEmbed');

const reducesMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------------------
// Persistence — sessionStorage only, cleared once the flow completes.
// ---------------------------------------------------------------------------
function saveState() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

function loadState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.step === 4) saved.step = 3; // never resume into the terminal screen
    Object.assign(state, saved);
  } catch (_) {}
}

function applyStateToInputs() {
  if (state.serviceId) {
    const el = document.querySelector(`input[name="service"][value="${state.serviceId}"]`);
    if (el) el.checked = true;
  }
  const lengthEl = document.querySelector(`input[name="length"][value="${state.lengthId}"]`);
  if (lengthEl) lengthEl.checked = true;

  frenchTipToggle.checked = state.frenchTip;
  catEyeToggle.checked = state.catEye;

  PER_NAIL_ART_ITEMS.forEach((item) => {
    const addonState = state[item.key];
    const allBox = document.querySelector(`[data-addon-all="${item.key}"]`);
    if (allBox) allBox.checked = addonState.all;
  });

  repairValue.textContent = state.repairQty;

  removalToggle.checked = state.removalNeeded;
  const removalTypeEl = document.querySelector(`input[name="removal-type"][value="${state.removalTypeId}"]`);
  if (removalTypeEl) removalTypeEl.checked = true;

  const removalOnlyEl = document.querySelector(`input[name="removal-only-type"][value="${state.removalOnlyTypeId}"]`);
  if (removalOnlyEl) removalOnlyEl.checked = true;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
function updateCardSelectedClasses() {
  document.querySelectorAll('.cb-card').forEach((card) => {
    const input = card.querySelector('input');
    card.classList.toggle('is-selected', !!input && input.checked);
  });
  document.querySelectorAll('.cb-toggle-card').forEach((card) => {
    const input = card.querySelector('input');
    card.classList.toggle('is-selected', !!input && input.checked);
  });
}

function updatePerNailStepperUI() {
  PER_NAIL_ART_ITEMS.forEach((item) => {
    const addonState = state[item.key];
    const valueEl = document.querySelector(`[data-addon-value="${item.key}"]`);
    const minusBtn = document.querySelector(`[data-addon="${item.key}"][data-dir="-1"]`);
    const plusBtn = document.querySelector(`[data-addon="${item.key}"][data-dir="1"]`);
    if (!valueEl) return;
    valueEl.textContent = addonState.all ? 'All' : addonState.qty;
    minusBtn.disabled = addonState.all || addonState.qty <= 0;
    plusBtn.disabled = addonState.all || addonState.qty >= 10;
  });
}

function render() {
  const summary = computeSummary();
  const service = summary.service;

  // Summary bar
  summaryPrice.textContent = service ? formatPrice(summary.totalPrice) : '$0';
  summaryDuration.textContent = service ? formatDuration(summary.totalDuration) : 'Select a service to start';

  // Conditional sections
  lengthSection.hidden = !(service && service.allowsLengthUpgrade);
  nailArtSection.hidden = !(service && service.allowsNailArt);
  repairSection.hidden = !(service && service.isRepair);
  removalSection.hidden = !(service && service.allowsRemoval);
  removalSubchoices.hidden = !state.removalNeeded;
  removalOnlySection.hidden = !(service && service.isRemovalOnly);
  step2SubDefault.hidden = !!(service && service.isRemovalOnly);
  step2SubRemovalOnly.hidden = !(service && service.isRemovalOnly);

  updateCardSelectedClasses();
  updatePerNailStepperUI();
  repairValue.textContent = state.repairQty;
  repairMinus.disabled = state.repairQty <= REPAIR_PAID.min;
  repairPlus.disabled = state.repairQty >= REPAIR_PAID.max;

  // Continue/back button state per step
  backBtn.hidden = state.step === 1 || state.step === 4;
  nextBtn.hidden = state.step === 4;

  if (state.step === 1) {
    nextBtn.textContent = 'Continue';
    nextBtn.disabled = !state.serviceId;
  } else if (state.step === 2) {
    nextBtn.textContent = 'Continue';
    nextBtn.disabled = false;
  } else if (state.step === 3) {
    nextBtn.textContent = 'Reserve This Look';
    nextBtn.disabled = false;
  }

  // Review step content — laid out as line items on the guest-check receipt
  if (state.step === 3) {
    reviewList.innerHTML = '';
    summary.lineItems.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'cb-receipt-line';
      row.innerHTML = `
        <span class="cb-receipt-line-name">${item.label}</span>
        <span class="cb-receipt-line-price">${item.price > 0 ? '+' : ''}${formatPrice(item.price)}</span>`;
      reviewList.appendChild(row);
    });
    reviewTotalPrice.textContent = formatPrice(summary.totalPrice);
    reviewTotalDuration.textContent = formatDuration(summary.totalDuration);
  }

  // Confirmation step content
  if (state.step === 4) {
    const extras = summary.lineItems.slice(1).map((i) => i.label.replace(/^Removal — /, ''));
    const extrasText = extras.length ? ` with ${extras.join(', ')}` : '';
    confirmationRecap.textContent = `${summary.service.name}${extrasText} — ${formatDuration(summary.totalDuration)} · ${formatPrice(summary.totalPrice)}`;
    confirmationDuration.textContent = formatDuration(summary.totalDuration);
  }

  // Progress indicator
  progress.hidden = state.step === 4;
  progress.querySelectorAll('.cb-progress-step').forEach((el) => {
    const n = Number(el.dataset.step);
    el.classList.toggle('is-active', n === state.step);
    el.classList.toggle('is-done', n < state.step);
  });

  summaryBar.hidden = state.step === 4;

  saveState();
}

// ---------------------------------------------------------------------------
// Calendly hand-off — real scheduling, availability, confirmation emails
// and reminders all happen on Calendly's side from here on.
// ---------------------------------------------------------------------------
let calendlyLoadedFor = null; // avoid re-initializing the same URL twice

// Builds the plain-text line "Gel-X full set, French tip — Total: $65" so
// the exact set + price chosen shows up on Calendly's own event page and
// confirmation email, not just the duration.
function buildBookingSummaryText(summary) {
  const parts = summary.lineItems.map((item) => item.label);
  return `${parts.join(', ')} — Total: ${formatPrice(summary.totalPrice)}`;
}

function loadCalendlyEmbed() {
  const summary = computeSummary();
  if (!summary.service) return;

  const duration = nearestCalendlyDuration(summary.totalDuration);
  const summaryText = buildBookingSummaryText(summary);
  const url = `${CALENDLY_URL}?duration=${duration}&a2=${encodeURIComponent(summaryText)}`;
  if (calendlyLoadedFor === url) return; // already showing this exact selection
  calendlyLoadedFor = url;

  const init = () => {
    calendlyEmbed.innerHTML = '';
    window.Calendly.initInlineWidget({
      url,
      parentElement: calendlyEmbed,
    });
  };

  if (window.Calendly) {
    init();
    return;
  }

  calendlyEmbed.innerHTML = '<p class="cb-calendly-embed-loading">Loading the calendar…</p>';
  const start = Date.now();
  const poll = setInterval(() => {
    if (window.Calendly) {
      clearInterval(poll);
      init();
    } else if (Date.now() - start > 8000) {
      clearInterval(poll);
      calendlyEmbed.innerHTML = `<p class="cb-calendly-embed-loading">The calendar didn't load — <a href="${url}" class="text-link" target="_blank" rel="noopener">open it in a new tab</a> instead.</p>`;
    }
  }, 150);
}

// ---------------------------------------------------------------------------
// Step navigation
// ---------------------------------------------------------------------------
function goToStep(n) {
  state.step = n;
  Object.values(steps).forEach((el) => { el.hidden = true; });
  steps[n].hidden = false;
  render();

  const heading = steps[n].querySelector('.cb-step-heading, .cb-receipt');
  if (heading) {
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }
  steps[n].scrollIntoView({ block: 'start', behavior: reducesMotion ? 'auto' : 'smooth' });

  if (n === 4) {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) {}
    loadCalendlyEmbed();
  }
}

nextBtn.addEventListener('click', () => {
  if (nextBtn.disabled) return;
  if (state.step < 4) goToStep(state.step + 1);
});
backBtn.addEventListener('click', () => {
  if (state.step > 1) goToStep(state.step - 1);
});

// ---------------------------------------------------------------------------
// Field wiring
// ---------------------------------------------------------------------------
document.querySelectorAll('input[name="service"]').forEach((input) => {
  input.addEventListener('change', () => {
    state.serviceId = input.value;
    // Reset selections that don't carry over cleanly between services.
    state.lengthId = 'standard';
    const standard = document.querySelector('input[name="length"][value="standard"]');
    if (standard) standard.checked = true;
    state.removalOnlyTypeId = 'own';
    const removalOnlyOwn = document.querySelector('input[name="removal-only-type"][value="own"]');
    if (removalOnlyOwn) removalOnlyOwn.checked = true;
    state.removalTypeId = 'own';
    const removalOwn = document.querySelector('input[name="removal-type"][value="own"]');
    if (removalOwn) removalOwn.checked = true;
    render();
  });
});

document.querySelectorAll('input[name="length"]').forEach((input) => {
  input.addEventListener('change', () => {
    state.lengthId = input.value;
    render();
  });
});

document.querySelectorAll('input[name="removal-only-type"]').forEach((input) => {
  input.addEventListener('change', () => {
    state.removalOnlyTypeId = input.value;
    render();
  });
});

frenchTipToggle.addEventListener('change', () => {
  state.frenchTip = frenchTipToggle.checked;
  render();
});
catEyeToggle.addEventListener('change', () => {
  state.catEye = catEyeToggle.checked;
  render();
});

PER_NAIL_ART_ITEMS.forEach((item) => {
  document.querySelectorAll(`[data-addon="${item.key}"]`).forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = Number(btn.dataset.dir);
      const addonState = state[item.key];
      addonState.qty = Math.max(0, Math.min(10, addonState.qty + dir));
      render();
    });
  });
  const allBox = document.querySelector(`[data-addon-all="${item.key}"]`);
  allBox.addEventListener('change', () => {
    state[item.key].all = allBox.checked;
    render();
  });
});

repairMinus.addEventListener('click', () => {
  state.repairQty = Math.max(REPAIR_PAID.min, state.repairQty - 1);
  render();
});
repairPlus.addEventListener('click', () => {
  state.repairQty = Math.min(REPAIR_PAID.max, state.repairQty + 1);
  render();
});

removalToggle.addEventListener('change', () => {
  state.removalNeeded = removalToggle.checked;
  render();
});

document.querySelectorAll('input[name="removal-type"]').forEach((input) => {
  input.addEventListener('change', () => {
    state.removalTypeId = input.value;
    render();
  });
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
loadState();
applyStateToInputs();
Object.values(steps).forEach((el) => { el.hidden = true; });
steps[state.step].hidden = false;
render();
