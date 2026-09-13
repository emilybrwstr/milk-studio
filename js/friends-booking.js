// Fork of custom-booking.js for the discreet friends & family flow — only
// reachable via the hidden sticker link on the home page (see index.html),
// never linked anywhere else. Kept as a separate file on purpose so this
// page can be tweaked (copy, services, whatever) without any risk of
// touching the real paid booking flow, and vice versa.
//
// Steps 1-3 (service + add-ons + review) work exactly like the real
// builder, so the appointment still books the right amount of time — the
// only difference is step 4, which always hands off to the complimentary,
// no-deposit event below instead of a paid one.
const FRIENDS_CALENDLY = {
  url: 'https://calendly.com/milkstudio/friendsonly',
  durations: [90, 150, 210, 270], // 1.5 / 2.5 / 3.5 / 4.5 hr
};

function nearestCalendlyDuration(totalMinutes, durations) {
  // On an exact tie between two options, prefer the longer one — running
  // short on a booked slot is worse than a little extra buffer.
  return durations.reduce((closest, d) => {
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
    calendlyGroup: 'gel-manicure',
  },
  {
    id: 'builder-gel-manicure',
    name: 'Builder gel manicure',
    price: 45,
    duration: 90,
    allowsLengthUpgrade: false,
    allowsNailArt: true,
    allowsRemoval: true,
    calendlyGroup: 'gel-manicure',
  },
  {
    id: 'gel-x-full-set',
    name: 'Gel-X full set (with overlay)',
    price: 60,
    duration: 150,
    allowsLengthUpgrade: true,
    allowsNailArt: true,
    allowsRemoval: true,
    calendlyGroup: 'gel-x',
  },
  {
    id: 'gel-x-full-set-no-overlay',
    name: 'Gel-X full set (no overlay)',
    price: 45,
    duration: 90,
    allowsLengthUpgrade: true,
    allowsNailArt: true,
    allowsRemoval: true,
    calendlyGroup: 'gel-x',
  },
  {
    id: 'refill',
    name: 'Refill',
    price: 45,
    duration: 90,
    allowsLengthUpgrade: false,
    allowsNailArt: true,
    allowsRemoval: false,
    calendlyGroup: 'gel-x',
  },
  {
    id: 'refill-builder',
    name: 'Refill',
    price: 35,
    duration: 90,
    allowsLengthUpgrade: false,
    allowsNailArt: true,
    allowsRemoval: false,
    calendlyGroup: 'gel-manicure',
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
    calendlyGroup: 'repair-removal',
  },
  {
    id: 'repair',
    name: 'Repair',
    price: 0,
    duration: 30,
    allowsLengthUpgrade: false,
    allowsNailArt: false,
    calendlyGroup: 'repair-removal',
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
  { key: 'frenchTip', name: 'French tip', price: 10, duration: 15 },
  { key: 'catEye', name: 'Cat eye', price: 10, duration: 15 },
];

// Per-nail nail-art add-ons — each can either be a specific nail count, or
// the flat "all nails" rate (cheaper in time than 10x the per-nail rate,
// since doing every nail at once is faster per-nail in practice).
const PER_NAIL_ART_ITEMS = [
  { key: 'chrome', name: 'Isolated chrome', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  { key: 'fullChrome', name: 'Full chrome', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  { key: 'aura', name: 'Aura nails', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  { key: 'ombre', name: 'Ombré nails', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  { key: 'rhinestones', name: 'Nail gems — up to 6 per nail', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  // No "all nails" flat rate here — heavier gem work doesn't get a bulk
  // option, just a straight per-nail count.
  { key: 'rhinestonesHeavy', name: 'Nail gems — more than 6 per nail', pricePerNail: 3, durationPerNail: 8 },
  { key: 'threeDElements', name: '3D elements', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  { key: 'nailPiercing', name: 'Nail piercing', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  { key: 'handPainted', name: 'Hand painted — simple', pricePerNail: 2, durationPerNail: 5, allPrice: 15, allDuration: 30 },
  // Complex hand painted is priced at the full per-nail rate with no bulk
  // discount when every nail is selected — it's involved enough work that
  // doing all 10 doesn't save time the way the simpler add-ons do.
  { key: 'handPaintedComplex', name: 'Hand painted — complex', pricePerNail: 4, durationPerNail: 8, allPrice: 40, allDuration: 90 },
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
  { id: 'other-hard', name: "Existing set removal — another tech's acrylic or hard gel", priceDelta: 30, durationDelta: 45 },
];

// Whose gel is being removed, for a removal-only booking (no new set). The
// base "removal-only" service price/duration already covers "my own soft
// gel" ($15/25min); each delta below is on top of that base. Acrylic/hard
// gel from another tech totals $30/45min ($15 base + this $15/20min delta).
const REMOVAL_ONLY_TYPES = [
  { id: 'own', name: 'My own soft gel', priceDelta: 0, durationDelta: 0 },
  { id: 'other', name: "Another tech's soft gel", priceDelta: 5, durationDelta: 5 },
  { id: 'other-hard', name: "Another tech's acrylic or hard gel", priceDelta: 15, durationDelta: 20 },
];

// Separate storage key from the real booking flow's — kept isolated so
// having both open in the same browser tab can't mix up either one's state.
const STORAGE_KEY = 'cb-friend-state';

const state = {
  step: 1,
  serviceId: null,
  lengthId: 'standard',
  frenchTip: false,
  catEye: false,
  chrome: { qty: 0, all: false },
  fullChrome: { qty: 0, all: false },
  aura: { qty: 0, all: false },
  ombre: { qty: 0, all: false },
  rhinestones: { qty: 0, all: false },
  rhinestonesHeavy: { qty: 0, all: false },
  threeDElements: { qty: 0, all: false },
  nailPiercing: { qty: 0, all: false },
  handPainted: { qty: 0, all: false },
  handPaintedComplex: { qty: 0, all: false },
  repairQty: 2,
  removalNeeded: false,
  removalTypeId: 'own',
  removalOnlyTypeId: 'own',
  editDiscount: null,
  editLookTitle: null,
};

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
      // REPAIR_PAID.freeNails are covered by service.duration alone, and
      // any nail beyond that adds its own time on top.
      const extraQty = Math.max(0, state.repairQty - REPAIR_PAID.freeNails);
      add(
        `Repair — ${state.repairQty} nail${state.repairQty === 1 ? '' : 's'}`,
        0,
        service.duration + REPAIR_PAID.durationPerNail * extraQty
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

    // "the edit" bookings discount everything past the base service line —
    // the base itself (lineItems[0]) always stays full price.
    if (state.editDiscount && lineItems.length > 1) {
      const designSubtotal = lineItems.slice(1).reduce((sum, item) => sum + item.price, 0);
      const discountAmt = Math.round(designSubtotal * state.editDiscount);
      if (discountAmt > 0) {
        lineItems.push({
          label: `the edit discount (${Math.round(state.editDiscount * 100)}%)`,
          price: -discountAmt,
          duration: 0,
        });
        price -= discountAmt;
      }
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
const repairStepperNote = document.getElementById('repairStepperNote');
const reviewEditServer = document.getElementById('reviewEditServer');
const reviewEditTable = document.getElementById('reviewEditTable');
const reviewNames = document.getElementById('reviewNames');
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
    nextBtn.textContent = 'Lock It In';
    nextBtn.disabled = false;
  }

  // Review step content — each line item is one dotted-leader row (name,
  // then time), styled after the site's own menu rows (see
  // .menu-item-leader) rather than the paid flow's photographed receipt.
  if (state.step === 3) {
    reviewEditServer.hidden = !state.editLookTitle;
    reviewEditTable.hidden = !state.editLookTitle;
    reviewEditTable.textContent = state.editLookTitle || '';
    reviewNames.innerHTML = '';
    summary.lineItems.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'fb-tab-row';

      const name = document.createElement('span');
      name.className = 'fb-tab-name';
      name.textContent = item.label;

      const leader = document.createElement('span');
      leader.className = 'fb-tab-leader';
      leader.setAttribute('aria-hidden', 'true');

      const time = document.createElement('span');
      time.className = 'fb-tab-time';
      time.textContent = item.duration > 0 ? `+${formatDuration(item.duration)}` : '—';

      row.append(name, leader, time);
      reviewNames.appendChild(row);
    });
    reviewTotalPrice.textContent = formatDuration(summary.totalDuration);
    reviewTotalDuration.textContent = formatDuration(summary.totalDuration);
  }

  // Confirmation step content
  if (state.step === 4) {
    const extras = summary.lineItems.slice(1).map((i) => i.label.replace(/^Removal — /, ''));
    const extrasText = extras.length ? ` with ${extras.join(', ')}` : '';
    const editPrefix = state.editLookTitle ? `the edit — ${state.editLookTitle}: ` : '';
    confirmationRecap.textContent = `${editPrefix}${summary.service.name}${extrasText} — ${formatDuration(summary.totalDuration)}`;
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

// Builds the plain-text line "Gel-X full set, French tip — Total time: 2h
// 45m" so the exact set chosen shows up on Calendly's own event page and
// confirmation email, with no pricing anywhere on this complimentary flow.
function buildBookingSummaryText(summary) {
  const parts = summary.lineItems.map((item) => item.label);
  const editPrefix = state.editLookTitle ? `[the edit: ${state.editLookTitle}] ` : '';
  return `${editPrefix}${parts.join(', ')} — Total time: ${formatDuration(summary.totalDuration)}`;
}

function loadCalendlyEmbed() {
  const summary = computeSummary();
  if (!summary.service) return;

  const group = FRIENDS_CALENDLY;
  const duration = nearestCalendlyDuration(summary.totalDuration, group.durations);
  const summaryText = buildBookingSummaryText(summary);
  const url = `${group.url}?duration=${duration}&a2=${encodeURIComponent(summaryText)}`;
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

  const heading = steps[n].querySelector('.cb-step-heading, .fb-tab');
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
  if (allBox) {
    allBox.addEventListener('change', () => {
      state[item.key].all = allBox.checked;
      render();
    });
  }
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
