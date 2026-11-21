
const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequireAuth } = require('../middlewares/auth.middleware');

function mockResponse() {
  return {
    status: null,
    body: null,
    writeHead(status) {
      this.status = status;
    },
    end(body) {
      this.body = JSON.parse(body);
    }
  };
}

test('Rechaza solicitudes sin token', async () => {
  const supabase = {
    auth: {
      getUser: async () => {
        throw new Error('No debería ejecutarse');
      }
    }
  };

  const req = { headers: {} };
  const res = mockResponse();

  let nextCalled = false;

  await createRequireAuth(supabase)(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.status, 401);
  assert.equal(nextCalled, false);
});

test('Rechaza tokens inválidos', async () => {
  const supabase = {
    auth: {
      getUser: async () => ({
        data: { user: null },
        error: new Error('Token inválido')
      })
    }
  };

  const req = {
    headers: { authorization: 'Bearer invalid-token' }
  };

  const res = mockResponse();

  let nextCalled = false;

  await createRequireAuth(supabase)(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.status, 401);
  assert.equal(nextCalled, false);
});

test('Acepta usuarios autenticados', async () => {
  const user = {
    id: 'usuario-de-prueba'
  };

  const supabase = {
    auth: {
      getUser: async () => ({
        data: { user },
        error: null
      })
    }
  };

  const req = {
    headers: { authorization: 'Bearer valid-token' }
  };

  const res = mockResponse();

  let nextCalled = false;

  await createRequireAuth(supabase)(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, user);
});

test('Maneja fallos de Supabase Auth', async () => {
  const supabase = {
    auth: {
      getUser: async () => {
        throw new Error('Servicio no disponible');
      }
    }
  };

  const req = {
    headers: { authorization: 'Bearer test-token' }
  };

  const res = mockResponse();

  let nextCalled = false;

  await createRequireAuth(supabase)(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.status, 503);
  assert.equal(nextCalled, false);
});


const authRoutes = require('../routes/auth.routes');

test('GET /api/auth/me sin token devuelve 401', async () => {
  const req = {
    method: 'GET',
    headers: {}
  };

  const res = mockResponse();

  await authRoutes(req, res, '/api/auth/me');

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Autenticación requerida');
});

test('POST /api/auth/me devuelve 405', async () => {
  const req = {
    method: 'POST',
    headers: {}
  };

  const res = mockResponse();

  await authRoutes(req, res, '/api/auth/me');

  assert.equal(res.status, 405);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Método no permitido');
});

test('Ruta de autenticación inexistente devuelve 404', async () => {
  const req = {
    method: 'GET',
    headers: {}
  };

  const res = mockResponse();

  await authRoutes(req, res, '/api/auth/inexistente');

  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Ruta no encontrada');
});

