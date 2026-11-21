
const supabase = require('../database/supabase');
const supabaseAuth = require('../database/supabase-auth');
const authController = require('../controllers/auth.controller');

const {
  createRequireAuth
} = require('../middlewares/auth.middleware');

const requireAuth = createRequireAuth(supabase);

function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers
  });

  return res.end(JSON.stringify(body));
}

async function readJson(req) {
  let body = '';

  for await (const chunk of req) {
    body += chunk.toString();

    if (Buffer.byteLength(body, 'utf8') > 16384) {
      const error = new Error('Solicitud demasiado grande');
      error.status = 413;
      throw error;
    }
  }

  try {
    return JSON.parse(body);
  } catch {
    const error = new Error('JSON inválido');
    error.status = 400;
    throw error;
  }
}

async function login(req, res) {
  let body;

  try {
    body = await readJson(req);
  } catch (error) {
    return sendJson(res, error.status || 400, {
      success: false,
      error: error.message
    });
  }

  const { email, password } = body || {};

  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() ||
    !password
  ) {
    return sendJson(res, 400, {
      success: false,
      error: 'Correo y contraseña son obligatorios'
    });
  }

  try {
    const { data, error } =
      await supabaseAuth.auth.signInWithPassword({
        email: email.trim(),
        password
      });

    if (error || !data?.session || !data?.user) {
      return sendJson(res, 401, {
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    return sendJson(res, 200, {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email
        },
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in
      }
    });
  } catch {
    return sendJson(res, 503, {
      success: false,
      error: 'Servicio de autenticación no disponible'
    });
  }
}

async function authRoutes(req, res, pathname) {

  // Registro de clientes
  if (pathname === '/api/auth/register') {
    if (req.method !== 'POST') {
      return sendJson(res, 405, {
        success: false,
        error: 'Método no permitido'
      }, { Allow: 'POST' });
    }

    let body;

    try {
      body = await readJson(req);
    } catch (error) {
      return sendJson(res, error.status || 400, {
        success: false,
        error: error.message
      });
    }

    const result = await authController.register(body);

    return sendJson(res, result.status, result.body);
  }

  // Inicio de sesión
  if (pathname === '/api/auth/login') {
    if (req.method !== 'POST') {
      return sendJson(res, 405, {
        success: false,
        error: 'Método no permitido'
      }, { Allow: 'POST' });
    }

    return login(req, res);
  }

  // Consultar usuario autenticado
  if (pathname === '/api/auth/me') {
    if (req.method !== 'GET') {
      return sendJson(res, 405, {
        success: false,
        error: 'Método no permitido'
      }, { Allow: 'GET' });
    }

    return requireAuth(req, res, () => {
      return sendJson(res, 200, {
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email ?? null
        }
      });
    });
  }

  return sendJson(res, 404, {
    success: false,
    error: 'Ruta no encontrada'
  });
}

module.exports = authRoutes;
