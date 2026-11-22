
// =====================================================
// PETGO 2.0 - PRUEBAS DE RUTAS
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

  return `http://127.0.0.1:${server.address().port}`;
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

test('Las rutas restantes siguen pendientes', async () => {
  const url = await iniciarServidor();

  const rutas = [
    '/api/pets',
    '/api/services',
    '/api/reservations',
    '/api/notifications'
  ];

  for (const ruta of rutas) {
    const respuesta = await fetch(url + ruta);
    assert.equal(respuesta.status, 503);
  }
});

test('Una ruta desconocida devuelve 404', async () => {
  const url = await iniciarServidor();

  const respuesta = await fetch(
    url + '/api/ruta-inexistente'
  );

  assert.equal(respuesta.status, 404);
});

test('Registro rechaza un metodo incorrecto', async () => {
  const url = await iniciarServidor();
  const respuesta = await fetch(url + '/api/auth/register');

  assert.equal(respuesta.status, 405);
});

test('Login rechaza un metodo incorrecto', async () => {
  const url = await iniciarServidor();
  const respuesta = await fetch(url + '/api/auth/login');

  assert.equal(respuesta.status, 405);
});

test('Consultar usuario sin sesion devuelve 401', async () => {
  const url = await iniciarServidor();
  const respuesta = await fetch(url + '/api/auth/me');

  assert.equal(respuesta.status, 401);
});

test('Registro rechaza datos incompletos', async () => {
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

test('Registro rechaza JSON invalido', async () => {
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

test('Consultar perfil sin sesion devuelve 401', async () => {
  const url = await iniciarServidor();

  const respuesta = await fetch(url + '/api/profile');

  assert.equal(respuesta.status, 401);
});

test('Modificar perfil sin sesion se rechaza', async () => {
  const url = await iniciarServidor();

  const respuesta = await fetch(
    url + '/api/profile',
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Origin': url
      },
      body: JSON.stringify({
        nombre: 'Prueba',
        telefono: '',
        ciudad: ''
      })
    }
  );

  assert.equal(respuesta.status, 401);
});

test('Modificar perfil desde otro origen se rechaza', async () => {
  const url = await iniciarServidor();

  const respuesta = await fetch(
    url + '/api/profile',
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://sitio-no-autorizado.example'
      },
      body: JSON.stringify({
        nombre: 'Prueba',
        telefono: '',
        ciudad: ''
      })
    }
  );

  assert.equal(respuesta.status, 403);
});
