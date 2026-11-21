
const supabase = require('../database/supabase');

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
  let contenido = '';
  let bytes = 0;

  for await (const chunk of req) {
    bytes += chunk.length;

    if (bytes > 16384) {
      const error = new Error('Solicitud demasiado grande');
      error.status = 413;
      throw error;
    }

    contenido += chunk.toString('utf8');
  }

  try {
    return JSON.parse(contenido);
  } catch {
    const error = new Error('JSON inválido');
    error.status = 400;
    throw error;
  }
}

function validarMascota(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }

  const { nombre, especie, raza, observaciones } = body;

  if (
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    nombre.trim().length > 100 ||
    !['perro', 'gato'].includes(especie) ||
    (raza != null &&
      (typeof raza !== 'string' || raza.length > 100)) ||
    (observaciones != null &&
      (typeof observaciones !== 'string' ||
        observaciones.length > 1000))
  ) {
    return null;
  }

  return {
    nombre: nombre.trim(),
    especie,
    raza: raza?.trim() || null,
    descripcion: observaciones?.trim() || ''
  };
}

async function listarMascotas(req, res) {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select(
        'id,nombre,especie,raza,fecha_nacimiento,descripcion,foto_path,created_at'
      )
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return sendJson(res, 200, {
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error al consultar mascotas:', error.message);

    return sendJson(res, 503, {
      success: false,
      error: 'No fue posible consultar las mascotas'
    });
  }
}

async function crearMascota(req, res) {
  let body;

  try {
    body = await readJson(req);
  } catch (error) {
    return sendJson(res, error.status || 400, {
      success: false,
      error: error.message
    });
  }

  const mascota = validarMascota(body);

  if (!mascota) {
    return sendJson(res, 400, {
      success: false,
      error: 'Datos de la mascota inválidos'
    });
  }

  try {
    const { data, error } = await supabase
      .from('pets')
      .insert({
        ...mascota,
        user_id: req.user.id
      })
      .select(
        'id,nombre,especie,raza,fecha_nacimiento,descripcion,foto_path,created_at'
      )
      .single();

    if (error) {
      if (error.code === '23503') {
        return sendJson(res, 409, {
          success: false,
          error: 'Tu perfil de cliente todavía no está disponible'
        });
      }

      throw error;
    }

    return sendJson(res, 201, {
      success: true,
      message: 'Mascota registrada correctamente',
      data
    });
  } catch (error) {
    console.error('Error al registrar mascota:', error.message);

    return sendJson(res, 503, {
      success: false,
      error: 'No fue posible registrar la mascota'
    });
  }
}

function petsRoutes(req, res, pathname) {
  if (pathname !== '/api/pets') {
    return sendJson(res, 404, {
      success: false,
      error: 'Ruta no encontrada'
    });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return sendJson(res, 405, {
      success: false,
      error: 'Método no permitido'
    }, {
      Allow: 'GET, POST'
    });
  }

  return requireAuth(req, res, () => {
    if (req.method === 'GET') {
      return listarMascotas(req, res);
    }

    return crearMascota(req, res);
  });
}

module.exports = petsRoutes;
