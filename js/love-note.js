const form = document.getElementById('loveNoteForm');
const submitBtn = document.getElementById('loveNoteSubmit');
const thanks = document.getElementById('loveNoteThanks');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Pinning...';

  const data = new FormData(form);
  data.append('_subject', 'New love note ♡');
  const rating = data.get('rating');
  data.set('rating', rating ? `${rating} stars` : '');

  try {
    const res = await fetch('https://formsubmit.co/ajax/emily@milkstudio.ca', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data,
    });
    if (!res.ok) throw new Error('submit failed');
    form.hidden = true;
    thanks.classList.add('is-visible');
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Pin It to the Wall';
    alert("Something went wrong sending that — mind trying again in a sec?");
  }
});
