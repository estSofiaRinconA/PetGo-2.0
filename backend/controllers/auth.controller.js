
const supabaseAuth = require('../database/supabase-auth');

async function register(body) {
  const { nombre, email, password } = body || {};

  if (
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    nombre.trim().length > 100 ||
    typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    email.length > 254 ||
    typeof password !== 'string' ||
    password.length < 12
  ) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Datos de registro inválidos'
      }
    };
  }

  try {
    const { data, error } = await supabaseAuth.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          nombre: nombre.trim()
        }
      }
    });

    if (error) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'No se pudo completar el registro'
        }
      };
    }

    return {
      status: 201,
      body: {
        success: true,
        message: 'Registro recibido. Verifica tu correo si se solicita.',
        data: {
          requiere_confirmacion: !data?.session
        }
      }
    };
  } catch {
    return {
      status: 503,
      body: {
        success: false,
        error: 'Servicio de autenticación no disponible'
      }
    };
  }
}

module.exports = { register };
