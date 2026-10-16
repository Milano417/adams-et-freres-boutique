'use strict';
/* Outils partagés par les fonctions de l'API (le « _ » empêche Vercel d'en faire une adresse publique). */
const crypto = require('crypto');

/* ---------- base de données : Upstash Redis (Vercel Storage) ---------- */
const DB_URL = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const DB_TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const mem = new Map(); // base en mémoire, uniquement pour `node dev-server.js` (test local)
function memRun(c) {
  const [op, k, ...a] = c; const U = op.toUpperCase();
  if (U === 'GET') return mem.has(k) ? mem.get(k) : null;
  if (U === 'SET') { mem.set(k, a[0]); return 'OK'; }
  if (U === 'DEL') { return mem.delete(k) ? 1 : 0; }
  if (U === 'INCR') { const v = (Number(mem.get(k)) || 0) + 1; mem.set(k, String(v)); return v; }
  if (U === 'EXPIRE') return 1;
  const h = () => { if (!(mem.get(k) instanceof Map)) mem.set(k, new Map()); return mem.get(k); };
  if (U === 'HSET') { const m = h(); for (let i = 0; i < a.length; i += 2) m.set(a[i], a[i + 1]); return a.length / 2; }
  if (U === 'HGET') return h().get(a[0]) ?? null;
  if (U === 'HDEL') return h().delete(a[0]) ? 1 : 0;
  if (U === 'HVALS') return [...h().values()];
  if (U === 'HLEN') return h().size;
  throw new Error('commande inconnue ' + op);
}
async function redis(cmd) {
  if (process.env.ADAMS_LOCAL === '1') return memRun(cmd);
  const url = DB_URL(), token = DB_TOKEN();
  if (!url || !token) throw Object.assign(new Error('Base de données non connectée'), { code: 'no-db' });
  const r = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw Object.assign(new Error('Erreur base de données'), { code: 'db-error' });
  return j.result;
}
async function multi(cmds) { // plusieurs commandes en une seule requête
  if (process.env.ADAMS_LOCAL === '1') return cmds.map(memRun);
  const url = DB_URL(), token = DB_TOKEN();
  if (!url || !token) throw Object.assign(new Error('Base de données non connectée'), { code: 'no-db' });
  const r = await fetch(url.replace(/\/$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  const j = await r.json().catch(() => null);
  if (!r.ok || !Array.isArray(j) || j.some((x) => x.error)) throw Object.assign(new Error('Erreur base de données'), { code: 'db-error' });
  return j.map((x) => x.result);
}

/* ---------- réponses ---------- */
function send(res, status, body) { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(JSON.stringify(body)); }

/* ---------- authentification administrateur ---------- */
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const adminPassword = () => process.env.ADMIN_PASSWORD || '';
const secret = () => process.env.SESSION_SECRET || 'adams|' + adminPassword();
const passVersion = () => sha(adminPassword()).toString('hex').slice(0, 16); // un changement de mot de passe ferme toutes les sessions
function passwordOk(input) { const a = sha(input), b = sha(adminPassword()); return adminPassword().length > 0 && crypto.timingSafeEqual(a, b); }
function sign(payload) { const b = Buffer.from(JSON.stringify(payload)).toString('base64url'); return b + '.' + crypto.createHmac('sha256', secret()).update(b).digest('base64url'); }
function verify(token) {
  if (!token || typeof token !== 'string') return null; const [b, s] = token.split('.'); if (!b || !s) return null;
  const e = crypto.createHmac('sha256', secret()).update(b).digest('base64url'), A = Buffer.from(s), B = Buffer.from(e);
  if (A.length !== B.length || !crypto.timingSafeEqual(A, B)) return null;
  try { const p = JSON.parse(Buffer.from(b, 'base64url').toString()); return p.exp > Date.now() && p.pv === passVersion() ? p : null; } catch (e2) { return null; }
}
const SESSION_MS = 12 * 3600 * 1000;
function cookieOf(req, name) { const m = (req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(name + '=')); return m ? decodeURIComponent(m.slice(name.length + 1)) : ''; }
const isAdmin = (req) => !!verify(cookieOf(req, 'adm'));
function setSession(req, res, on) {
  const secure = String(req.headers['x-forwarded-proto'] || '').includes('https') ? '; Secure' : '';
  const v = on ? sign({ exp: Date.now() + SESSION_MS, pv: passVersion() }) : '';
  res.setHeader('Set-Cookie', `adm=${v}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=${on ? SESSION_MS / 1000 : 0}`);
}
async function tooManyAttempts(req) { // 8 essais maximum par adresse IP et par 15 minutes
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'ip').split(',')[0].trim();
  try { const k = 'adams:rl:' + ip, n = await redis(['INCR', k]); if (n === 1) await redis(['EXPIRE', k, 900]); return n > 8; } catch (e) { return false; }
}

/* ---------- validation des données reçues ---------- */
const CATS = ['smartphones', 'televiseurs', 'refrigerateurs', 'climatiseurs', 'lavage', 'accessoires', 'electromenager'];
const ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v, min, max) => { const n = Number(v); return Number.isFinite(n) && n >= min && n <= max ? n : null; };
function cleanProduct(p) {
  if (!p || typeof p !== 'object') return null;
  const id = str(p.id, 80), name = str(p.name, 160), brand = str(p.brand, 60), price = num(p.price, 0, 100000000);
  if (!ID_RE.test(id) || !name || !brand || price === null) return null;
  const stock = Math.round(num(p.stockCount, 0, 100000) ?? 0);
  const o = { id, name, brand, series: str(p.series, 60), category: CATS.includes(p.category) ? p.category : 'electromenager', price, stockCount: stock, inStock: stock > 0,
    warranty: str(p.warranty, 120), description: str(p.description, 600), isPromo: !!p.isPromo, isPopular: !!p.isPopular, isNew: !!p.isNew, updatedAt: Date.now() };
  const op = p.originalPrice === undefined || p.originalPrice === null || p.originalPrice === '' ? null : num(p.originalPrice, 0, 100000000);
  if (op !== null) o.originalPrice = op;
  const img = str(p.image, 300);
  o.image = (/^images\/[A-Za-z0-9_\-./]+$/.test(img) && !img.includes('..')) || /^\/api\/img\?id=[A-Za-z0-9_-]{1,120}$/.test(img) ? img : '';
  o.specs = {}; if (p.specs && typeof p.specs === 'object') Object.entries(p.specs).slice(0, 20).forEach(([k, v]) => { if (typeof v === 'string' || typeof v === 'number') o.specs[str(k, 60)] = str(String(v), 160); });
  return o;
}
const CONFIG_KEYS = ['storeName', 'tagline', 'primaryPhone', 'secondaryPhone', 'whatsappNumber', 'address', 'city', 'region', 'openingHoursWeek', 'openingHoursSunday', 'googleMapsUrl', 'announcementBanner'];
function cleanConfig(c) {
  if (!c || typeof c !== 'object') return null; const o = {};
  CONFIG_KEYS.forEach((k) => { o[k] = str(c[k], 300); });
  o.showAnnouncement = !!c.showAnnouncement;
  if (!/^\d{8,15}$/.test(o.whatsappNumber)) return { error: 'Le numéro WhatsApp doit contenir uniquement des chiffres, avec l\'indicatif (ex : 2250707103497).' };
  if (o.googleMapsUrl && !/^https:\/\//.test(o.googleMapsUrl)) return { error: 'Le lien Google Maps doit commencer par https://' };
  return o;
}
module.exports = { redis, multi, send, passwordOk, adminPassword, sign, verify, isAdmin, setSession, tooManyAttempts, cleanProduct, cleanConfig, ID_RE };
