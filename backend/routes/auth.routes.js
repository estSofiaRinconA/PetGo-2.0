
// =====================================================
// PETGO 2.0 - AUTENTICACION Y SESIONES
// Solo la API Node.js se comunica con Supabase
// =====================================================

const {
  supabaseAuth,
  supabaseAdmin
} = require('../database/supabase');

const COOKIE_ACCESS = 'petgo_access';
const COOKIE_REFRESH = 'petgo_refresh';
const LIMITE_JSON = 16 * 1024;

function responder(res, codigo, contenido) {
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });

  res.end(JSON.stringify(contenido));
}

// -----------------------------------------------------
// COOKIES SEGURAS
// -----------------------------------------------------

function crearCookie(nombre, valor, segundos) {
  const partes = [
    `${nombre}=${encodeURIComponent(valor)}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/api',
    `Max-Age=${Math.max(0, Math.floor(segundos))}`
  ];

  if (process.env.NODE_ENV === 'production') {
    partes.push('Secure');
  }

  return partes.join('; ');
}

function guardarSesion(res, sesion) {
  const acceso = sesion.access_token;
  const renovacion = sesion.refresh_token;

  if (!acceso || !renovacion) {
    throw new Error('Sesion incompleta');
  }

  const duracion = Math.max(
    60,
    Number(sesion.expires_in) || 3600
  );

  res.setHeader('Set-Cookie', [
    crearCookie(COOKIE_ACCESS, acceso, duracion),
    crearCookie(
      COOKIE_REFRESH,
      renovacion,
      30 * 24 * 60 * 60
    )
  ]);
}

function borrarSesion(res) {
  res.setHeader('Set-Cookie', [
    crearCookie(COOKIE_ACCESS, '', 0),
    crearCookie(COOKIE_REFRESH, '', 0)
  ]);
}

function leerCookies(req) {
  const resultado = {};
  const cabecera = req.headers.cookie || '';

  for (const entrada of cabecera.split(';')) {
    const posicion = entrada.indexOf('=');

    if (posicion === -1) continue;

    const nombre = entrada.slice(0, posicion).trim();
    const valor = entrada.slice(posicion + 1).trim();

    try {
      resultado[nombre] = decodeURIComponent(valor);
    } catch {
      // Ignorar cookies malformadas.
    }
  }

  return resultado;
}

// -----------------------------------------------------
// COMPROBACION DE ORIGEN
// -----------------------------------------------------

function origenPermitido(req) {
  const origen = req.headers.origin;

  // Solicitudes sin Origin, como algunas pruebas HTTP.
  if (!origen) {
    return req.headers['sec-fetch-site'] !== 'cross-site';
  }

  try {
    const url = new URL(origen);
    const host = req.headers.host || '';

    const origenServidor =
      `${url.protocol}//${host}`;

    if (origen === origenServidor) return true;

    if (
      process.env.FRONTEND_ORIGIN &&
      origen === process.env.FRONTEND_ORIGIN
    ) {
      return true;
    }

    if (process.env.NODE_ENV !== 'production') {
      const permitidos = new Set([
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
      ]);

      return permitidos.has(origen);
    }

    return false;
  } catch {
    return false;
  }
}

// -----------------------------------------------------
// LEER JSON
// -----------------------------------------------------

async function leerJSON(req) {
  const tipo = req.headers['content-type'] || '';

  if (!tipo.toLowerCase().startsWith('application/json')) {
    const error = new Error('Se requiere JSON');
    error.status = 415;
    throw error;
  }

  const fragmentos = [];
  let total = 0;

  for await (const fragmento of req) {
    total += fragmento.length;

    if (total > LIMITE_JSON) {
      const error = new Error('Solicitud demasiado grande');
      error.status = 413;
      throw error;
    }

    fragmentos.push(fragmento);
  }

  try {
    const datos = JSON.parse(
      Buffer.concat(fragmentos).toString('utf8')
    );

    if (
      !datos ||
      typeof datos !== 'object' ||
      Array.isArray(datos)
    ) {
      throw new Error('JSON incorrecto');
    }

    return datos;
  } catch {
    const error = new Error('Envía un JSON válido');
    error.status = 400;
    throw error;
  }
}

// -----------------------------------------------------
// VALIDACIONES
// -----------------------------------------------------

function correoValido(valor) {
  return (
    typeof valor === 'string' &&
    valor.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
  );
}

function passwordValida(valor) {
  return (
    typeof valor === 'string' &&
    valor.length >= 12 &&
    Buffer.byteLength(valor, 'utf8') <= 1024
  );
}

function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.user_metadata?.nombre || null,
    email_confirmado: Boolean(
      usuario.email_confirmed_at
    )
  };
}

// -----------------------------------------------------
// REGISTRO
// -----------------------------------------------------

async function registrar(req, res) {
  const datos = await leerJSON(req);

  const nombre = typeof datos.nombre === 'string'
    ? datos.nombre.trim()
    : '';

  const email = typeof datos.email === 'string'
    ? datos.email.trim().toLowerCase()
    : '';

  if (!nombre || nombre.length > 100) {
    return responder(res, 400, {
      success: false,
      error: 'Ingresa un nombre válido.'
    });
  }

  if (!correoValido(email)) {
    return responder(res, 400, {
      success: false,
      error: 'Ingresa un correo válido.'
    });
  }

  if (!passwordValida(datos.password)) {
    return responder(res, 400, {
      success: false,
      error: 'La contraseña debe tener al menos 12 caracteres.'
    });
  }

  const { error } = await supabaseAuth.auth.signUp({
    email,
    password: datos.password,
    options: {
      data: { nombre }
    }
  });

  if (error) {
    return responder(res, error.status === 429 ? 429 : 400, {
      success: false,
      error: error.status === 429
        ? 'Demasiados intentos. Intenta más tarde.'
        : 'No se pudo procesar el registro.'
    });
  }

  return responder(res, 200, {
    success: true,
    message:
      'Registro procesado. Revisa tu correo para ' +
      'confirmar tu cuenta si es necesario.'
  });
}

// -----------------------------------------------------
// LOGIN
// -----------------------------------------------------

async function iniciarSesion(req, res) {
  const datos = await leerJSON(req);

  const email = typeof datos.email === 'string'
    ? datos.email.trim().toLowerCase()
    : '';

  const password = datos.password;

  if (
    !correoValido(email) ||
    typeof password !== 'string' ||
    !password
  ) {
    return responder(res, 400, {
      success: false,
      error: 'Ingresa un correo y una contraseña válidos.'
    });
  }

  const { data, error } =
    await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });

  if (error || !data?.session || !data?.user) {
    return responder(res, error?.status === 429 ? 429 : 401, {
      success: false,
      error: error?.status === 429
        ? 'Demasiados intentos. Intenta más tarde.'
        : 'No fue posible iniciar sesión. Revisa tus datos ' +
          'y confirma tu correo si es necesario.'
    });
  }

  guardarSesion(res, data.session);

  // Nunca devolver tokens en JSON.
  return responder(res, 200, {
    success: true,
    message: 'Inicio de sesión correcto.',
    user: usuarioPublico(data.user)
  });
}

// -----------------------------------------------------
// COMPROBAR Y RENOVAR SESION
// -----------------------------------------------------

async function validarSesion(req, res) {
  const cookies = leerCookies(req);

  const acceso = cookies[COOKIE_ACCESS];
  const renovacion = cookies[COOKIE_REFRESH];

  if (acceso) {
    const { data, error } =
      await supabaseAuth.auth.getUser(acceso);

    if (!error && data?.user) {
      return data.user;
    }
  }

  if (!renovacion) {
    borrarSesion(res);
    return null;
  }

  // Renovar usando el refresh token solo en backend.
  const { data, error } =
    await supabaseAuth.auth.refreshSession({
      refresh_token: renovacion
    });

  if (error || !data?.session || !data?.user) {
    borrarSesion(res);
    return null;
  }

  guardarSesion(res, data.session);
  return data.user;
}

// -----------------------------------------------------
// USUARIO ACTUAL
// -----------------------------------------------------

async function obtenerUsuario(req, res) {
  const cookies = leerCookies(req);

  if (
    !cookies[COOKIE_ACCESS] &&
    !cookies[COOKIE_REFRESH]
  ) {
    return responder(res, 401, {
      success: false,
      error: 'Debes iniciar sesión.'
    });
  }

  const usuario = await validarSesion(req, res);

  if (!usuario) {
    return responder(res, 401, {
      success: false,
      error: 'Tu sesión terminó. Inicia sesión nuevamente.'
    });
  }

  return responder(res, 200, {
    success: true,
    user: usuarioPublico(usuario)
  });
}

// -----------------------------------------------------
// CERRAR SESION
// -----------------------------------------------------

async function cerrarSesion(req, res) {
  const cookies = leerCookies(req);
  const acceso = cookies[COOKIE_ACCESS];
  let revocada = !acceso;

  if (acceso) {
    try {
      // Revocar la sesión actual, no otros dispositivos.
      const { error } =
        await supabaseAdmin.auth.admin.signOut(
          acceso,
          'local'
        );

      revocada = !error;
    } catch {
      revocada = false;
    }
  }

  borrarSesion(res);

  if (!revocada) {
    return responder(res, 503, {
      success: false,
      error:
        'Se cerró la sesión de este navegador, ' +
        'pero no se pudo confirmar la revocación remota.'
    });
  }

  return responder(res, 200, {
    success: true,
    message: 'Sesión cerrada.'
  });
}

// -----------------------------------------------------
// ENRUTADOR
// -----------------------------------------------------

async function manejarAuth(req, res, pathname) {
  try {
    if (
      req.method === 'POST' &&
      !origenPermitido(req)
    ) {
      return responder(res, 403, {
        success: false,
        error: 'Origen de solicitud no permitido.'
      });
    }

    switch (pathname) {
      case '/api/auth/register':
        return await registrar(req, res);

      case '/api/auth/login':
        return await iniciarSesion(req, res);

      case '/api/auth/me':
        return await obtenerUsuario(req, res);

      case '/api/auth/logout':
        return await cerrarSesion(req, res);

      default:
        return responder(res, 404, {
          success: false,
          error: 'Ruta no encontrada.'
        });
    }
  } catch (error) {
    if ([400, 413, 415].includes(error.status)) {
      return responder(res, error.status, {
        success: false,
        error: error.message
      });
    }

    console.error(
      'Error de autenticación:',
      error.name || 'Error'
    );

    return responder(res, 503, {
      success: false,
      error: 'Autenticación temporalmente no disponible.'
    });
  }
}

module.exports = {
  manejarAuth
};
