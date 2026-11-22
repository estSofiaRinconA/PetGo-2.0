// PETGO 2.0 - Solicitudes de reserva, exclusivamente mediante la API propia.
const { supabaseAuth, supabaseAdmin } = require('../database/supabase');
const MAX_BODY = 16 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function send(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}
function readCookies(req) {
  const result = Object.create(null);
  for (const part of (req.headers.cookie || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    try { result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim()); }
    catch { /* Ignorar cookies malformadas. */ }
  }
  return result;
}
function cookie(name, value, age) {
  const result = [`${name}=${encodeURIComponent(value)}`, 'HttpOnly', 'SameSite=Lax', 'Path=/api', `Max-Age=${age}`];
  if (process.env.NODE_ENV === 'production') result.push('Secure');
  return result.join('; ');
}
async function getUser(req, res) {
  const cookies = readCookies(req);
  if (cookies.petgo_access) {
    const { data, error } = await supabaseAuth.auth.getUser(cookies.petgo_access);
    if (!error && data?.user) return data.user;
  }
  if (cookies.petgo_refresh) {
    const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token: cookies.petgo_refresh });
    if (!error && data?.user && data?.session) {
      res.setHeader('Set-Cookie', [
        cookie('petgo_access', data.session.access_token, Number(data.session.expires_in) || 3600),
        cookie('petgo_refresh', data.session.refresh_token, 30 * 24 * 3600)
      ]);
      return data.user;
    }
  }
  res.setHeader('Set-Cookie', [cookie('petgo_access', '', 0), cookie('petgo_refresh', '', 0)]);
  return null;
}
function validOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    if (['http:', 'https:'].includes(parsed.protocol) && parsed.host === req.headers.host) return true;
    if (process.env.FRONTEND_ORIGIN && origin === process.env.FRONTEND_ORIGIN) return true;
    if (process.env.NODE_ENV !== 'production') {
      return ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'].includes(origin);
    }
  } catch { return false; }
  return false;
}
async function readJSON(req) {
  if (!/^application\/json(?:\s*;|\s*$)/i.test(req.headers['content-type'] || '')) {
    throw Object.assign(new Error('Se requiere JSON.'), { status: 415 });
  }
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error('Solicitud demasiado grande.'), { status: 413 });
    chunks.push(chunk);
  }
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('JSON invalido.'), { status: 400 }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw Object.assign(new Error('Se requiere un objeto JSON.'), { status: 400 });
  }
  return body;
}
function validRequest(body) {
  const keys = ['pet_id', 'service_variant_id', 'scheduled_at'];
  if (Object.keys(body).length !== keys.length || keys.some(key => typeof body[key] !== 'string')) return null;
  if (!UUID.test(body.pet_id) || !UUID.test(body.service_variant_id)) return null;
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(body.scheduled_at)) return null;
  const date = new Date(body.scheduled_at);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== body.scheduled_at) return null;
  if (date.getTime() < Date.now() + 60 * 1000 || date.getTime() > Date.now() + 180 * 86400000) return null;
  return { pet_id: body.pet_id, service_variant_id: body.service_variant_id, scheduled_at: body.scheduled_at };
}
async function listBookings(res, user) {
  const { data: bookings, error } = await supabaseAdmin.from('bookings')
    .select('id,pet_id,service_variant_id,scheduled_at,status,created_at')
    .eq('user_id', user.id).order('scheduled_at', { ascending: false });
  if (error) {
    console.error('Reservations list:', error.code);
    return send(res, 503, { success: false, error: 'No pudimos consultar tus reservas.' });
  }
  const records = bookings || [];
  if (!records.length) return send(res, 200, { success: true, reservations: [] });

  // Nombres descriptivos, obtenidos por el backend. IDs acotados a los registros propios.
  const petIds = [...new Set(records.map(item => item.pet_id))];
  const variantIds = [...new Set(records.map(item => item.service_variant_id))];
  const [petsResult, variantsResult] = await Promise.all([
    supabaseAdmin.from('pets').select('id,nombre').eq('user_id', user.id).in('id', petIds),
    supabaseAdmin.from('service_variants').select('id,nombre,service_id').in('id', variantIds)
  ]);
  if (petsResult.error || variantsResult.error) {
    console.error('Reservations names:', petsResult.error?.code || variantsResult.error?.code);
    return send(res, 503, { success: false, error: 'No pudimos completar tus reservas.' });
  }
  const serviceIds = [...new Set((variantsResult.data || []).map(item => item.service_id))];
  let services = [];
  if (serviceIds.length) {
    const result = await supabaseAdmin.from('services').select('id,nombre').in('id', serviceIds);
    if (result.error) {
      console.error('Reservations service names:', result.error.code);
      return send(res, 503, { success: false, error: 'No pudimos completar tus reservas.' });
    }
    services = result.data || [];
  }
  const petNames = new Map((petsResult.data || []).map(item => [item.id, item.nombre]));
  const serviceNames = new Map(services.map(item => [item.id, item.nombre]));
  const variantNames = new Map((variantsResult.data || []).map(item => [item.id, item]));
  return send(res, 200, {
    success: true,
    reservations: records.map(item => ({
      id: item.id,
      scheduled_at: item.scheduled_at,
      status: item.status,
      created_at: item.created_at,
      pet_name: petNames.get(item.pet_id) || 'Mascota no disponible',
      variant_name: variantNames.get(item.service_variant_id)?.nombre || 'Modalidad no disponible',
      service_name: serviceNames.get(variantNames.get(item.service_variant_id)?.service_id) || 'Servicio no disponible'
    }))
  });
}
async function createBooking(req, res, user) {
  const body = await readJSON(req);
  const input = validRequest(body);
  if (!input) return send(res, 400, { success: false, error: 'Revisa mascota, modalidad y fecha futura (maximo 180 dias).' });

  const { data: pet, error: petError } = await supabaseAdmin.from('pets')
    .select('id').eq('id', input.pet_id).eq('user_id', user.id).maybeSingle();
  if (petError) {
    console.error('Reservations pet check:', petError.code);
    return send(res, 503, { success: false, error: 'No pudimos verificar la mascota.' });
  }
  if (!pet) return send(res, 400, { success: false, error: 'Selecciona una de tus mascotas registradas.' });

  const { data: variant, error: variantError } = await supabaseAdmin.from('service_variants')
    .select('id,service_id').eq('id', input.service_variant_id).eq('activo', true).maybeSingle();
  if (variantError) {
    console.error('Reservations variant check:', variantError.code);
    return send(res, 503, { success: false, error: 'No pudimos verificar la modalidad.' });
  }
  if (!variant) return send(res, 400, { success: false, error: 'Selecciona una modalidad activa.' });
  const { data: service, error: serviceError } = await supabaseAdmin.from('services')
    .select('id').eq('id', variant.service_id).eq('activo', true).maybeSingle();
  if (serviceError) {
    console.error('Reservations service check:', serviceError.code);
    return send(res, 503, { success: false, error: 'No pudimos verificar el servicio.' });
  }
  if (!service) return send(res, 400, { success: false, error: 'El servicio no esta disponible.' });

  const { data, error } = await supabaseAdmin.from('bookings').insert({
    user_id: user.id,
    pet_id: input.pet_id,
    service_variant_id: input.service_variant_id,
    scheduled_at: input.scheduled_at,
    status: 'pendiente'
  }).select('id,scheduled_at,status').single();
  if (error) {
    console.error('Reservations create:', error.code);
    return send(res, 503, { success: false, error: 'No pudimos registrar tu solicitud.' });
  }
  return send(res, 201, { success: true, reservation: data, message: 'Solicitud registrada. Aun no esta confirmada.' });
}
async function handleReservations(req, res) {
  try {
    if (req.method === 'POST' && !validOrigin(req)) {
      return send(res, 403, { success: false, error: 'Origen no permitido.' });
    }
    const user = await getUser(req, res);
    if (!user) return send(res, 401, { success: false, error: 'Debes iniciar sesion.' });
    if (req.method === 'GET') return await listBookings(res, user);
    if (req.method === 'POST') return await createBooking(req, res, user);
    return send(res, 405, { success: false, error: 'Metodo no permitido.' });
  } catch (error) {
    if ([400, 413, 415].includes(error.status)) return send(res, error.status, { success: false, error: error.message });
    console.error('Reservations API:', error.name || 'Error');
    return send(res, 503, { success: false, error: 'Servicio de reservas no disponible.' });
  }
}
module.exports = { handleReservations, validRequest };
