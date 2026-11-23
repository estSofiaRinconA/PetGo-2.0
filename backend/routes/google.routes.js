'use strict';
// Google OAuth (PKCE) — el frontend nunca recibe los tokens de Supabase.
// Cookies transitorias HttpOnly almacenan state y verificador PKCE.
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { supabaseAdmin } = require('../database/supabase');

const COOKIE_STATE = 'petgo_google_state';
const COOKIE_PKCE = 'petgo_google_pkce';
const COOKIE_ACCESS = 'petgo_access';
const COOKIE_REFRESH = 'petgo_refresh';

function cookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const pos = part.indexOf('=');
    if (pos < 0) continue;
    try { out[part.slice(0, pos).trim()] = decodeURIComponent(part.slice(pos + 1).trim()); } catch {}
  }
  return out;
}
function cookie(name, value, seconds, scope = '/api') {
  const parts = [name + '=' + encodeURIComponent(value), 'Path=' + scope,
    'HttpOnly', 'SameSite=Lax', 'Max-Age=' + Math.max(0, Math.floor(seconds))];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}
function limpiar() {
  return [cookie(COOKIE_STATE, '', 0, '/api/auth/google'),
    cookie(COOKIE_PKCE, '', 0, '/api/auth/google')];
}
function redirigir(res, location, setCookies = []) {
  res.writeHead(303, { Location: location, 'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer', ...(setCookies.length ? { 'Set-Cookie': setCookies } : {}) });
  res.end();
}
function origenPublico() {
  const configured = process.env.PETGO_PUBLIC_URL ||
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
  if (!configured) throw new Error('Falta PETGO_PUBLIC_URL');
  const parsed = new URL(configured);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password ||
      (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:')) {
    throw new Error('PETGO_PUBLIC_URL invalida');
  }
  return parsed.origin;
}
function clientePKCE(initial = {}) {
  // Almacenamiento por solicitud: nunca compartido entre usuarios.
  const values = new Map(Object.entries(initial));
  const client = createClient(process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: true,
        storage: {
          getItem: key => values.get(key) ?? null,
          setItem: (key, val) => { values.set(key, val); },
          removeItem: key => { values.delete(key); }
        }
      }
    });
  return { client, values };
}
function fallo(res) { redirigir(res, '/login.html?google_error=1', limpiar()); }

async function iniciar(res) {
  const state = crypto.randomBytes(24).toString('base64url');
  const callback = origenPublico() + '/api/auth/google/callback?state=' + state;
  const { client, values } = clientePKCE();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callback, skipBrowserRedirect: true }
  });
  if (error || !data?.url) throw new Error('No se pudo iniciar OAuth');
  // Permitir únicamente el servidor de Auth del proyecto; no redirigir a URLs arbitrarias.
  const destino = new URL(data.url);
  const supabaseHost = new URL(process.env.SUPABASE_URL).host;
  if (destino.protocol !== 'https:' || destino.host !== supabaseHost ||
      !destino.pathname.startsWith('/auth/v1/authorize')) {
    throw new Error('Destino OAuth invalido');
  }
  const storage = Buffer.from(JSON.stringify(Object.fromEntries(values))).toString('base64url');
  if (storage.length > 3000) throw new Error('Verificador PKCE demasiado grande');
  redirigir(res, data.url, [
    cookie(COOKIE_STATE, state, 600, '/api/auth/google'),
    cookie(COOKIE_PKCE, storage, 600, '/api/auth/google')
  ]);
}

async function callback(req, res) {
  const params = new URL(req.url, origenPublico()).searchParams;
  const actualCookies = cookies(req);
  const expected = actualCookies[COOKIE_STATE];
  const received = params.get('state');
  const code = params.get('code');
  if (!expected || !received || !code || !actualCookies[COOKIE_PKCE] ||
      expected.length !== received.length ||
      !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
    return fallo(res);
  }
  let saved;
  try {
    saved = JSON.parse(Buffer.from(actualCookies[COOKIE_PKCE], 'base64url').toString('utf8'));
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return fallo(res);
  } catch { return fallo(res); }
  const { client } = clientePKCE(saved);
  const flowId = params.get('sb_flow_id') || undefined;
  const { data, error } = await client.auth.exchangeCodeForSession(code, flowId);
  if (error || !data?.session?.access_token || !data?.session?.refresh_token || !data?.user?.id) {
    return fallo(res);
  }
  const { data: admin, error: roleError } = await supabaseAdmin
    .from('petgo_admin_users').select('user_id')
    .eq('user_id', data.user.id).maybeSingle();
  if (roleError) throw new Error('No se pudo verificar el rol');

  const seconds = Math.max(60, Number(data.session.expires_in) || 3600);
  const destino = admin ? '/admin.html' : '/panel.html';
  redirigir(res, destino, [
    cookie(COOKIE_ACCESS, data.session.access_token, seconds),
    cookie(COOKIE_REFRESH, data.session.refresh_token, 30 * 86400),
    ...limpiar()
  ]);
}

async function manejarGoogle(req, res, pathname) {
  if (req.method !== 'GET') {
    res.writeHead(405, { Allow: 'GET', 'Cache-Control': 'no-store' });
    return res.end();
  }
  try {
    if (pathname === '/api/auth/google/start') return await iniciar(res);
    if (pathname === '/api/auth/google/callback') return await callback(req, res);
    res.writeHead(404); res.end();
  } catch (err) {
    console.error('Error OAuth Google:', err?.message || err?.name || 'Error');
    if (!res.headersSent) fallo(res);
  }
}
module.exports = { manejarGoogle };
