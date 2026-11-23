'use strict';

// PetGo 2.0: produce the Vite build and existing Node HTTP API on one origin.
// Do not modify the API routes or expose the Supabase credentials to the client.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pipeline } = require('node:stream');
const server = require('./server');

const publicRoot = path.resolve(__dirname, '..', 'frontend', 'dist');
const port = Number(process.env.PORT || 3000);
const originalHandler = server.listeners('request')[0];
if (!originalHandler) throw new Error('No se encontro el enrutador de API PetGo.');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8'
};

async function serveWeb(req, res) {
  // API stays under the original router, including health and OPTIONS.
  let requestPath;
  try {
    requestPath = new URL(req.url, 'http://localhost').pathname;
    requestPath = decodeURIComponent(requestPath);
  } catch {
    res.writeHead(400); res.end('Solicitud incorrecta'); return;
  }

  if (requestPath === '/api' || requestPath.startsWith('/api/') ||
      (requestPath === '/' && req.method !== 'GET' && req.method !== 'HEAD')) {
    return originalHandler(req, res);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
  }

  const rel = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const filePath = path.resolve(publicRoot, rel);
  if (filePath !== publicRoot && !filePath.startsWith(publicRoot + path.sep)) {
    res.writeHead(403); res.end(); return;
  }
  try {
    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) throw Object.assign(new Error('Not a file'), { code: 'ENOENT' });
    res.setHeader('Content-Type', mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cache-Control', rel.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
    if (path.extname(filePath).toLowerCase() === '.html') {
      // Add the global accessibility panel and cookie notice to all Vite pages.
      // No source HTML files or existing auth/API routes need modification.
      let html = await fs.promises.readFile(filePath, 'utf8');
      const injection = '<link rel="stylesheet" href="/petgo-accesibilidad.css">' +
        '<script src="/petgo-accesibilidad.js" defer></script>';
      if (!html.includes('/petgo-accesibilidad.js')) {
        html = /<\/head>/i.test(html) ? html.replace(/<\/head>/i, injection + '</head>') : injection + html;
      }
      const data = Buffer.from(html);
      res.setHeader('Content-Length', data.length);
      res.writeHead(200);
      if (req.method === 'HEAD') res.end(); else res.end(data);
      return;
    }
    res.setHeader('Content-Length', stat.size);
    res.writeHead(200);
    if (req.method === 'HEAD') { res.end(); return; }
    pipeline(fs.createReadStream(filePath), res, err => {
      if (err && !res.destroyed) res.destroy();
    });
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') {
      console.error('Error al leer archivo publico:', error.code || error.name);
      res.writeHead(500); res.end('Error al cargar la pagina'); return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Pagina no encontrada');
  }
}

server.removeListener('request', originalHandler);
server.on('request', (req, res) => {
  serveWeb(req, res).catch(error => {
    console.error('Error inesperado en servidor web:', error.name || 'Error');
    if (!res.headersSent) res.writeHead(500);
    if (!res.writableEnded) res.end();
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`PetGo web + API activo en puerto ${port}`);
});
