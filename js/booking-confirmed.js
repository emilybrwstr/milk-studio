// This page is the redirect target Calendly sends clients to right after
// they finish booking (set under each event type's Confirmation Page ->
// "Redirect to a specific webpage" in Calendly's dashboard). Calendly can
// insert real booking details into that redirect URL as query params, two
// ways:
//   1. `a2` — custom-booking.js already bakes the full "service, add-ons —
//      Total: $X" line into the original scheduling URL as a custom-
//      question answer, and Calendly forwards a booking's original query
//      params through to the redirect, so it comes back here for free —
//      no extra setup needed.
//   2. Calendly's own merge tags (invitee name, event start time, etc.),
//      which have to be added by hand when the redirect URL is configured.
//      Whatever merge tag is used for each, map it to these exact param
//      names: `name` (invitee's name) and `when` (event start time).
// Every param below is optional — if none are present (direct visit, or an
// event not configured to redirect here) the page still reads fine as a
// generic thank-you.
const params = new URLSearchParams(location.search);

const summaryText = params.get('a2');
if (summaryText) {
  document.getElementById('confirmReceiptLine').textContent = summaryText;
  document.getElementById('confirmReceipt').hidden = false;
}

const name = params.get('name');
if (name) {
  const title = document.querySelector('.confirm-title');
  const dot = title.querySelector('.confirm-title-dot');
  title.textContent = `you're in, ${name}`;
  title.appendChild(dot);
}

const when = params.get('when');
if (when) {
  // Accept either a pre-formatted string from a Calendly merge tag, or a
  // raw ISO timestamp — format the latter into something readable.
  const parsed = new Date(when);
  const display = !isNaN(parsed) && /^\d{4}-\d{2}-\d{2}/.test(when)
    ? parsed.toLocaleString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      })
    : when;
  const whenEl = document.getElementById('confirmWhen');
  whenEl.textContent = display;
  whenEl.hidden = false;
}
