#!/usr/bin/env node
/* Serveur de TEST local : sert le site, les fonctions du dossier api/ et une base en mémoire.
   Usage :  node dev-server.js     puis ouvrir http://localhost:3000  (administration : /admin).
   Mot de passe de test : motdepasse-test-123 (ou la valeur de la variable ADMIN_PASSWORD). */
process.env.ADAMS_LOCAL = '1'; process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'motdepasse-test-123';
const http = require('http'), fs = require('fs'), path = require('path');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8' };
const PORT = process.env.PORT || 3000;
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost'); let p = decodeURIComponent(u.pathname);
  if (p.startsWith('/api/')) {
    const name = p.slice(5).replace(/[^a-z_-]/gi, ''), f = path.join(__dirname, 'api', name + '.js');
    if (name.startsWith('_') || !fs.existsSync(f)) { res.statusCode = 404; return res.end(); }
    req.query = Object.fromEntries(u.searchParams); let body = ''; for await (const c of req) body += c;
    try { req.body = body ? JSON.parse(body) : {}; } catch (e) { req.body = {}; }
    try { return await require(f)(req, res); } catch (e) { console.error(e); res.statusCode = 500; return res.end(); }
  }
  if (p === '/admin') p = '/admin.html'; if (p === '/') p = '/index.html';
  const file = path.join(__dirname, path.normalize(p));
  if (!file.startsWith(__dirname) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream'); fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Site : http://localhost:${PORT}\nAdministration : http://localhost:${PORT}/admin  (mot de passe : ${process.env.ADMIN_PASSWORD})`));
