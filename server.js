import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' };
const publicFiles = new Set(['/index.html', '/src/app.js', '/src/style.css', '/src/logic.js', '/src/marketplace.js', '/src/data.js', '/src/ui.js', '/src/photos.js', '/src/community.js', '/src/community-logic.js', '/src/community-data.js', '/src/community.css', '/manifest.webmanifest', '/sw.js', '/icon.svg', '/icon-192.png', '/icon-512.png', '/demo.html']);
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const isPortrait = /^\/assets\/people\/person-\d{2}\.(jpg|png)$/.test(pathname);
    if (!file.startsWith(root) || (!publicFiles.has(pathname === '/' ? '/index.html' : pathname) && !isPortrait)) { res.writeHead(404); res.end('Not found'); return; }
    res.setHeader('Content-Type', types[path.extname(file)]);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (pathname === '/sw.js') res.setHeader('Cache-Control', 'no-cache');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Development server listening on port ' + (process.env.PORT || 3000)));
