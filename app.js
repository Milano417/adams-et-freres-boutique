/* ---------- état + stockage ---------- */
const $ = (id) => document.getElementById(id);
const load = (k, d) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
const ALL = DEF_PRODUCTS.concat(EXTRA_PRODUCTS);
const cache = load('adams_cache_v1', null);
let products = cache && cache.products && cache.products.length ? cache.products : ALL;
let config = { ...DEF_CONFIG, ...((cache && cache.config) || {}) };
let cart = load('adams_cart_v1', []);
let tab = 'accueil', cat = 'all', promoOnly = false, brand = 'all', series = 'all';
const SER = { 'infinix-note-40-pro-plus': 'Note', 'tecnocamon-50-pro': 'Camon', 'iphone-15-pro-max': 'iPhone 15', 'samsung-galaxy-a55': 'Galaxy A', 'smart-tv-nasco-43': 'Téléviseurs', 'tecno-spark-50': 'Spark', 'iphone-xr-64gb': 'iPhone XR', 'infinix-hot-40-pro': 'Hot', 'refrigerateur-combine-inverter': 'Froid', 'congelateur-coffre-200l': 'Froid', 'climatiseur-split-1-5-cv': 'Climatisation', 'machine-a-laver-automatique-8kg': 'Lavage', 'micro-ondes-20l-digital': 'Petit électroménager', 'blender-mixeur-inox-2en1': 'Petit électroménager' };
const seriesOf = (p) => p.series || SER[p.id] || '';
const imgOf = (p) => p.image || 'images/produits/' + p.id + '.jpg';
function ph(el) {
  el.onerror = null; const p = products.find((x) => x.id === el.dataset.id) || {}; const b = BRANDS.find((x) => x.match === p.brand) || { label: p.brand || 'Adam\'s', color: '#2b2b30' };
  const n = (p.name || '').replace(/^(Apple|Samsung|Infinix|Tecno|Nasco|Ilux|Smart) /, '').slice(0, 30);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${b.color}'/><stop offset='1' stop-color='#0b0b10'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/><circle cx='330' cy='60' r='120' fill='#fff' opacity='.07'/><text x='200' y='145' text-anchor='middle' font-family='Poppins,Arial' font-weight='800' font-size='46' fill='#fff'>${esc(b.label)}</text><text x='200' y='188' text-anchor='middle' font-family='Arial' font-size='20' fill='#f2c14e'>${esc(n)}</text></svg>`;
  el.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
const fcfa = (n) => Number(n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' FCFA';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wa = (txt) => `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(txt)}`;
let tt; const toast = (m) => { const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2200); };

/* ---------- navigation ---------- */
function go(t) { location.hash = t; }
function route() {
  tab = location.hash.slice(1); if (!TABS.some((x) => x[0] === tab)) tab = 'accueil';
  document.querySelectorAll('[data-tabs]').forEach((s) => { s.hidden = !s.dataset.tabs.split(' ').includes(tab); });
  document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
  $('nav').classList.remove('open'); closeAll(); window.scrollTo({ top: 0 });
  const mn = $('main'); mn.classList.remove('fade'); void mn.offsetWidth; mn.classList.add('fade');
  if (tab === 'promotions') promoOnly = true; else if (tab !== 'categories') promoOnly = false;
  drawCatalog();
}
function setPromo(v) { promoOnly = v; drawCatalog(); }
function closeAnn() { $('ann').hidden = true; }

/* ---------- cartes produit ---------- */
function stockTxt(p) { if (!p.inStock || p.stockCount === 0) return '<div class="stock out">Rupture de stock</div>'; return p.stockCount <= 5 ? `<div class="stock low">Plus que ${p.stockCount} en stock</div>` : '<div class="stock">En stock</div>'; }
function card(p) {
  const out = !p.inStock || p.stockCount === 0;
  return `<article class="card rv"><div class="im" onclick="openProduct('${p.id}')">
    ${p.isPromo && p.originalPrice ? `<span class="tag">-${Math.round((1 - p.price / p.originalPrice) * 100)}%</span>` : ''}${p.isNew ? '<span class="tag new">Nouveau</span>' : ''}
    <img src="${esc(imgOf(p))}" data-id="${p.id}" onerror="ph(this)" alt="${esc(p.name)}" loading="lazy"></div>
    <div class="bd"><div class="br">${esc(p.brand)}</div><h3 onclick="openProduct('${p.id}')">${esc(p.name)}</h3>
    <div><span class="price">${fcfa(p.price)}</span>${p.originalPrice > p.price ? `<span class="old">${fcfa(p.originalPrice)}</span>` : ''}</div>${stockTxt(p)}
    <div class="ft"><button class="btn sm" ${out ? 'disabled' : ''} onclick="addCart('${p.id}')">Ajouter</button><button class="btn ghost sm" onclick="openProduct('${p.id}')">Détails</button></div></div></article>`;
}
const fill = (id, list, empty) => { $(id).innerHTML = list.length ? list.map(card).join('') : `<div class="empty">${empty}</div>`; };

function drawCatalog() {
  fill('popular', products.filter((p) => p.isPopular).slice(0, 8), 'Aucun produit populaire.');
  fill('promoGrid', products.filter((p) => p.isPromo).slice(0, 8), 'Aucune promotion en cours.');
  const cnt = (b) => products.filter((p) => p.brand === b.match).length;
  const bb = (b, on) => `<button class="bl rv ${on ? 'on' : ''}" onclick="setBrand('${b.id}');go('boutique')" aria-label="${b.label}"><img src="images/brands/${b.id}.png" alt="${b.label}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:this.alt}))"><em>${cnt(b)} articles</em></button>`;
  $('homeBrands').innerHTML = BRANDS.map((b) => bb(b, false)).join('');
  $('brands').innerHTML = `<button class="bl rv ${brand === 'all' ? 'on' : ''}" onclick="setBrand('all')"><span>Toutes</span><em>${products.length} articles</em></button>` + BRANDS.map((b) => bb(b, brand === b.id)).join('');
  const cb = BRANDS.find((b) => b.id === brand), sl = cb ? [...new Set(products.filter((p) => p.brand === cb.match).map(seriesOf).filter(Boolean))] : [];
  $('series').innerHTML = sl.length ? ['all'].concat(sl).map((s) => `<button class="${series === s ? 'on' : ''}" onclick="setSeries(this.dataset.s)" data-s="${esc(s)}">${s === 'all' ? 'Toutes les séries' : esc(s)}</button>`).join('') : '';
  $('chips').innerHTML = [['all', 'Tous']].concat(CATS.map((c) => [c.id, c.name])).map(([id, n]) => `<button class="${cat === id ? 'on' : ''}" onclick="setCat('${id}')">${esc(n)}</button>`).join('') + `<button class="${promoOnly ? 'on' : ''}" onclick="setPromo(!promoOnly)">Promos</button>`;
  const q = $('q').value.trim().toLowerCase(), s = $('sort').value;
  let l = products.filter((p) => (cat === 'all' || p.category === cat) && (!cb || p.brand === cb.match) && (series === 'all' || seriesOf(p) === series) && (!promoOnly || p.isPromo) && (!q || (p.name + ' ' + p.brand + ' ' + seriesOf(p)).toLowerCase().includes(q)));
  if (s === 'asc') l.sort((a, b) => a.price - b.price); else if (s === 'desc') l.sort((a, b) => b.price - a.price); else l.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
  fill('catalogGrid', l, 'Aucun produit ne correspond. Essayez une autre recherche ou catégorie.');
  $('cats').innerHTML = CATS.map((c) => `<button class="cat rv" onclick="setCat('${c.id}');go('boutique')"><div class="ic">${c.icon}</div><h3>${esc(c.name)}</h3><p>${esc(c.d)}</p><p style="margin-top:8px;font-weight:700;color:var(--em)">${products.filter((p) => p.category === c.id).length} produit(s)</p></button>`).join('');
  reveal();
}
function setCat(id) { cat = id; drawCatalog(); }
function setBrand(id) { brand = id; series = 'all'; drawCatalog(); }
function setSeries(s) { series = s; drawCatalog(); }

/* ---------- fiche produit ---------- */
function openProduct(id) {
  const p = products.find((x) => x.id === id); if (!p) return;
  const out = !p.inStock || p.stockCount === 0;
  $('mbox').innerHTML = `<button class="x" onclick="closeAll()" aria-label="Fermer">✕</button><img src="${esc(imgOf(p))}" data-id="${p.id}" onerror="ph(this)" alt="${esc(p.name)}">
  <div class="in"><div class="br" style="color:var(--em);font-weight:700;font-size:.8rem">${esc(p.brand)}</div><h2 style="font-size:1.4rem;margin:4px 0 10px">${esc(p.name)}</h2>
  <div><span class="price" style="font-size:1.5rem">${fcfa(p.price)}</span>${p.originalPrice > p.price ? `<span class="old">${fcfa(p.originalPrice)}</span>` : ''}</div>${stockTxt(p)}
  <p style="margin:12px 0;font-size:.9rem;color:var(--mut)">${esc(p.description)}</p>
  <table class="sp">${Object.entries(p.specs || {}).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}<tr><td>Garantie</td><td>${esc(p.warranty)}</td></tr></table>
  <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" ${out ? 'disabled' : ''} onclick="addCart('${p.id}');closeAll();openCart()">Ajouter au panier</button>
  <a class="btn wa" target="_blank" rel="noopener" href="${wa(`Bonjour, je suis intéressé par : ${p.name} (${fcfa(p.price)}). Est-il disponible ?`)}">Demander sur WhatsApp</a></div></div>`;
  $('modal').classList.add('show'); $('ov').classList.add('show');
}

/* ---------- panier ---------- */
const saveCart = () => { save('adams_cart_v1', cart); drawCart(); };
function addCart(id) { const it = cart.find((c) => c.id === id); if (it) it.q++; else cart.push({ id, q: 1 }); saveCart(); toast('Ajouté au panier'); bump(); }
function qty(id, d) { const it = cart.find((c) => c.id === id); if (!it) return; it.q += d; if (it.q <= 0) cart = cart.filter((c) => c.id !== id); saveCart(); }
const lines = () => cart.map((c) => ({ p: products.find((x) => x.id === c.id), q: c.q })).filter((l) => l.p);
const total = () => lines().reduce((s, l) => s + l.p.price * l.q, 0);
function drawCart() {
  const ls = lines(); $('cartCount').textContent = ls.reduce((s, l) => s + l.q, 0);
  $('cartBody').innerHTML = ls.length ? ls.map((l) => `<div class="line"><img src="${esc(imgOf(l.p))}" data-id="${l.p.id}" onerror="ph(this)" alt=""><div><b>${esc(l.p.name)}</b><br>${fcfa(l.p.price)}<div class="qty"><button onclick="qty('${l.p.id}',-1)" aria-label="Moins">−</button><span>${l.q}</span><button onclick="qty('${l.p.id}',1)" aria-label="Plus">+</button></div></div><b>${fcfa(l.p.price * l.q)}</b></div>`).join('') : '<div class="empty">Votre panier est vide. Ajoutez un produit depuis la boutique.</div>';
  $('cartFoot').innerHTML = ls.length ? `<div style="display:flex;justify-content:space-between;font-weight:800"><span>Total</span><span>${fcfa(total())}</span></div>
  <form class="f" id="orderForm"><label>Nom complet<input name="n" required></label><label>Téléphone<input name="t" type="tel" required></label>
  <label>Réception<select name="d"><option value="boutique">Retrait en boutique</option><option value="livraison">Livraison à domicile (Daoukro)</option></select></label>
  <label>Quartier<input name="q" placeholder="Pour la livraison"></label><label>Notes<input name="o"></label>
  <button class="btn wa" type="submit" style="justify-content:center">Commander sur WhatsApp</button></form>` : '';
  const f = $('orderForm'); if (f) f.onsubmit = (e) => {
    e.preventDefault(); const d = new FormData(f);
    const msg = `Bonjour ${config.storeName}, je souhaite commander :\n` + ls.map((l) => `• ${l.q} x ${l.p.name} — ${fcfa(l.p.price * l.q)}`).join('\n') + `\n\nTotal : ${fcfa(total())}\nNom : ${d.get('n')}\nTéléphone : ${d.get('t')}\nRéception : ${d.get('d') === 'livraison' ? 'Livraison — quartier : ' + (d.get('q') || 'à préciser') : 'Retrait en boutique'}` + (d.get('o') ? `\nNotes : ${d.get('o')}` : '');
    window.open(wa(msg), '_blank', 'noopener');
  };
}
function openCart() { $('drawer').classList.add('show'); $('ov').classList.add('show'); }
function closeAll() { $('drawer').classList.remove('show'); $('modal').classList.remove('show'); $('ov').classList.remove('show'); }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });

/* ---------- textes dépendants de la config ---------- */
function drawConfig() {
  $('ann').hidden = !config.showAnnouncement;
  const ms = [config.announcementBanner, 'Commandez au ' + config.primaryPhone + ' ou sur WhatsApp', 'Livraison rapide à Daoukro', 'Paiement par Wave, Orange Money, MTN MoMo et Moov Money', 'Produits 100 % originaux, garantie réelle'].filter(Boolean);
  const grp = ms.map((m) => `<span>${esc(m)}</span>`).join(''); $('annTrack').innerHTML = grp + grp; $('annTrack').style.animationDuration = Math.max(30, ms.join('').length * 0.28) + 's';
  $('fwa').href = wa('Bonjour, j\'ai une question sur vos produits.');
  $('locTxt').innerHTML = `${esc(config.address)}, ${esc(config.city)}.<br>${esc(config.region)}<br><br>${esc(config.openingHoursWeek)}<br>${esc(config.openingHoursSunday)}`;
  $('mapBtn').href = config.googleMapsUrl;
  $('fTag').textContent = config.tagline; $('fHours').innerHTML = `${esc(config.openingHoursWeek)}<br>${esc(config.openingHoursSunday)}`;
  $('fContact').innerHTML = `${esc(config.primaryPhone)}<br>${esc(config.secondaryPhone)}<br>${esc(config.address)}, ${esc(config.city)}`;
  $('ci').innerHTML = `<a href="tel:${config.primaryPhone.replace(/\s/g, '')}">${ic('phone', 20)} ${esc(config.primaryPhone)}</a><a href="tel:${config.secondaryPhone.replace(/\s/g, '')}">${ic('phone', 20)} ${esc(config.secondaryPhone)}</a><a target="_blank" rel="noopener" href="${wa('Bonjour !')}">${ic('chat', 20)} WhatsApp direct</a><div>${ic('pin', 20)} ${esc(config.address)}, ${esc(config.city)}</div>`;
}

/* ---------- init ---------- */
$('nav').innerHTML = TABS.map(([t, l]) => `<button data-t="${t}" onclick="go('${t}')">${l}</button>`).join('');
$('reviews').innerHTML = REVIEWS.map((r) => `<div class="card rev rv"><div class="stars">★★★★★</div><p>${esc(r[2])}</p><b>${esc(r[0])}</b><small>${esc(r[1])}</small><small>Achat vérifié : ${esc(r[4])} · ${esc(r[3])}</small></div>`).join('');
$('yr').textContent = new Date().getFullYear();
$('q').addEventListener('input', drawCatalog); $('sort').addEventListener('change', drawCatalog);
$('contactForm').addEventListener('submit', (e) => { e.preventDefault(); const d = new FormData(e.target); window.open(wa(`Bonjour, je suis ${d.get('n')} (${d.get('t')}).\n${d.get('m')}`), '_blank', 'noopener'); });
window.addEventListener('hashchange', route);
$('fNav').innerHTML = TABS.map(([t, l]) => `<li><button onclick="go('${t}')">${l}</button></li>`).join('');
document.querySelectorAll('.sec .kick,.sec h2,.sec .sub,.split>*,.gal img,.banner,.afig figure,.f,.ci>*,.trust .wrap>div').forEach((e) => e.classList.add('rv'));
const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return; const el = e.target, i = [...el.parentElement.children].indexOf(el);
  el.style.transitionDelay = Math.min(i, 7) * 70 + 'ms'; el.classList.add('in'); io.unobserve(el);
  setTimeout(() => { el.style.transitionDelay = ''; el.classList.add('done'); }, 1100);
}), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;
function reveal() { document.querySelectorAll('.rv:not(.in)').forEach((el) => (io ? io.observe(el) : el.classList.add('in', 'done'))); }
function bump() { const b = $('cartCount'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
window.addEventListener('scroll', () => {
  const y = window.scrollY, d = document.documentElement.scrollHeight - innerHeight;
  $('bar').style.width = (d > 0 ? (y / d) * 100 : 0) + '%'; document.querySelector('header').classList.toggle('sc', y > 40);
}, { passive: true });
drawConfig(); drawCart(); route();
/* ---------- données en ligne (Firebase) : le site public lit seulement ---------- */
function applyRemote(r) {
  if (!r) return; if (r.products && r.products.length) products = r.products; if (r.config) config = { ...DEF_CONFIG, ...r.config };
  save('adams_cache_v1', { products, config, v: r.v }); drawConfig(); drawCatalog(); drawCart();
}
function bootStore() { window.Store.loadAll().then(applyRemote).catch(() => { }); }
if (window.Store) bootStore(); else window.addEventListener('store-ready', bootStore, { once: true });
