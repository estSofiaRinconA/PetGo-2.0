
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const server = require('../server');

let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  if (server.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});

test('GET / responde que PetGo está activo', async () => {
  const response = await fetch(`${baseUrl}/`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, 'API PetGo 2.0 activa');
});

test('GET /ruta-inexistente devuelve 404', async () => {
  const response = await fetch(`${baseUrl}/ruta-inexistente`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.equal(body.error, 'Ruta no encontrada');
});

test('POST /api/services devuelve 405', async () => {
  const response = await fetch(`${baseUrl}/api/services`, {
    method: 'POST'
  });

  const body = await response.json();

  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
  assert.equal(body.success, false);
  assert.equal(body.error, 'Método no permitido');
});

test('GET /api/services/inexistente devuelve 404', async () => {
  const response = await fetch(
    `${baseUrl}/api/services/inexistente`
  );

  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.equal(body.error, 'Ruta no encontrada');
});

test('OPTIONS /api/services devuelve 204', async () => {
  const response = await fetch(`${baseUrl}/api/services`, {
    method: 'OPTIONS'
  });

  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
});
