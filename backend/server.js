
// ======================================================
// PETGO 2.0 - API PROPIA NODE.JS
// Estado: sin conexion a bases de datos
// ======================================================

const http = require('node:http');

const PORT = Number(process.env.PORT || 3000);

// ------------------------------------------------------
// RESPUESTAS JSON
// ------------------------------------------------------

function responder(res, codigo, contenido, extra = {}) {
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extra
  });

  return res.end(JSON.stringify(contenido));
}

// ------------------------------------------------------
// RUTAS RESERVADAS PARA LA NUEVA IMPLEMENTACION
// ------------------------------------------------------

const rutasPendientes = new Map([
  ['/api/services', ['GET']],
  ['/api/auth/register', ['POST']],
  ['/api/auth/login', ['POST']],
  ['/api/auth/me', ['GET']],
  ['/api/pets', ['GET', 'POST']],
  ['/api/reservations', ['GET', 'POST']],
  ['/api/profile', ['GET', 'PATCH']],
  ['/api/notifications', ['GET']]
]);

// ------------------------------------------------------
// SERVIDOR HTTP
// ------------------------------------------------------

const server = http.createServer((req, res) => {
  // Respuesta a solicitudes OPTIONS

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
      error: 'URL invalida'
    });
  }

  // Comprobar que nuestra API esta activa

  if (pathname === '/' && req.method === 'GET') {
    return responder(res, 200, {
      success: true,
      message: 'API PetGo 2.0 activa',
      database: 'sin configurar'
    });
  }

  // Rutas que posteriormente usaran la nueva base

  const metodos = rutasPendientes.get(pathname);

  if (metodos) {
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

    return responder(res, 503, {
      success: false,
      error: (
        'Funcion temporalmente no disponible: ' +
        'nueva base de datos pendiente'
      )
    });
  }

  // Ruta inexistente

  return responder(res, 404, {
    success: false,
    error: 'Ruta no encontrada'
  });
});

// ------------------------------------------------------
// INICIAR SERVIDOR
// ------------------------------------------------------

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(
      `API PetGo activa en http://localhost:${PORT}`
    );

    console.log(
      'Base de datos: pendiente de configurar'
    );
  });
}

// Permitir ejecutar pruebas automatizadas

module.exports = server;
