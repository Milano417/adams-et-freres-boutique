'use strict';
const L = require('./_lib');
/* Lecture publique du catalogue : produits + coordonnées. */
module.exports = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return L.send(res, 405, { ok: false });
  try {
    const [pv, cv] = await L.multi([['HVALS', 'adams:products'], ['GET', 'adams:config']]);
    const products = (pv || []).map((s) => { try { return JSON.parse(s); } catch (e) { return null; } }).filter(Boolean);
    let config = null; try { config = cv ? JSON.parse(cv) : null; } catch (e) { config = null; }
    const fresh = req.query && req.query.fresh;
    res.setHeader('Cache-Control', fresh ? 'no-store' : 'public, max-age=0, s-maxage=3, stale-while-revalidate=30');
    L.send(res, 200, { ok: true, products: products.length ? products : null, config });
  } catch (e) { L.send(res, e.code === 'no-db' ? 503 : 500, { ok: false, code: e.code || 'error' }); }
};
