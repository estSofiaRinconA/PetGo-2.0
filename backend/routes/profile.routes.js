
// =====================================================
// PETGO 2.0 - API DE MI PERFIL
// GET   /api/profile
// PATCH /api/profile
//
// El usuario se identifica por su sesion.
// Nunca aceptamos un user_id enviado por el frontend.
// =====================================================

const {
  supabaseAuth,
  supabaseAdmin
} = require('../database/supabase');

const LIMITE_JSON = 16 * 1024;

function responder(res, codigo, contenido) {
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });

  res.end(JSON.stringify(contenido));
}

// -----------------------------------------------------
// COOKIES Y SESION
// -----------------------------------------------------

function leerCookies(req) {
  const resultado = {};

  for (const parte of (req.headers.cookie || '').split(';')) {
    const posicion = parte.indexOf('=');

    if (posicion < 0) continue;

    const nombre = parte.slice(0, posicion).trim();
    const valor = parte.slice(posicion + 1).trim();

    try {
      resultado[nombre] = decodeURIComponent(valor);
    } catch {
      // Ignorar cookies malformadas.
    }
  }

  return resultado;
}

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

function borrarCookies(res) {
  res.setHeader('Set-Cookie', [
    crearCookie('petgo_access', '', 0),
    crearCookie('petgo_refresh', '', 0)
  ]);
}

function guardarCookies(res, sesion) {
  if (!sesion?.access_token || !sesion?.refresh_token) {
    throw new Error('Sesion incompleta');
  }

  res.setHeader('Set-Cookie', [
    crearCookie(
      'petgo_access',
      sesion.access_token,
      Number(sesion.expires_in) || 3600
    ),
    crearCookie(
      'petgo_refresh',
      sesion.refresh_token,
      30 * 24 * 60 * 60
    )
  ]);
}

async function obtenerUsuario(req, res) {
  const cookies = leerCookies(req);

  if (cookies.petgo_access) {
    const { data, error } =
      await supabaseAuth.auth.getUser(
        cookies.petgo_access
      );

    if (!error && data?.user) {
      return { user: data.user, token: cookies.petgo_access };
    }
  }

  if (cookies.petgo_refresh) {
    const { data, error } =
      await supabaseAuth.auth.refreshSession({
        refresh_token: cookies.petgo_refresh
      });

    if (!error && data?.user && data?.session) {
      guardarCookies(res, data.session);
      return { user: data.user, token: data.session.access_token };
    }
  }

  borrarCookies(res);
  return null;
}

// -----------------------------------------------------
// COMPROBAR ORIGEN EN MODIFICACIONES
// -----------------------------------------------------

function origenPermitido(req) {
  const origen = req.headers.origin;

  // Para modificar datos exigimos Origin.
  if (!origen) return false;

  try {
    const url = new URL(origen);

    if (
      (url.protocol === 'http:' ||
       url.protocol === 'https:') &&
      url.host === req.headers.host
    ) {
      return true;
    }

    if (
      process.env.FRONTEND_ORIGIN &&
      origen === process.env.FRONTEND_ORIGIN
    ) {
      return true;
    }

    if (process.env.NODE_ENV !== 'production') {
      return [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174'
      ].includes(origen);
    }

    return false;
  } catch {
    return false;
  }
}

// -----------------------------------------------------
// LEER DATOS DE LA SOLICITUD
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

  let datos;

  try {
    datos = JSON.parse(
      Buffer.concat(fragmentos).toString('utf8')
    );
  } catch {
    const error = new Error('JSON incorrecto');
    error.status = 400;
    throw error;
  }

  if (
    !datos ||
    typeof datos !== 'object' ||
    Array.isArray(datos)
  ) {
    const error = new Error('Se esperaba un objeto JSON');
    error.status = 400;
    throw error;
  }

  return datos;
}

// -----------------------------------------------------
// CONSULTAR PERFIL
// -----------------------------------------------------

async function consultarPerfil(res, usuario) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, nombre, telefono, ciudad')
    .eq('id', usuario.id)
    .maybeSingle();

  if (error) {
    console.error('Error al consultar perfil:', error.code);

    return responder(res, 503, {
      success: false,
      error: 'No se pudo consultar tu perfil.'
    });
  }

  if (!data) {
    return responder(res, 404, {
      success: false,
      error: 'No encontramos el perfil de esta cuenta.'
    });
  }

  return responder(res, 200, {
    success: true,
    profile: {
      id: data.id,
      nombre: data.nombre,
      email: usuario.email || '',
      telefono: data.telefono,
      ciudad: data.ciudad
    }
  });
}

// -----------------------------------------------------
// ACTUALIZAR PERFIL
// -----------------------------------------------------

async function actualizarPerfil(req, res, usuario) {
  const datos = await leerJSON(req);

  const camposPermitidos = [
    'nombre',
    'telefono',
    'ciudad'
  ];

  const camposRecibidos = Object.keys(datos);

  if (
    camposRecibidos.length !== 3 ||
    camposRecibidos.some(
      (campo) => !camposPermitidos.includes(campo)
    )
  ) {
    return responder(res, 400, {
      success: false,
      error: 'Los datos del perfil no son validos.'
    });
  }

  if (
    typeof datos.nombre !== 'string' ||
    typeof datos.telefono !== 'string' ||
    typeof datos.ciudad !== 'string'
  ) {
    return responder(res, 400, {
      success: false,
      error: 'Los campos deben contener texto.'
    });
  }

  const nombre = datos.nombre.trim();
  const telefono = datos.telefono.trim();
  const ciudad = datos.ciudad.trim();

  if (!nombre || nombre.length > 100) {
    return responder(res, 400, {
      success: false,
      error: 'Ingresa un nombre de maximo 100 caracteres.'
    });
  }

  if (
    telefono.length > 30 ||
    (telefono && !/^[0-9+()\s-]+$/.test(telefono))
  ) {
    return responder(res, 400, {
      success: false,
      error: 'Ingresa un telefono valido.'
    });
  }

  if (ciudad.length > 100) {
    return responder(res, 400, {
      success: false,
      error: 'La ciudad no puede superar 100 caracteres.'
    });
  }

  // IMPORTANTE:
  // La identidad procede de la sesion verificada.
  // Nunca se usa un ID recibido en el cuerpo JSON.

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      nombre,
      telefono: telefono || null,
      ciudad: ciudad || null
    })
    .eq('id', usuario.id)
    .select('id, nombre, telefono, ciudad')
    .maybeSingle();

  if (error) {
    console.error('Error al actualizar perfil:', error.code);

    return responder(res, 503, {
      success: false,
      error: 'No se pudieron guardar los cambios.'
    });
  }

  if (!data) {
    return responder(res, 404, {
      success: false,
      error: 'No encontramos el perfil de esta cuenta.'
    });
  }

  return responder(res, 200, {
    success: true,
    message: 'Datos guardados correctamente.',
    profile: {
      id: data.id,
      nombre: data.nombre,
      email: usuario.email || '',
      telefono: data.telefono,
      ciudad: data.ciudad
    }
  });
}

// -----------------------------------------------------
// CAMBIAR EMAIL Y CONTRASENA
// -----------------------------------------------------

// Proteccion basica por cuenta contra intentos reiterados. En servicios con
// varias instancias, trasladar este limite a almacenamiento compartido.
const intentos = new Map();
function permitirIntento(id) {
  const ahora = Date.now();
  const actual = intentos.get(id);
  if (!actual || actual.hasta < ahora) {
    intentos.set(id, { cantidad: 1, hasta: ahora + 15 * 60 * 1000 });
    return true;
  }
  if (actual.cantidad >= 5) return false;
  actual.cantidad++;
  return true;
}

async function comprobarClaveActual(usuario, clave) {
  if (!usuario.email || typeof clave !== 'string' || !clave) return false;
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email: usuario.email,
    password: clave
  });
  return !error && data?.user?.id === usuario.id;
}

// Emplea el token del propio usuario. No usa service_role para cambiar
// identidad y respeta las confirmaciones configuradas en Supabase Auth.
async function actualizarIdentidad(token, cambios) {
  const url = process.env.SUPABASE_URL;
  const clavePublica = process.env.SUPABASE_PUBLISHABLE_KEY;
  const respuesta = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': clavePublica,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cambios),
    signal: AbortSignal.timeout(15000)
  });
  if (!respuesta.ok) {
    let codigo = '';
    try {
      const fallo = await respuesta.json();
      codigo = fallo.code || fallo.error_code || '';
    } catch { /* no divulgar respuesta del proveedor */ }
    console.error('Actualizacion de seguridad rechazada:', respuesta.status, codigo);
    if (respuesta.status === 429) return { ok: false, status: 429, mensaje: 'Demasiadas solicitudes. Intenta mas tarde.' };
    if (respuesta.status === 401) return { ok: false, status: 401, mensaje: 'Tu sesion expiro. Inicia sesion de nuevo.' };
    if (respuesta.status === 422 || respuesta.status === 400) return { ok: false, status: 400, mensaje: 'Supabase no acepto el cambio. Revisa el correo o la politica de contrasenas.' };
    return { ok: false, status: 503, mensaje: 'No se pudo completar el cambio en este momento.' };
  }
  return { ok: true };
}

async function actualizarSeguridad(req, res, identidad, pathname) {
  const usuario = identidad.user;
  const datos = await leerJSON(req);
  const esEmail = pathname === '/api/profile/security/email';
  const campos = esEmail ? ['currentPassword', 'newEmail'] :
    ['currentPassword', 'newPassword', 'confirmPassword'];

  if (Object.keys(datos).length !== campos.length ||
      Object.keys(datos).some(campo => !campos.includes(campo))) {
    return responder(res, 400, { success: false, error: 'Formulario de seguridad invalido.' });
  }

  const clave = datos.currentPassword;
  if (typeof clave !== 'string' || !clave || clave.length > 1024) {
    return responder(res, 400, { success: false, error: 'Ingresa tu contrasena actual.' });
  }

  let cambios;
  if (esEmail) {
    if (typeof datos.newEmail !== 'string') {
      return responder(res, 400, { success: false, error: 'Correo invalido.' });
    }
    const nuevo = datos.newEmail.trim().toLowerCase();
    if (nuevo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevo) ||
        nuevo === (usuario.email || '').toLowerCase()) {
      return responder(res, 400, { success: false, error: 'Introduce un correo diferente y valido.' });
    }
    cambios = { email: nuevo };
  } else {
    if (typeof datos.newPassword !== 'string' ||
        typeof datos.confirmPassword !== 'string' ||
        datos.newPassword.length < 10 || datos.newPassword.length > 128 ||
        datos.newPassword !== datos.confirmPassword ||
        datos.newPassword === clave) {
      return responder(res, 400, { success: false, error: 'La nueva contrasena debe tener al menos 10 caracteres, ser diferente de la actual y coincidir con su confirmacion.' });
    }
    cambios = { password: datos.newPassword };
  }

  if (!permitirIntento(usuario.id)) {
    return responder(res, 429, { success: false, error: 'Demasiados intentos. Intenta nuevamente en 15 minutos.' });
  }
  const valida = await comprobarClaveActual(usuario, clave);
  if (!valida) {
    return responder(res, 403, { success: false, error: 'La contrasena actual no es correcta o esta cuenta no usa contrasena.' });
  }

  const resultado = await actualizarIdentidad(identidad.token, cambios);
  if (!resultado.ok) {
    return responder(res, resultado.status, { success: false, error: resultado.mensaje });
  }
  intentos.delete(usuario.id);
  if (esEmail) {
    return responder(res, 200, {
      success: true,
      message: 'Solicitud enviada. Revisa los mensajes de confirmacion del correo anterior y del nuevo, segun la configuracion de Supabase. El correo de acceso solo cambia cuando se confirma.'
    });
  }
  borrarCookies(res);
  return responder(res, 200, {
    success: true,
    message: 'Contrasena actualizada. Inicia sesion nuevamente.'
  });
}

// -----------------------------------------------------
// ENRUTADOR
// -----------------------------------------------------

async function manejarPerfil(req, res, pathname = '/api/profile') {
  try {
    if (req.method === 'PATCH' && !origenPermitido(req)) {
      return responder(res, 403, { success: false, error: 'Origen de solicitud no permitido.' });
    }

    const identidad = await obtenerUsuario(req, res);
    if (!identidad) {
      return responder(res, 401, { success: false, error: 'Debes iniciar sesion.' });
    }

    if (pathname === '/api/profile') {
      if (req.method === 'GET') return await consultarPerfil(res, identidad.user);
      if (req.method === 'PATCH') return await actualizarPerfil(req, res, identidad.user);
    }

    if ((pathname === '/api/profile/security/email' ||
         pathname === '/api/profile/security/password') && req.method === 'PATCH') {
      return await actualizarSeguridad(req, res, identidad, pathname);
    }

    return responder(res, 405, { success: false, error: 'Metodo no permitido.' });
  } catch (error) {
    if ([400, 413, 415].includes(error.status)) {
      return responder(res, error.status, { success: false, error: error.message });
    }
    console.error('Error de perfil y seguridad:', error.name || 'Error');
    return responder(res, 503, { success: false, error: 'La operacion no esta disponible en este momento.' });
  }
}

module.exports = { manejarPerfil };
