/* Couche de données du navigateur : API du site (/api, base Upstash Redis sur Vercel)
   ou mode démonstration local si aucun serveur n'est présent. */
const KP = 'adams_products_v3', KC = 'adams_config_v3';
const lsGet = (k) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const clean = (o) => JSON.parse(JSON.stringify(o));
const ALLDEF = () => clean(DEF_PRODUCTS.concat(EXTRA_PRODUCTS));

// Le serveur existe-t-il ? (réponse JSON de /api/catalogue, même si la base n'est pas encore connectée)
const ready = fetch('/api/catalogue?fresh=1', { cache: 'no-store' }).then((r) => r.json()).then((j) => !!j && typeof j.ok === 'boolean').catch(() => false);
let LIVE = false; ready.then((v) => { LIVE = v; });

async function call(action, data) {
  let r, j;
  try { r = await fetch('/api/admin', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'adams' }, body: JSON.stringify({ action, ...data }) }); j = await r.json().catch(() => ({})); }
  catch (e) { throw Object.assign(new Error('Réseau indisponible'), { code: 'network' }); }
  if (!r.ok || j.ok === false) throw Object.assign(new Error(j.message || 'Erreur'), { code: j.code || 'http-' + r.status });
  return j;
}
let queue = Promise.resolve(); // les écritures partent l'une après l'autre (jamais en même temps)
const serial = (fn) => { const p = queue.then(fn, fn); queue = p.catch(() => { }); return p; };

export const Store = {
  ready,
  get live() { return LIVE; },
  async loadAll(opts = {}) {
    if (!(await ready)) return { products: lsGet(KP), config: lsGet(KC) };
    const r = await fetch('/api/catalogue' + (opts.fresh ? '?fresh=1' : ''), { cache: 'no-store' }), j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw Object.assign(new Error('Catalogue indisponible'), { code: j.code || 'http-' + r.status });
    return { products: j.products, config: j.config };
  },
  async me() { if (!(await ready)) return { demo: true }; try { await call('me'); return { ok: true }; } catch (e) { return null; } },
  async login(pw) { if (!(await ready)) return; await call('login', { password: pw }); },
  async logout() { if (!(await ready)) return; await call('logout'); },
  async saveProduct(p) {
    if (!(await ready)) { const l = lsGet(KP) || ALLDEF(), i = l.findIndex((x) => x.id === p.id), d = clean(p); if (i >= 0) l[i] = d; else l.unshift(d); return lsSet(KP, l); }
    return serial(() => call('saveProduct', { product: p }));
  },
  async deleteProduct(id) {
    if (!(await ready)) return lsSet(KP, (lsGet(KP) || ALLDEF()).filter((x) => x.id !== id));
    return serial(() => call('deleteProduct', { id }));
  },
  async saveConfig(c) { if (!(await ready)) return lsSet(KC, clean(c)); return serial(() => call('saveConfig', { config: c })); },
  async replaceAll(list) {
    if (!(await ready)) { const l = lsGet(KP) || []; list.forEach((p) => { const i = l.findIndex((x) => x.id === p.id); if (i >= 0) l[i] = clean(p); else l.push(clean(p)); }); return lsSet(KP, l); }
    return serial(() => call('import', { products: list }));
  },
  async uploadImage(id, dataUrl) { return (await serial(() => call('uploadImage', { id, dataUrl }))).url; }
};
window.Store = Store;
window.dispatchEvent(new Event('store-ready'));
