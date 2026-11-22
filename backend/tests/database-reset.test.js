
// =====================================================
// PETGO 2.0 - PRUEBAS DE INTEGRACION INICIAL
// =====================================================

const test = require('node:test');
const assert = require('node:assert/strict');

const server = require('../server');

async function iniciarServidor() {
  if (!server.listening) {
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
  }

  const direccion = server.address();

  return `http://127.0.0.1:${direccion.port}`;
}

test.after(async () => {
  if (server.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
});

test('La API propia sigue activa', async () => {
  const url = await iniciarServidor();
  const respuesta = await fetch(url + '/');

  assert.equal(respuesta.status, 200);

  const datos = await respuesta.json();

  assert.equal(datos.success, true);
});

test('Las rutas de datos siguen reservadas', async () => {
  const url = await iniciarServidor();

  const rutas = [
    '/api/pets',
    '/api/services',
    '/api/reservations',
    '/api/profile',
    '/api/notifications'
  ];

  for (const ruta of rutas) {
    const respuesta = await fetch(url + ruta);

    assert.equal(
      respuesta.status,
      503,
      `La ruta ${ruta} debe continuar pendiente`
    );
  }
});

test('Una ruta desconocida devuelve 404', async () => {
  const url = await iniciarServidor();

  const respuesta = await fetch(
    url + '/api/ruta-inexistente'
  );

  assert.equal(respuesta.status, 404);
});

test('Registro rechaza un método incorrecto', async () => {
  const url = await iniciarServidor();

  const respuesta = await fetch(
    url + '/api/auth/register'
  );

  assert.equal(respuesta.status, 405);
});

test('Login rechaza un método incorrecto', async () => {
  const url = await iniciarServidor();

  const respuesta = await fetch(
    url + '/api/auth/login'
  );

  assert.equal(respuesta.status, 405);
});

test('Solicitud sin sesion se rechaza', async () => {
  const url = await iniciarServidor();

  const respuesta = await fetch(
    url + '/api/auth/me'
  );

  assert.equal(respuesta.status, 401);

  const datos = await respuesta.json();

  assert.equal(datos.success, false);
});

test('El registro rechaza datos incompletos', async () => {
  const url = await iniciarServidor();

  const respuesta = await fetch(
    url + '/api/auth/register',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: '',
        email: 'incorrecto',
        password: '123'
      })
    }
  );

  assert.equal(respuesta.status, 400);
});

test('El registro rechaza JSON inválido', async () => {
  const url = await iniciarServidor();

  const respuesta = await fetch(
    url + '/api/auth/register',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: '{json-invalido'
    }
  );

  assert.equal(respuesta.status, 400);
});
