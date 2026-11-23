// PetGo 2.0: catálogo activo. Frontend -> API Node.js -> Supabase.
// Se reutiliza la autenticación de cookies de la API de mascotas.
const { supabaseAuth, supabaseAdmin } = require('../database/supabase');

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

function readCookies(req) {
  const cookies = Object.create(null);
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    try {
      cookies[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    } catch { /* Cookie malformada */ }
  }
  return cookies;
}

function sessionCookie(name, value, age) {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    'HttpOnly', 'SameSite=Lax', 'Path=/api', `Max-Age=${age}`
  ];
  if (process.env.NODE_ENV === 'production') attributes.push('Secure');
  return attributes.join('; ');
}

async function authenticated(req, res) {
  const cookies = readCookies(req);
  if (cookies.petgo_access) {
    const { data, error } = await supabaseAuth.auth.getUser(cookies.petgo_access);
    if (!error && data?.user) return true;
  }
  if (cookies.petgo_refresh) {
    const { data, error } = await supabaseAuth.auth.refreshSession({
      refresh_token: cookies.petgo_refresh
    });
    if (!error && data?.user && data?.session) {
      res.setHeader('Set-Cookie', [
        sessionCookie('petgo_access', data.session.access_token, Number(data.session.expires_in) || 3600),
        sessionCookie('petgo_refresh', data.session.refresh_token, 30 * 24 * 3600)
      ]);
      return true;
    }
  }
  res.setHeader('Set-Cookie', [
    sessionCookie('petgo_access', '', 0),
    sessionCookie('petgo_refresh', '', 0)
  ]);
  return false;
}

async function handleServices(req, res) {
  try {
    if (!await authenticated(req, res)) {
      return send(res, 401, { success: false, error: 'Debes iniciar sesion.' });
    }

    const servicesResult = await supabaseAdmin
      .from('services')
      .select('id,nombre,activo')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (servicesResult.error) {
      console.error('Services:', servicesResult.error.code);
      return send(res, 503, { success: false, error: 'No fue posible cargar los servicios.' });
    }

    const variantsResult = await supabaseAdmin
      .from('service_variants')
      .select('id,service_id,nombre,activo')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (variantsResult.error) {
      console.error('Service variants:', variantsResult.error.code);
      return send(res, 503, { success: false, error: 'No fue posible cargar las modalidades.' });
    }

    const services = (servicesResult.data || []).map(service => ({
      id: service.id,
      nombre: service.nombre,
      variants: (variantsResult.data || [])
        .filter(variant => variant.service_id === service.id)
        .map(variant => ({ id: variant.id, nombre: variant.nombre }))
    }));

    return send(res, 200, { success: true, services });
  } catch (err) {
    console.error('Catalog API:', err.name || 'Error');
    return send(res, 503, { success: false, error: 'Catalogo no disponible.' });
  }
}

module.exports = { handleServices };
