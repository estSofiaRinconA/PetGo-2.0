
const test = require('node:test');
const assert = require('node:assert/strict');

const supabaseAuth = require('../database/supabase-auth');
const { register } = require('../controllers/auth.controller');

const originalSignUp = supabaseAuth.auth.signUp;

test('Registro rechaza datos incompletos', async () => {
  const result = await register({
    nombre: '',
    email: '',
    password: ''
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.success, false);
});

test('Registro rechaza contraseñas cortas', async () => {
  const result = await register({
    nombre: 'Cliente Prueba',
    email: 'cliente@example.com',
    password: '12345'
  });

  assert.equal(result.status, 400);
  assert.equal(result.body.success, false);
});

test('Registro acepta datos válidos', async () => {
  let receivedOptions;

  supabaseAuth.auth.signUp = async (options) => {
    receivedOptions = options;

    return {
      data: {
        user: { id: 'usuario-simulado' },
        session: null
      },
      error: null
    };
  };

  try {
    const result = await register({
      nombre: 'Cliente Prueba',
      email: 'CLIENTE@example.com',
      password: 'ClaveSegura123!'
    });

    assert.equal(result.status, 201);
    assert.equal(result.body.success, true);
    assert.equal(
      result.body.data.requiere_confirmacion,
      true
    );

    assert.equal(
      receivedOptions.email,
      'cliente@example.com'
    );

    assert.equal(
      receivedOptions.options.data.nombre,
      'Cliente Prueba'
    );

    assert.equal(
      Object.hasOwn(receivedOptions.options.data, 'rol'),
      false
    );
  } finally {
    supabaseAuth.auth.signUp = originalSignUp;
  }
});

test('Registro maneja errores de Supabase', async () => {
  supabaseAuth.auth.signUp = async () => ({
    data: null,
    error: new Error('Error simulado')
  });

  try {
    const result = await register({
      nombre: 'Cliente Prueba',
      email: 'cliente@example.com',
      password: 'ClaveSegura123!'
    });

    assert.equal(result.status, 400);
    assert.equal(result.body.success, false);
  } finally {
    supabaseAuth.auth.signUp = originalSignUp;
  }
});
