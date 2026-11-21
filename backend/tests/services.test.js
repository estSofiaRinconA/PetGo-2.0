
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const servicesModel = require('../models/services.model');

const originalGetActiveServices = servicesModel.getActiveServices;

let server;
let baseUrl;

before(async () => {
  // Simulamos el modelo antes de cargar el controlador.
  servicesModel.getActiveServices = async () => [];

  server = require('../server');

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  servicesModel.getActiveServices = originalGetActiveServices;

  if (server?.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});

test('GET /api/services devuelve los servicios activos', async () => {
  const mockServices = [
    { id: 1, nombre: 'Baño', slug: 'bano' },
    { id: 2, nombre: 'Paseo', slug: 'paseo' }
  ];

  servicesModel.getActiveServices = async () => mockServices;

  const response = await fetch(`${baseUrl}/api/services`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(body.data, mockServices);
});

test('GET /api/services devuelve un catálogo vacío', async () => {
  servicesModel.getActiveServices = async () => [];

  const response = await fetch(`${baseUrl}/api/services`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(body.data, []);
});

test('GET /api/services maneja errores del modelo', async () => {
  servicesModel.getActiveServices = async () => {
    throw new Error('Error simulado de Supabase');
  };

  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    const response = await fetch(`${baseUrl}/api/services`);
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.success, false);
    assert.equal(
      body.error,
      'No fue posible obtener los servicios'
    );
  } finally {
    console.error = originalConsoleError;
  }
});
