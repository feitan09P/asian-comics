let allComics = [];

async function loadComics(type) {
  const grid = document.getElementById('grid');
  grid.innerHTML = '<p class="loading">Loading...</p>';

  try {
    const res = await fetch(`https://api.jikan.moe/v4/manga?type=${type}&order_by=score&sort=desc&limit=24`);
    const data = await res.json();
    allComics = data.data || [];
    renderComics(allComics);
  } catch {
    grid.innerHTML = '<p class="empty">Failed to load. Check your connection.</p>';
  }
}

function renderComics(comics) {
  const grid = document.getElementById('grid');

  if (!comics.length) {
    grid.innerHTML = '<p class="empty">No results found.</p>';
    return;
  }

  grid.innerHTML = comics.map(c => {
    const title = c.title || 'Unknown';
    const score = c.score ? c.score.toFixed(1) : '-';
    const cover = c.images?.jpg?.image_url || '';
    const url   = `https://myanimelist.net/manga/${c.mal_id}`;

    return `
      <div class="card">
        ${cover ? `<img src="${cover}" alt="${title}" loading="lazy">` : ''}
        <div class="card-body">
          <div class="card-title">${title}</div>
          <div class="card-score">Score ${score}</div>
          <a href="${url}" target="_blank" class="card-link">View on MAL</a>
        </div>
      </div>`;
  }).join('');
}

function filterComics() {
  const q = document.getElementById('search').value.toLowerCase();
  const filtered = allComics.filter(c =>
    (c.title || '').toLowerCase().includes(q) ||
    (c.title_english || '').toLowerCase().includes(q)
  );
  renderComics(filtered);
}
