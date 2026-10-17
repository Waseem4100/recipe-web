/* Shared helpers used by every page */
const CATEGORIES = [
  { name: 'Breakfast', emoji: '🥞' }, { name: 'Vegan', emoji: '🥗' }, { name: 'Desserts', emoji: '🍰' },
  { name: 'Lunch', emoji: '🥪' }, { name: 'Dinner', emoji: '🍛' }, { name: 'Snacks', emoji: '🍿' }
];

const Auth = {
  get token() { return localStorage.getItem('rh_token'); },
  get user() { try { return JSON.parse(localStorage.getItem('rh_user')); } catch { return null; } },
  save(data) { localStorage.setItem('rh_token', data.token); localStorage.setItem('rh_user', JSON.stringify(data.user)); },
  clear() { localStorage.removeItem('rh_token'); localStorage.removeItem('rh_user'); }
};

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(Auth.token ? { Authorization: 'Bearer ' + Auth.token } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function stars(rating, count) {
  const full = Math.round(rating);
  return `<span class="stars" aria-label="${rating} out of 5">${'★'.repeat(full)}${'☆'.repeat(5 - full)} <small>${rating ? rating + ' (' + count + ')' : 'No ratings yet'}</small></span>`;
}

function recipeCard(r) {
  return `<article class="card">
    <a href="/recipe.html?id=${r.id}"><img class="pic" loading="lazy" src="${esc(r.image)}" alt="${esc(r.title)}" onerror="this.removeAttribute('src')"></a>
    <div class="body">
      <h3><a href="/recipe.html?id=${r.id}">${esc(r.title)}</a></h3>
      <p>${esc(r.description)}</p>
      <div class="meta"><span class="tag">${esc(r.category)}</span><span class="tag ${esc(r.difficulty)}">${esc(r.difficulty)}</span><span>⏱ ${r.time} min</span></div>
      ${stars(r.rating, r.ratingCount)}
    </div></article>`;
}

function renderLayout(active) {
  const user = Auth.user;
  const link = (href, label, key) => `<a href="${href}" class="${active === key ? 'active' : ''}">${label}</a>`;
  document.body.insertAdjacentHTML('afterbegin', `
    <header><div class="wrap bar">
      <a class="logo" href="/">Recipe<span>Hub</span></a>
      <nav aria-label="Main">
        ${link('/', 'Home', 'home')}${link('/recipes.html', 'Browse Recipes', 'browse')}
        ${link('/submit.html', 'Submit Recipe', 'submit')}${link('/profile.html', user ? 'User Profile' : 'Log in', 'profile')}
      </nav></div></header>`);
  document.body.insertAdjacentHTML('beforeend', `<footer><div class="wrap">© ${new Date().getFullYear()} RecipeHub · Cook it, share it.</div></footer>`);
}

function showMsg(el, text, type = 'err') { el.innerHTML = text ? `<div class="msg ${type}" role="alert">${esc(text)}</div>` : ''; }
