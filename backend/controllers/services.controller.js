
const servicesModel = require('../models/services.model');

async function listServices(req, res) {
  try {
    const services = await servicesModel.getActiveServices();

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8'
    });

    res.end(JSON.stringify({
      success: true,
      data: services
    }));

  } catch (error) {
    console.error('Error consultando servicios:', error);

    res.writeHead(500, {
      'Content-Type': 'application/json; charset=utf-8'
    });

    res.end(JSON.stringify({
      success: false,
      error: 'No fue posible obtener los servicios'
    }));
  }
}

module.exports = {
  listServices
};
