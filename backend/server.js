
const http = require('node:http');
const servicesRoutes = require('./routes/services.routes');
const authRoutes = require('./routes/auth.routes');
const petsRoutes = require('./routes/pets.routes');

const PORT = Number(process.env.PORT || 3000);

const server = http.createServer((req, res) => {
  // Configuración temporal para desarrollo local.
  // Los orígenes permitidos se configurarán antes del frontend.
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  let pathname;

  try {
    const parsedUrl = new URL(
      req.url,
      `http://${req.headers.host || 'localhost'}`
    );

    pathname = parsedUrl.pathname;
  } catch {
    res.writeHead(400);
    return res.end(JSON.stringify({
      success: false,
      error: 'URL inválida'
    }));
  }

  // Ruta de estado
  if (pathname === '/') {
    res.writeHead(200);
    return res.end(JSON.stringify({
      success: true,
      message: 'API PetGo 2.0 activa'
    }));
  }

  // Catálogo de servicios
  if (
    pathname === '/api/services' ||
    pathname.startsWith('/api/services/')
  ) {
    return servicesRoutes(req, res, pathname);
  }

  // Autenticación e identidad del usuario
  if (
    pathname === '/api/auth/me' ||
    pathname.startsWith('/api/auth/')
  ) {
    return authRoutes(req, res, pathname);
  }

  if (
    pathname === '/api/pets' ||
    pathname.startsWith('/api/pets/')
  ) {
    return petsRoutes(req, res, pathname);
  }

  // Ruta no encontrada
  res.writeHead(404);
  return res.end(JSON.stringify({
    success: false,
    error: 'Ruta no encontrada'
  }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`API PetGo activa en http://localhost:${PORT}`);
  });
}

module.exports = server;
