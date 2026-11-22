
// ======================================================
// PETGO 2.0 - API PROPIA NODE.JS
// Autenticacion y sesiones HTTP
// ======================================================

const http = require('node:http');

const PORT = Number(process.env.PORT || 3000);

function responder(res, codigo, contenido, extra = {}) {
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extra
  });

  res.end(JSON.stringify(contenido));
}

const rutas = new Map([
  ['/api/auth/register', ['POST']],
  ['/api/auth/login', ['POST']],
  ['/api/auth/me', ['GET']],
  ['/api/auth/logout', ['POST']],

  ['/api/services', ['GET']],
  ['/api/pets', ['GET', 'POST']],
  ['/api/reservations', ['GET', 'POST']],
  ['/api/profile', ['GET', 'PATCH']],
  ['/api/notifications', ['GET']]
]);

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  let pathname;

  try {
    pathname = new URL(
      req.url,
      `http://${req.headers.host || 'localhost'}`
    ).pathname;
  } catch {
    return responder(res, 400, {
      success: false,
      error: 'URL inválida'
    });
  }

  if (pathname === '/' && req.method === 'GET') {
    return responder(res, 200, {
      success: true,
      message: 'API PetGo 2.0 activa'
    });
  }

  const metodos = rutas.get(pathname);

  if (!metodos) {
    return responder(res, 404, {
      success: false,
      error: 'Ruta no encontrada'
    });
  }

  if (!metodos.includes(req.method)) {
    return responder(
      res,
      405,
      {
        success: false,
        error: 'M\u00e9todo no permitido'
      },
      {
        Allow: metodos.join(', ')
      }
    );
  }

  if (pathname.startsWith('/api/auth/')) {
    try {
      const { manejarAuth } = require(
        './routes/auth.routes'
      );

      return await manejarAuth(
        req,
        res,
        pathname
      );
    } catch (error) {
      console.error(
        'Autenticación no disponible:',
        error.name || 'Error'
      );

      return responder(res, 503, {
        success: false,
        error: 'Servicio de autenticación no disponible.'
      });
    }
  }

  return responder(res, 503, {
    success: false,
    error:
      'Función temporalmente no disponible: ' +
      'integración pendiente.'
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(
      `API PetGo activa en http://localhost:${PORT}`
    );
  });
}

module.exports = server;
