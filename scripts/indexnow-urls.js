// scripts/indexnow-urls.js
// Lee una lista de archivos cambiados y genera el payload para IndexNow.
// Solo incluye páginas públicas (HTML indexables) y el sitemap.
'use strict';

const fs = require('fs');

const HOST = 'dynxlabs.com';
const KEY = '95f737087d1517a07480f1ba09106933';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const MAX_URLS = 10000; // límite de IndexNow por envío

// Rutas que NO se envían (no son páginas públicas servidas).
const SKIP_PREFIXES = [
  '.github/', 'scripts/', 'docs/', 'node_modules/', 'locales/',
  'insights/posts/', 'assets/', '.gitattributes', '.gitignore',
  '.nvmrc', 'package', 'README', 'robots.txt', 'llms.txt',
];

function toUrl(file) {
  // Archivos HTML en /es/ o /en/ son los publicados.
  if (!file.endsWith('.html')) {
    if (file === 'sitemap.xml') return `https://${HOST}/sitemap.xml`;
    return null;
  }
  for (const p of SKIP_PREFIXES) if (file.startsWith(p)) return null;
  // Páginas raíz (contact.html, products.html, etc.) son fuentes; el publicado
  // está en /es/ y /en/. No enviamos la raíz, enviamos ambas.
  if (!file.startsWith('es/') && !file.startsWith('en/')) {
    const base = file.replace(/\.html$/, '');
    if (base === 'index') return [`https://${HOST}/es/`, `https://${HOST}/en/`];
    return [`https://${HOST}/es/${base}`, `https://${HOST}/en/${base}`];
  }
  // /es/foo.html -> /es/foo ; /es/foo/index.html -> /es/foo/
  let path = file.replace(/\.html$/, '');
  if (path.endsWith('/index')) path = path.slice(0, -'index'.length);
  return `https://${HOST}/${path}`;
}

function main() {
  const input = process.argv[2];
  if (!input || !fs.existsSync(input)) {
    console.error('Uso: node indexnow-urls.js <archivo-con-cambios>');
    process.exit(1);
  }
  const files = fs.readFileSync(input, 'utf8').split('\n').map(s => s.trim()).filter(Boolean);
  const set = new Set();
  for (const f of files) {
    const u = toUrl(f);
    if (!u) continue;
    if (Array.isArray(u)) u.forEach(x => set.add(x));
    else set.add(u);
  }
  const urlList = [...set].slice(0, MAX_URLS);
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };
  process.stdout.write(JSON.stringify(payload));
}

main();
