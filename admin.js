import { Store } from './store.js';
const LIVE = await Store.ready;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fcfa = (n) => Number(n || 0).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ') + ' FCFA';
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const GRAY = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#eee"/></svg>').replace(/'/g, '%27');
const IDLE_MS = 30 * 60 * 1000;
let products = [], config = { ...DEF_CONFIG }, pendingPhoto = null, idleT = null;

let tt;
function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2600); }
function errMsg(e) {
  const c = (e && e.code) || '';
  if (c === 'unauthorized') { view('login'); return 'Session expirée : reconnectez-vous.'; }
  if (c === 'no-catalog') return "Importez d'abord le catalogue initial (onglet Sauvegarde).";
  if (c === 'no-db') return "La base de données n'est pas connectée (voir GUIDE.md).";
  if (c === 'invalid') return (e.message || 'Données invalides.');
  if (c === 'network') return 'Connexion internet indisponible. Réessayez.';
  return 'Opération impossible. Réessayez.';
}
function view(v) { $('login').hidden = v !== 'login'; $('dash').hidden = v !== 'dash'; $('who').hidden = v !== 'dash'; }

/* ---------- connexion ---------- */
function loginMsg(e) {
  const c = (e && e.code) || '';
  if (c === 'bad-login') return 'Mot de passe incorrect.';
  if (c === 'rate' || c === 'config' || c === 'no-db') return e.message || errMsg(e);
  if (c === 'network') return 'Connexion internet indisponible.';
  return 'Connexion impossible. Réessayez.';
}
$('lf').addEventListener('submit', async (e) => {
  e.preventDefault(); $('lerr').textContent = ''; $('lbtn').disabled = true;
  try { await Store.login($('pw').value); $('pw').value = ''; await enter(); } catch (err) { $('lerr').textContent = loginMsg(err); } finally { $('lbtn').disabled = false; }
});
$('out').addEventListener('click', async () => { clearTimeout(idleT); try { await Store.logout(); } catch (e) { /* ignoré */ } view('login'); });
let idleOn = false;
function armIdle() {
  const reset = () => { clearTimeout(idleT); idleT = setTimeout(async () => { try { await Store.logout(); } catch (e) { /* ignoré */ } view('login'); toast('Session fermée après 30 minutes sans activité.'); }, IDLE_MS); };
  if (!idleOn) { idleOn = true; ['click', 'keydown', 'touchstart'].forEach((ev) => document.addEventListener(ev, reset, { passive: true })); } reset();
}

/* ---------- données ---------- */
async function refresh() {
  const r = await Store.loadAll({ fresh: true });
  products = r.products && r.products.length ? r.products : (LIVE ? [] : JSON.parse(JSON.stringify(DEF_PRODUCTS.concat(EXTRA_PRODUCTS))));
  config = { ...DEF_CONFIG, ...(r.config || {}) };
  drawList(); drawConfig();
}

/* ---------- onglets ---------- */
document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
  ['pp', 'pc', 'ps'].forEach((p) => { $(p).hidden = p !== b.dataset.p; });
}));

/* ---------- liste des produits ---------- */
$('sb').innerHTML = '<option value="">Toutes les marques</option>' + BRANDS.map((b) => `<option value="${esc(b.match)}">${esc(b.label)}</option>`).join('') + '<option value="__autres">Autres marques</option>';
$('cat').innerHTML = CATS.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
$('brl').innerHTML = [...BRANDS.map((b) => b.match), 'Divers'].map((b) => `<option value="${esc(b)}">`).join('');
function drawList() {
  const q = $('sq').value.trim().toLowerCase(), b = $('sb').value, known = BRANDS.map((x) => x.match);
  const l = products.filter((p) => (!b || (b === '__autres' ? !known.includes(p.brand) : p.brand === b)) && (!q || `${p.name} ${p.brand} ${p.series || ''}`.toLowerCase().includes(q))).sort((x, y) => x.name.localeCompare(y.name, 'fr'));
  $('cnt').textContent = `${l.length} produit(s) affiché(s) sur ${products.length}`; $('empty').hidden = products.length > 0;
  $('plist').innerHTML = l.map((p) => `<div class="ar" data-id="${esc(p.id)}"><img src="${esc(p.image || 'images/produits/' + p.id + '.jpg')}" alt="" onerror="this.onerror=null;this.src='${GRAY}'">
    <div class="nm">${esc(p.name)}<small>${esc(p.brand)}${p.series ? ' · ' + esc(p.series) : ''}</small></div><div class="stat"></div>
    <div class="ed"><label>Prix (FCFA)<input type="number" min="0" step="500" data-f="price" value="${Number(p.price) || 0}"></label>
    <label>Stock<input type="number" class="stk" min="0" step="1" data-f="stockCount" value="${Number(p.stockCount) || 0}"></label>
    <button type="button" class="chp ${p.isPromo ? 'on' : ''}" data-t="isPromo">Promo</button><button type="button" class="chp ${p.isPopular ? 'on' : ''}" data-t="isPopular">Populaire</button><button type="button" class="chp ${p.isNew ? 'on' : ''}" data-t="isNew">Nouveau</button>
    <div class="btns"><button type="button" class="btn ghost sm" data-a="edit">Modifier</button><button type="button" class="btn dg sm" data-a="del">Supprimer</button></div></div></div>`).join('');
}
$('sq').addEventListener('input', drawList); $('sb').addEventListener('change', drawList);
async function persist(p, okMsg) {
  try { await Store.saveProduct(p); toast(okMsg || 'Enregistré'); return true; } catch (e) { toast(errMsg(e)); return false; }
}
$('plist').addEventListener('change', async (e) => {
  const f = e.target.dataset.f; if (!f) return; const row = e.target.closest('.ar'), p = products.find((x) => x.id === row.dataset.id); if (!p) return;
  const v = Number(e.target.value); if (!Number.isFinite(v) || v < 0) { e.target.value = p[f]; toast('Valeur invalide.'); return; }
  const old = p[f]; p[f] = f === 'stockCount' ? Math.round(v) : v; if (f === 'stockCount') p.inStock = p.stockCount > 0;
  if (!(await persist(p))) { p[f] = old; drawList(); }
});
$('plist').addEventListener('click', async (e) => {
  const b = e.target.closest('button'); if (!b) return; const row = b.closest('.ar'), p = products.find((x) => x.id === row.dataset.id); if (!p) return;
  if (b.dataset.t) { const k = b.dataset.t; p[k] = !p[k]; if (!(await persist(p))) p[k] = !p[k]; drawList(); }
  else if (b.dataset.a === 'edit') openDialog(p);
  else if (b.dataset.a === 'del') {
    if (!confirm(`Supprimer définitivement « ${p.name} » ?`)) return;
    try { await Store.deleteProduct(p.id); products = products.filter((x) => x.id !== p.id); drawList(); toast('Produit supprimé'); } catch (er) { toast(errMsg(er)); }
  }
});

/* ---------- fiche produit (ajout / modification) ---------- */
const dlg = $('dlg'), pf = $('pf');
function resizePhoto(file) {
  return new Promise((ok, ko) => {
    const fr = new FileReader(); fr.onerror = ko;
    fr.onload = () => { const im = new Image(); im.onerror = ko; im.onload = () => {
      const k = Math.min(1, 720 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      let q = 0.82, d = c.toDataURL('image/jpeg', q); while (d.length > 260000 && q > 0.4) { q -= 0.08; d = c.toDataURL('image/jpeg', q); } ok(d);
    }; im.src = fr.result; }; fr.readAsDataURL(file);
  });
}
function fillSeries() {
  const b = pf.brand.value.trim().toLowerCase(); $('srl').innerHTML = [...new Set(products.filter((p) => p.brand.toLowerCase() === b).map((p) => p.series).filter(Boolean))].map((s) => `<option value="${esc(s)}">`).join('');
}
function openDialog(p) {
  pf.reset(); pendingPhoto = null; $('perr').textContent = ''; $('dt').textContent = p ? 'Modifier le produit' : 'Ajouter un produit';
  pf.id.value = p ? p.id : '';
  if (p) { ['name', 'brand', 'series', 'category', 'warranty', 'price', 'originalPrice', 'stockCount', 'description'].forEach((k) => { pf[k].value = p[k] ?? ''; }); pf.isPromo.checked = !!p.isPromo; pf.isPopular.checked = !!p.isPopular; pf.isNew.checked = !!p.isNew; }
  const src = p ? (p.image || 'images/produits/' + p.id + '.jpg') : ''; $('pv').hidden = !src; $('pv').src = src; $('pv').onerror = () => { $('pv').hidden = true; };
  fillSeries(); dlg.showModal();
}
$('add').addEventListener('click', () => openDialog(null));
$('dx').addEventListener('click', () => dlg.close()); $('cn').addEventListener('click', () => dlg.close());
pf.brand.addEventListener('input', fillSeries);
$('photo').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  if (!f.type.startsWith('image/')) { $('perr').textContent = 'Le fichier choisi n\'est pas une image.'; return; }
  try { pendingPhoto = await resizePhoto(f); $('pv').hidden = false; $('pv').src = pendingPhoto; $('perr').textContent = ''; } catch (er) { $('perr').textContent = "Impossible de lire cette image."; }
});
pf.addEventListener('submit', async (e) => {
  e.preventDefault(); $('perr').textContent = '';
  const price = Number(pf.price.value), orig = pf.originalPrice.value === '' ? null : Number(pf.originalPrice.value), stock = Math.round(Number(pf.stockCount.value));
  if (!pf.name.value.trim() || !pf.brand.value.trim()) { $('perr').textContent = 'Le nom et la marque sont obligatoires.'; return; }
  if (!(price >= 0)) { $('perr').textContent = 'Le prix est invalide.'; return; }
  if (pf.isPromo.checked && !(orig && orig > price)) { $('perr').textContent = "Pour une promotion, indiquez un ancien prix supérieur au prix actuel."; return; }
  const editing = pf.id.value, prev = products.find((x) => x.id === editing);
  let id = editing; if (!id) { const base = slug(pf.name.value) || 'produit'; id = base; let n = 2; while (products.some((x) => x.id === id)) id = base + '-' + n++; }
  $('sv').disabled = true; let image = (prev && prev.image) || 'images/produits/' + id + '.jpg';
  if (pendingPhoto) { try { image = LIVE ? await Store.uploadImage(id, pendingPhoto) : pendingPhoto; } catch (er) { $('perr').textContent = errMsg(er); $('sv').disabled = false; return; } }
  const p = { id, name: pf.name.value.trim(), brand: pf.brand.value.trim(), series: pf.series.value.trim(), category: pf.category.value, warranty: pf.warranty.value.trim(), price, stockCount: stock, inStock: stock > 0,
    image, description: pf.description.value.trim(), isPromo: pf.isPromo.checked, isPopular: pf.isPopular.checked, isNew: pf.isNew.checked, specs: (prev && prev.specs) || {} };
  if (orig) p.originalPrice = orig;
  $('sv').disabled = true;
  if (await persist(p, 'Produit enregistré')) { const i = products.findIndex((x) => x.id === id); if (i >= 0) products[i] = p; else products.unshift(p); dlg.close(); drawList(); }
  $('sv').disabled = false;
});

/* ---------- coordonnées ---------- */
function drawConfig() {
  $('cf').innerHTML = CFIELDS.map(([k, l]) => `<label>${esc(l)}<input name="${k}" value="${esc(config[k])}"></label>`).join('') +
    `<label class="chk"><span><input type="checkbox" name="showAnnouncement" ${config.showAnnouncement ? 'checked' : ''}> Afficher la bannière d'annonce défilante</span></label><div class="err" id="cerr" role="alert"></div><button class="btn" type="submit">Enregistrer les coordonnées</button>`;
}
$('cf').addEventListener('submit', async (e) => {
  e.preventDefault(); const f = e.target, c = { ...config };
  CFIELDS.forEach(([k]) => { c[k] = f[k].value.trim(); }); c.showAnnouncement = f.showAnnouncement.checked;
  if (!/^\d{8,15}$/.test(c.whatsappNumber)) { $('cerr').textContent = 'Le numéro WhatsApp doit contenir uniquement des chiffres, avec l\'indicatif (ex : 2250707103497).'; return; }
  try { await Store.saveConfig(c); config = c; toast('Coordonnées enregistrées'); } catch (er) { $('cerr').textContent = errMsg(er); }
});

/* ---------- sauvegarde ---------- */
$('seed').addEventListener('click', async () => {
  if (!confirm(`Importer le catalogue initial (${DEF_PRODUCTS.length + EXTRA_PRODUCTS.length} produits) ? Les produits portant le même identifiant seront remplacés.`)) return;
  try { await Store.replaceAll(JSON.parse(JSON.stringify(DEF_PRODUCTS.concat(EXTRA_PRODUCTS)))); await Store.saveConfig(config); await refresh(); toast('Catalogue importé'); } catch (e) { toast(errMsg(e)); }
});
$('exp').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), products, config }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sauvegarde-adams-et-freres-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
$('imp').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const d = JSON.parse(await f.text()), l = Array.isArray(d) ? d : d.products;
    if (!Array.isArray(l) || !l.length || !l.every((p) => p && typeof p.id === 'string' && p.id && typeof p.name === 'string' && typeof p.price === 'number' && p.price >= 0)) throw new Error('format');
    if (!confirm(`Restaurer ${l.length} produit(s) depuis ce fichier ? Les produits de même identifiant seront remplacés.`)) { e.target.value = ''; return; }
    await Store.replaceAll(l); if (d.config) await Store.saveConfig({ ...DEF_CONFIG, ...d.config }); await refresh(); toast('Sauvegarde restaurée');
  } catch (er) { toast(er.message === 'format' || er instanceof SyntaxError ? "Ce fichier n'est pas une sauvegarde valide." : errMsg(er)); }
  e.target.value = '';
});

/* ---------- démarrage ---------- */
async function enter() {
  view('dash');
  try { await refresh(); } catch (e) {
    if (e.code === 'no-db') { $('demo').hidden = false; $('demo').innerHTML = "<b>Base de données non connectée.</b> Les modifications ne seront pas enregistrées. Suivez l'étape 2 du GUIDE.md puis redéployez le site."; } else toast(errMsg(e));
  }
  if (LIVE) armIdle();
}
$('demo').hidden = LIVE;
(async () => { const me = await Store.me(); if (me) await enter(); else view('login'); })();
