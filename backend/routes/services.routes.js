
const servicesController = require(
  '../controllers/services.controller'
);

function servicesRoutes(req, res, pathname) {
  if (pathname === '/api/services') {
    if (req.method === 'GET') {
      return servicesController.listServices(req, res);
    }

    res.writeHead(405, {
      'Content-Type': 'application/json',
      'Allow': 'GET'
    });

    return res.end(JSON.stringify({
      success: false,
      error: 'Método no permitido'
    }));
  }

  res.writeHead(404, {
    'Content-Type': 'application/json'
  });

  res.end(JSON.stringify({
    success: false,
    error: 'Ruta no encontrada'
  }));
}

module.exports = servicesRoutes;
