'use strict';
// PetGo: recuperación en tres pasos, exclusivamente por la API Node.js.
const { createClient } = require('@supabase/supabase-js');
const { randomBytes } = require('node:crypto');
require('../database/supabase');

const MAX_BODY = 8192;
const COOLDOWN_MS = 60_000;
const TICKET_MS = 10 * 60_000;
const intentosEnvio = new Map();
const intentosOTP = new Map();
const tickets = new Map();

function responder(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(data));
}
function origenPermitido(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (origin === `${url.protocol}//${req.headers.host}`) return true;
    if (process.env.FRONTEND_ORIGIN && origin === process.env.FRONTEND_ORIGIN) return true;
    if (process.env.NODE_ENV !== 'production') {
      return ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'].includes(origin);
    }
    return false;
  } catch { return false; }
}
async function leerJSON(req) {
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    const err = new Error('Se requiere JSON.'); err.status = 415; throw err;
  }
  const parts = [];
  let total = 0;
  for await (const part of req) {
    total += part.length;
    if (total > MAX_BODY) {
      const err = new Error('Solicitud demasiado grande.'); err.status = 413; throw err;
    }
    parts.push(part);
  }
  try {
    const obj = JSON.parse(Buffer.concat(parts).toString('utf8'));
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error();
    return obj;
  } catch {
    const err = new Error('JSON inválido.'); err.status = 400; throw err;
  }
}
function correoValido(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function clienteAuth() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}
function cookieRecuperacion(value, maxAge) {
  return [
    `petgo_recovery=${encodeURIComponent(value)}`,
    'Path=/api/auth/password',
    'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAge}`,
    ...(process.env.NODE_ENV === 'production' ? ['Secure'] : [])
  ].join('; ');
}
function leerCookie(req, nombre) {
  for (const fragmento of String(req.headers.cookie || '').split(';')) {
    const separador = fragmento.indexOf('=');
    if (separador === -1) continue;
    if (fragmento.slice(0, separador).trim() === nombre) {
      try { return decodeURIComponent(fragmento.slice(separador + 1).trim()); }
      catch { return ''; }
    }
  }
  return '';
}
function eliminarExpirados() {
  const ahora = Date.now();
  for (const [key, ticket] of tickets) {
    if (ticket.expires <= ahora) tickets.delete(key);
  }
  for (const mapa of [intentosEnvio, intentosOTP]) {
    if (mapa.size < 1000) continue;
    for (const [key, valor] of mapa) {
      if (valor.expires <= ahora) mapa.delete(key);
    }
  }
}
function limitar(mapa, clave, limite, ventana) {
  const ahora = Date.now();
  const actual = mapa.get(clave);
  if (!actual || actual.expires <= ahora) {
    mapa.set(clave, { count: 1, expires: ahora + ventana });
    return false;
  }
  if (actual.count >= limite) return true;
  actual.count += 1;
  return false;
}
async function solicitarCodigo(req, res) {
  const data = await leerJSON(req);
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  if (!correoValido(email)) return responder(res, 400, { success: false, error: 'Ingresa un correo válido.' });
  eliminarExpirados();
  const clave = `${req.socket.remoteAddress || ''}|${email}`;
  if (limitar(intentosEnvio, clave, 1, COOLDOWN_MS)) {
    return responder(res, 429, { success: false, error: 'Espera un minuto antes de solicitar otro código.' });
  }
  try {
    const { error } = await clienteAuth().auth.resetPasswordForEmail(email);
    if (error?.status === 429) return responder(res, 429, { success: false, error: 'Límite temporal de correos. Intenta más tarde.' });
    if (error) console.error('Error de envío OTP:', error.status || error.code || 'error');
    // Nunca revelar si este correo está registrado.
    return responder(res, 200, {
      success: true,
      message: 'Si el correo existe y el servicio lo permite, recibirás un código de recuperación.'
    });
  } catch (error) {
    console.error('Servicio OTP:', error.name || 'Error');
    return responder(res, 503, { success: false, error: 'No se pudo contactar al servicio de recuperación.' });
  }
}
async function verificarCodigo(req, res) {
  const data = await leerJSON(req);
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const token = typeof data.token === 'string' ? data.token.trim() : '';
  if (!correoValido(email) || !/^\d{6,8}$/.test(token)) {
    return responder(res, 400, { success: false, error: 'Revisa el correo y el código.' });
  }
  eliminarExpirados();
  const clave = `${req.socket.remoteAddress || ''}|${email}`;
  if (limitar(intentosOTP, clave, 5, 15 * 60_000)) {
    return responder(res, 429, { success: false, error: 'Demasiados intentos. Prueba más tarde.' });
  }
  const { data: verificado, error } = await clienteAuth().auth.verifyOtp({
    email, token, type: 'recovery'
  });
  if (error || !verificado?.session?.access_token || !verificado?.session?.refresh_token) {
    return responder(res, error?.status === 429 ? 429 : 400, {
      success: false, error: 'Código incorrecto, vencido o temporalmente bloqueado.'
    });
  }
  const ticket = randomBytes(32).toString('hex');
  tickets.set(ticket, {
    accessToken: verificado.session.access_token,
    refreshToken: verificado.session.refresh_token,
    expires: Date.now() + TICKET_MS
  });
  res.setHeader('Set-Cookie', cookieRecuperacion(ticket, TICKET_MS / 1000));
  return responder(res, 200, {
    success: true,
    message: 'Código verificado. Ahora puedes establecer una nueva contraseña.'
  });
}
async function cambiarContrasena(req, res) {
  const data = await leerJSON(req);
  const password = data.password;
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 1024) {
    return responder(res, 400, { success: false, error: 'La contraseña debe tener al menos 12 caracteres.' });
  }
  if (password !== data.confirmar) {
    return responder(res, 400, { success: false, error: 'Las contraseñas no coinciden.' });
  }
  eliminarExpirados();
  const ticketId = leerCookie(req, 'petgo_recovery');
  const ticket = tickets.get(ticketId);
  if (!ticket || ticket.expires <= Date.now()) {
    res.setHeader('Set-Cookie', cookieRecuperacion('', 0));
    return responder(res, 401, { success: false, error: 'La verificación venció. Solicita un código nuevo.' });
  }
  // Ticket de un solo uso: invalidarlo incluso si falla la actualización.
  tickets.delete(ticketId);
  res.setHeader('Set-Cookie', cookieRecuperacion('', 0));
  const auth = clienteAuth();
  const { error: sessionError } = await auth.auth.setSession({
    access_token: ticket.accessToken,
    refresh_token: ticket.refreshToken
  });
  if (sessionError) {
    return responder(res, 401, { success: false, error: 'La verificación venció. Solicita un código nuevo.' });
  }
  const { error: updateError } = await auth.auth.updateUser({ password });
  if (updateError) {
    console.error('Restablecimiento:', updateError.status || updateError.code || 'error');
    return responder(res, 400, { success: false, error: 'No se pudo actualizar la contraseña. Solicita un código nuevo.' });
  }
  await auth.auth.signOut({ scope: 'local' }).catch(() => {});
  return responder(res, 200, {
    success: true,
    message: 'Contraseña actualizada. Ya puedes iniciar sesión.'
  });
}
async function manejarPassword(req, res, pathname) {
  try {
    if (req.method !== 'POST') return responder(res, 405, { success: false, error: 'Método no permitido.' });
    if (!origenPermitido(req)) return responder(res, 403, { success: false, error: 'Origen no permitido.' });
    if (pathname === '/api/auth/password/recovery') return await solicitarCodigo(req, res);
    if (pathname === '/api/auth/password/verify') return await verificarCodigo(req, res);
    if (pathname === '/api/auth/password/reset') return await cambiarContrasena(req, res);
    return responder(res, 404, { success: false, error: 'Ruta no encontrada.' });
  } catch (error) {
    if ([400, 413, 415].includes(error.status)) {
      return responder(res, error.status, { success: false, error: error.message });
    }
    console.error('Recuperación OTP:', error.name || 'Error');
    return responder(res, 503, { success: false, error: 'Recuperación temporalmente no disponible.' });
  }
}
module.exports = { manejarPassword };
