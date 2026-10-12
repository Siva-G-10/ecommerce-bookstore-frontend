import {
  ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, Heart, LockKeyhole,
  Mail, Minus, PackageCheck, Plus, Search, ShoppingBag, Sparkles, Trash2, Truck, X, createIcons,
} from 'lucide';
import './style.css';

const books = [
  { id: 'midnight-library', title: 'The Midnight Library', author: 'Matt Haig', isbn: '9780525559474', category: 'Fiction', price: 18, rating: 4.9, badge: 'BOOKSELLER PICK', accent: '#d6e3cb' },
  { id: 'tomorrow', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', isbn: '9780593321201', category: 'Fiction', price: 19, rating: 4.8, badge: 'CAN’T PUT IT DOWN', accent: '#efc7ab' },
  { id: 'cerulean-sea', title: 'The House in the Cerulean Sea', author: 'TJ Klune', isbn: '9781250217288', category: 'Fantasy', price: 18.99, rating: 4.7, badge: '', accent: '#b9d9da' },
  { id: 'silent-patient', title: 'The Silent Patient', author: 'Alex Michaelides', isbn: '9781250301697', category: 'Mystery', price: 17.5, rating: 4.6, badge: 'A PAGE-TURNER', accent: '#d9b9b3' },
  { id: 'pachinko', title: 'Pachinko', author: 'Min Jin Lee', isbn: '9781455563937', category: 'Fiction', price: 18.5, rating: 4.8, badge: '', accent: '#e0c3a0' },
  { id: 'crying-in-h-mart', title: 'Crying in H Mart', author: 'Michelle Zauner', isbn: '9780525657743', category: 'Nonfiction', price: 18.99, rating: 4.7, badge: 'STAFF FAVOURITE', accent: '#e9c9c0' },
  { id: 'project-hail-mary', title: 'Project Hail Mary', author: 'Andy Weir', isbn: '9780593135204', category: 'Sci-Fi', price: 20, rating: 4.9, badge: 'ONE MORE CHAPTER', accent: '#d4d5b2' },
  { id: 'educated', title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', category: 'Nonfiction', price: 17, rating: 4.8, badge: '', accent: '#c7c5b6' },
];
const categories = ['All books', 'Fiction', 'Sci-Fi', 'Fantasy', 'Mystery', 'Nonfiction'];
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const icons = { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, Heart, LockKeyhole, Mail, Minus, PackageCheck, Plus, Search, ShoppingBag, Sparkles, Trash2, Truck, X };
const readStored = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const state = {
  category: 'All books', query: '', sort: 'featured', savedOnly: false,
  saved: readStored('papertrail-saved', []), cart: readStored('papertrail-cart', {}),
};
const $ = (selector) => document.querySelector(selector);
let toastTimer;
let lastFocus;

function updateIcons() { createIcons({ icons, attrs: { 'stroke-width': 1.7 } }); }
function saveState() {
  localStorage.setItem('papertrail-saved', JSON.stringify(state.saved));
  localStorage.setItem('papertrail-cart', JSON.stringify(state.cart));
}
function filteredBooks() {
  const query = state.query.trim().toLocaleLowerCase();
  let result = books.filter((book) =>
    (state.category === 'All books' || book.category === state.category) &&
    (!state.savedOnly || state.saved.includes(book.id)) &&
    (!query || `${book.title} ${book.author} ${book.category}`.toLocaleLowerCase().includes(query))
  );
  const sorting = {
    rating: (a, b) => b.rating - a.rating,
    'price-low': (a, b) => a.price - b.price,
    'price-high': (a, b) => b.price - a.price,
    title: (a, b) => a.title.localeCompare(b.title),
  };
  if (sorting[state.sort]) result = [...result].sort(sorting[state.sort]);
  return result;
}
function renderFilters() {
  $('#filterTabs').innerHTML = categories.map((category) => {
    const active = state.category === category;
    return `<button class="filter-tab${active ? ' filter-tab-active' : ''}" type="button" data-category="${category}" aria-pressed="${active}">${category === 'All books' ? 'Everything' : category}</button>`;
  }).join('');
  document.querySelectorAll('[data-nav-category]').forEach((link) => {
    link.classList.toggle('nav-link-active', link.dataset.navCategory === state.category);
  });
}
function renderBooks() {
  const result = filteredBooks();
  $('#bookGrid').innerHTML = result.map((book, index) => {
    const saved = state.saved.includes(book.id);
    return `<article class="book-card" style="--cover-accent:${book.accent};--card-order:${index}">
      <div class="book-artwork">${book.badge ? `<span class="book-badge">${book.badge}</span>` : ''}
        <button class="save-book${saved ? ' is-saved' : ''}" type="button" data-save="${book.id}" aria-label="${saved ? 'Remove' : 'Save'} ${book.title}" aria-pressed="${saved}"><i data-lucide="heart"></i></button>
        <div class="cover-fallback">${book.title}<small>${book.author}</small></div>
        <img class="book-cover" src="https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg" alt="Cover of ${book.title} by ${book.author}" loading="lazy" />
      </div>
      <div class="book-info"><div class="book-meta"><span>${book.category}</span><span class="rating"><span aria-hidden="true">★</span> ${book.rating.toFixed(1)}</span></div>
        <h3>${book.title}</h3><p class="book-author">by ${book.author}</p>
        <div class="book-card-bottom"><span class="book-price">${money.format(book.price)}</span><button class="add-to-bag" type="button" data-add="${book.id}" aria-label="Add ${book.title} to bag"><i data-lucide="plus"></i><span>Add</span></button></div>
      </div></article>`;
  }).join('');
  const empty = result.length === 0;
  $('#bookGrid').hidden = empty;
  $('#emptyState').hidden = !empty;
  const searchSuffix = state.query.trim() ? ` for “${escapeHtml(state.query.trim())}”` : '';
  $('#resultsLabel').textContent = state.savedOnly
    ? `${result.length} saved ${result.length === 1 ? 'book' : 'books'}${searchSuffix}`
    : state.category === 'All books' && !state.query.trim()
      ? 'A few favourites, picked by our booksellers'
      : `${result.length} ${result.length === 1 ? 'book' : 'books'}${state.category !== 'All books' ? ` on the ${state.category} shelf` : ''}${searchSuffix}`;
  $('#clearFilters').hidden = !state.query && state.category === 'All books' && !state.savedOnly;
  renderFilters();
  updateIcons();
}
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function renderHeader() {
  const count = Object.values(state.cart).reduce((total, quantity) => total + quantity, 0);
  $('#cartCount').textContent = count;
  $('#cartCount').classList.toggle('has-items', count > 0);
  $('#savedCount').textContent = state.saved.length;
  $('#savedCount').hidden = !state.saved.length;
  $('#savedToggle').classList.toggle('saved-toggle-active', state.savedOnly);
  $('#savedToggle').setAttribute('aria-pressed', String(state.savedOnly));
  $('#savedToggle').setAttribute('aria-label', state.savedOnly ? 'Show all books' : 'Show saved books');
}
function renderCart() {
  const entries = Object.entries(state.cart).filter(([id, qty]) => books.some((book) => book.id === id) && qty > 0);
  const subtotal = entries.reduce((sum, [id, qty]) => sum + books.find((book) => book.id === id).price * qty, 0);
  const count = entries.reduce((sum, [, qty]) => sum + qty, 0);
  const empty = entries.length === 0;
  $('#drawerItemCount').textContent = `(${count})`;
  $('#cartEmpty').hidden = !empty;
  $('#drawerFooter').hidden = empty;
  $('#cartItems').hidden = empty;
  $('#cartItems').innerHTML = entries.map(([id, quantity]) => {
    const book = books.find((item) => item.id === id);
    return `<article class="cart-item"><div class="cart-item-cover" style="--cover-accent:${book.accent}"><img src="https://covers.openlibrary.org/b/isbn/${book.isbn}-S.jpg" alt="" loading="lazy" /></div>
      <div class="cart-item-details"><h3>${book.title}</h3><p>${book.author}</p><strong>${money.format(book.price)}</strong>
      <div class="quantity-control" aria-label="Quantity for ${book.title}"><button type="button" data-quantity="${id}" data-delta="-1" aria-label="Decrease quantity"><i data-lucide="minus"></i></button><span>${quantity}</span><button type="button" data-quantity="${id}" data-delta="1" aria-label="Increase quantity"><i data-lucide="plus"></i></button></div></div>
      <button class="remove-item" type="button" data-remove="${id}" aria-label="Remove ${book.title} from bag"><i data-lucide="trash-2"></i></button></article>`;
  }).join('');
  const away = Math.max(0, 40 - subtotal);
  $('#shippingProgress').innerHTML = `<p><i data-lucide="truck"></i> ${away ? `Add <strong>${money.format(away)}</strong> for complimentary shipping` : 'You’ve unlocked complimentary shipping!'}</p><div class="progress-track"><span style="width:${Math.min(100, subtotal / 40 * 100)}%"></span></div>`;
  $('#subtotalValue').textContent = money.format(subtotal);
  renderHeader();
  updateIcons();
}
function render() { renderBooks(); renderCart(); renderHeader(); }
function showToast(message) {
  $('#toastMessage').textContent = message;
  $('#toast').classList.add('toast-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('toast-visible'), 2600);
}
function openCart() {
  lastFocus = document.activeElement;
  $('#cartDrawer').inert = false;
  $('#cartDrawer').setAttribute('aria-hidden', 'false');
  $('#drawerBackdrop').hidden = false;
  document.body.classList.add('drawer-open');
  $('#closeCart').focus();
}
function closeCart() {
  $('#cartDrawer').inert = true;
  $('#cartDrawer').setAttribute('aria-hidden', 'true');
  $('#drawerBackdrop').hidden = true;
  document.body.classList.remove('drawer-open');
  if (lastFocus instanceof HTMLElement) lastFocus.focus();
}
function showDialog(title, message) {
  $('#dialogTitle').textContent = title;
  $('#dialogMessage').textContent = message;
  $('#confirmationDialog').showModal();
}
function resetFilters() {
  state.category = 'All books'; state.query = ''; state.savedOnly = false;
  $('#searchInput').value = ''; render();
}
$('#filterTabs').addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (button) { state.category = button.dataset.category; state.savedOnly = false; render(); }
});
document.querySelectorAll('[data-nav-category]').forEach((link) => link.addEventListener('click', () => {
  state.category = link.dataset.navCategory; state.savedOnly = false; render();
}));
$('#bookGrid').addEventListener('click', (event) => {
  const add = event.target.closest('[data-add]');
  const save = event.target.closest('[data-save]');
  if (add) {
    const book = books.find((item) => item.id === add.dataset.add);
    state.cart[book.id] = (state.cart[book.id] || 0) + 1;
    saveState(); renderCart(); showToast(`${book.title} added to your bag`);
  }
  if (save) {
    state.saved = state.saved.includes(save.dataset.save) ? state.saved.filter((id) => id !== save.dataset.save) : [...state.saved, save.dataset.save];
    saveState(); render();
  }
});
$('#searchForm').addEventListener('submit', (event) => event.preventDefault());
$('#searchInput').addEventListener('input', (event) => { state.query = event.target.value; renderBooks(); });
$('#sortSelect').addEventListener('change', (event) => { state.sort = event.target.value; renderBooks(); });
$('#clearFilters').addEventListener('click', resetFilters);
$('#emptyReset').addEventListener('click', resetFilters);
$('#savedToggle').addEventListener('click', () => {
  state.savedOnly = !state.savedOnly; state.category = 'All books'; render();
  $('#shop').scrollIntoView({ behavior: 'smooth' });
});
$('#cartToggle').addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeCart);
$('#continueShopping').addEventListener('click', closeCart);
$('#drawerBackdrop').addEventListener('click', closeCart);
$('#cartItems').addEventListener('click', (event) => {
  const quantityButton = event.target.closest('[data-quantity]');
  const removeButton = event.target.closest('[data-remove]');
  if (quantityButton) {
    const id = quantityButton.dataset.quantity;
    const quantity = (state.cart[id] || 0) + Number(quantityButton.dataset.delta);
    if (quantity <= 0) delete state.cart[id]; else state.cart[id] = quantity;
    saveState(); renderCart();
  }
  if (removeButton) { delete state.cart[removeButton.dataset.remove]; saveState(); renderCart(); }
});
$('#checkoutButton').addEventListener('click', () => {
  closeCart(); showDialog('Your books are waiting.', 'This demo checkout does not collect payment. Your bag is saved here for your next visit.');
});
$('#newsletterForm').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!$('#emailInput').reportValidity()) return;
  $('#emailInput').value = '';
  showDialog('You’re on the list.', 'Look out for a little reading inspiration in your inbox.');
});
$('#closeDialog').addEventListener('click', () => $('#confirmationDialog').close());
$('#dialogDone').addEventListener('click', () => $('#confirmationDialog').close());
$('#confirmationDialog').addEventListener('click', (event) => { if (event.target === $('#confirmationDialog')) $('#confirmationDialog').close(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('#confirmationDialog').open && !$('#cartDrawer').inert) closeCart();
  if (event.key === '/' && !event.metaKey && !event.ctrlKey && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
    event.preventDefault(); $('#searchInput').focus();
  }
});
document.addEventListener('error', (event) => {
  if (event.target instanceof HTMLImageElement && event.target.classList.contains('book-cover')) event.target.classList.add('image-missing');
}, true);
render();
