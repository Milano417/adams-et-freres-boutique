'use strict';
const L = require('./_lib');
/* Sert une photo de produit envoyée depuis l'espace administrateur. */
module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || '');
  if (!/^[A-Za-z0-9_-]{1,120}$/.test(id)) { res.statusCode = 404; return res.end(); }
  try {
    const v = await L.redis(['GET', 'adams:img:' + id]), m = v && /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(v);
    if (!m) { res.statusCode = 404; return res.end(); }
    res.statusCode = 200; res.setHeader('Content-Type', m[1]); res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(Buffer.from(m[2], 'base64'));
  } catch (e) { res.statusCode = 503; res.end(); }
};
