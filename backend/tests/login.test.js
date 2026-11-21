
const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');

const supabaseAuth = require('../database/supabase-auth');
const authRoutes = require('../routes/auth.routes');

const originalSignIn = supabaseAuth.auth.signInWithPassword;

function mockRequest(body) {
  const req = Readable.from([JSON.stringify(body)]);

  req.method = 'POST';
  req.headers = {};

  return req;
}

function mockResponse() {
  return {
    status: null,
    headers: null,
    body: null,

    writeHead(status, headers) {
      this.status = status;
      this.headers = headers;
    },

    end(body) {
      this.body = JSON.parse(body);
    }
  };
}

test('Login rechaza campos vacíos', async () => {
  const req = mockRequest({
    email: '',
    password: ''
  });

  const res = mockResponse();

  await authRoutes(req, res, '/api/auth/login');

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('Login rechaza credenciales inválidas', async () => {
  supabaseAuth.auth.signInWithPassword = async () => ({
    data: { session: null },
    error: new Error('Credenciales inválidas')
  });

  try {
    const req = mockRequest({
      email: 'prueba@example.com',
      password: 'contraseña-de-prueba'
    });

    const res = mockResponse();

    await authRoutes(req, res, '/api/auth/login');

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  } finally {
    supabaseAuth.auth.signInWithPassword = originalSignIn;
  }
});

test('Login permite credenciales válidas', async () => {
  supabaseAuth.auth.signInWithPassword = async () => ({
    data: {
      user: {
        id: 'usuario-prueba',
        email: 'prueba@example.com'
      },
      session: {
        access_token: 'token-simulado',
        refresh_token: 'refresh-simulado',
        expires_in: 3600
      }
    },
    error: null
  });

  try {
    const req = mockRequest({
      email: 'prueba@example.com',
      password: 'contraseña-de-prueba'
    });

    const res = mockResponse();

    await authRoutes(req, res, '/api/auth/login');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(
      res.body.data.user.email,
      'prueba@example.com'
    );
    assert.equal(
      res.body.data.access_token,
      'token-simulado'
    );
  } finally {
    supabaseAuth.auth.signInWithPassword = originalSignIn;
  }
});

test('Login maneja fallos del proveedor', async () => {
  supabaseAuth.auth.signInWithPassword = async () => {
    throw new Error('Servicio no disponible');
  };

  try {
    const req = mockRequest({
      email: 'prueba@example.com',
      password: 'contraseña-de-prueba'
    });

    const res = mockResponse();

    await authRoutes(req, res, '/api/auth/login');

    assert.equal(res.status, 503);
    assert.equal(res.body.success, false);
  } finally {
    supabaseAuth.auth.signInWithPassword = originalSignIn;
  }
});
