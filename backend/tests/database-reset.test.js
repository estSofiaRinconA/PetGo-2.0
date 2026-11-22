const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const server = require('../server');

let baseUrl;
before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server.listening) {
    await new Promise(resolve => server.close(resolve));
  }
});

test('La API sigue activa sin una base de datos', async () => {
  const response = await fetch(baseUrl + '/');
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.message, 'API PetGo 2.0 activa');
  assert.equal(body.database, 'sin configurar');
});

test('Autenticacion pendiente no intenta usar una base de datos vieja', async () => {
  const response = await fetch(baseUrl + '/api/auth/login', { method: 'POST' });
  const body = await response.json();
  assert.equal(response.status, 503);
  assert.equal(body.success, false);
});

test('Mascotas y servicios quedan como rutas reservadas', async () => {
  for (const ruta of ['/api/pets', '/api/services', '/api/reservations']) {
    const response = await fetch(baseUrl + ruta);
    assert.equal(response.status, 503);
  }
});

test('Una ruta inexistente responde 404', async () => {
  const response = await fetch(baseUrl + '/no-existe');
  assert.equal(response.status, 404);
});
