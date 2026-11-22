// PetGo 2.0: administracion. SOLO servidor con clave secreta y sesion validada.
const { supabaseAuth, supabaseAdmin } = require('../database/supabase');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRANSITIONS = Object.freeze({ pendiente: 'confirmada', confirmada: 'completada' });

function send(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}
function readCookies(req) {
  const result = Object.create(null);
  for (const part of (req.headers.cookie || '').split(';')) {
    const split = part.indexOf('=');
    if (split < 0) continue;
    try { result[part.slice(0,split).trim()] = decodeURIComponent(part.slice(split+1).trim()); }
    catch { /* Ignore malformed cookies. */ }
  }
  return result;
}
function makeCookie(name,value,age) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'HttpOnly', 'SameSite=Lax', 'Path=/api', `Max-Age=${age}`];
  if (process.env.NODE_ENV === 'production') parts.push('Secure');
  return parts.join('; ');
}
async function currentUser(req,res) {
  const cookies=readCookies(req);
  if (cookies.petgo_access) {
    const {data,error}=await supabaseAuth.auth.getUser(cookies.petgo_access);
    if (!error && data?.user) return data.user;
  }
  if (cookies.petgo_refresh) {
    const {data,error}=await supabaseAuth.auth.refreshSession({refresh_token:cookies.petgo_refresh});
    if (!error && data?.user && data?.session) {
      res.setHeader('Set-Cookie', [
        makeCookie('petgo_access',data.session.access_token,Number(data.session.expires_in)||3600),
        makeCookie('petgo_refresh',data.session.refresh_token,30*86400)
      ]);
      return data.user;
    }
  }
  res.setHeader('Set-Cookie',[makeCookie('petgo_access','',0),makeCookie('petgo_refresh','',0)]);
  return null;
}
function allowedOrigin(req) {
  if (!req.headers.origin) return false;
  try {
    const origin=new URL(req.headers.origin);
    if (['http:','https:'].includes(origin.protocol) && origin.host===req.headers.host) return true;
    if (process.env.FRONTEND_ORIGIN && req.headers.origin===process.env.FRONTEND_ORIGIN) return true;
    if (process.env.NODE_ENV!=='production') return [
      'http://localhost:5173','http://localhost:5174',
      'http://127.0.0.1:5173','http://127.0.0.1:5174'
    ].includes(req.headers.origin);
  } catch { return false; }
  return false;
}
async function bodyJSON(req) {
  if (!/^application\/json(?:\s*;|\s*$)/i.test(req.headers['content-type']||''))
    throw Object.assign(new Error('Se requiere JSON.'),{status:415});
  const parts=[];let size=0;
  for await (const chunk of req) {
    size+=chunk.length;
    if (size>4096) throw Object.assign(new Error('Solicitud demasiado grande.'),{status:413});
    parts.push(chunk);
  }
  let body;
  try { body=JSON.parse(Buffer.concat(parts).toString('utf8')); }
  catch { throw Object.assign(new Error('JSON invalido.'),{status:400}); }
  if (!body || typeof body!=='object' || Array.isArray(body))
    throw Object.assign(new Error('Se requiere un objeto JSON.'),{status:400});
  return body;
}
function validChange(body) {
  if (Object.keys(body).length!==2 || typeof body.id!=='string' || !UUID.test(body.id)) return null;
  if (typeof body.status!=='string' || !['confirmada','completada'].includes(body.status)) return null;
  return {id:body.id,status:body.status};
}
async function checkAdmin(user) {
  const {data,error}=await supabaseAdmin.from('petgo_admin_users')
    .select('user_id').eq('user_id',user.id).maybeSingle();
  if (error) {console.error('Admin permission check:',error.code);return {error:true};}
  return {allowed:Boolean(data)};
}
async function listBookings(res) {
  const {data,error}=await supabaseAdmin.from('bookings')
    .select('id,user_id,pet_id,service_variant_id,scheduled_at,status,created_at')
    .order('created_at',{ascending:false}).limit(100);
  if (error) {console.error('Admin list:',error.code);return send(res,503,{success:false,error:'No se pudieron consultar las solicitudes.'});}
  const bookings=data||[];
  if (!bookings.length) return send(res,200,{success:true,bookings:[]});
  const userIDs=[...new Set(bookings.map(b=>b.user_id))];
  const petIDs=[...new Set(bookings.map(b=>b.pet_id))];
  const variantIDs=[...new Set(bookings.map(b=>b.service_variant_id))];
  const [profiles,pets,variants]=await Promise.all([
    supabaseAdmin.from('profiles').select('id,nombre').in('id',userIDs),
    supabaseAdmin.from('pets').select('id,nombre').in('id',petIDs),
    supabaseAdmin.from('service_variants').select('id,nombre,service_id').in('id',variantIDs)
  ]);
  if (profiles.error||pets.error||variants.error) {
    console.error('Admin lookup:',profiles.error?.code||pets.error?.code||variants.error?.code);
    return send(res,503,{success:false,error:'No se pudo completar la lista.'});
  }
  const serviceIDs=[...new Set((variants.data||[]).map(v=>v.service_id))];
  let services=[];
  if (serviceIDs.length) {
    const r=await supabaseAdmin.from('services').select('id,nombre').in('id',serviceIDs);
    if (r.error) {console.error('Admin services:',r.error.code);return send(res,503,{success:false,error:'No se pudo completar la lista.'});}
    services=r.data||[];
  }
  const pm=new Map((profiles.data||[]).map(x=>[x.id,x.nombre]));
  const mm=new Map((pets.data||[]).map(x=>[x.id,x.nombre]));
  const vm=new Map((variants.data||[]).map(x=>[x.id,x]));
  const sm=new Map(services.map(x=>[x.id,x.nombre]));
  return send(res,200,{success:true,bookings:bookings.map(b=>({
    id:b.id,scheduled_at:b.scheduled_at,status:b.status,created_at:b.created_at,
    customer:pm.get(b.user_id)||'Cliente',pet:mm.get(b.pet_id)||'Mascota',
    variant:vm.get(b.service_variant_id)?.nombre||'Modalidad',
    service:sm.get(vm.get(b.service_variant_id)?.service_id)||'Servicio'
  }))});
}
async function updateBooking(req,res,user) {
  const body=await bodyJSON(req);
  const change=validChange(body);
  if (!change) return send(res,400,{success:false,error:'Solicitud de cambio invalida.'});
  // RPC transaccional: comprueba admin, estado previo, registra auditoria y notifica.
  const {data,error}=await supabaseAdmin.rpc('petgo_admin_change_booking_status',{
    p_actor:user.id,p_booking:change.id,p_status:change.status
  });
  if (error) {
    if (error.code==='42501') return send(res,403,{success:false,error:'Acceso no autorizado.'});
    if (error.code==='P0002') return send(res,404,{success:false,error:'Solicitud no encontrada.'});
    if (error.code==='23514') return send(res,409,{success:false,error:'El estado actual no permite este cambio.'});
    if (error.code==='23505') return send(res,409,{success:false,error:'Este horario ya esta confirmado para la misma modalidad. Selecciona otro horario antes de confirmar.'});
    console.error('Admin status update:',error.code);
    return send(res,503,{success:false,error:'No se pudo actualizar la solicitud.'});
  }
  return send(res,200,{success:true,booking:data,message:'Estado actualizado y notificacion registrada.'});
}
async function handleAdmin(req,res,pathname) {
  try {
    if (req.method==='PATCH' && !allowedOrigin(req)) return send(res,403,{success:false,error:'Origen no permitido.'});
    const user=await currentUser(req,res);
    if (!user) return send(res,401,{success:false,error:'Debes iniciar sesion.'});
    const permission=await checkAdmin(user);
    if (permission.error) return send(res,503,{success:false,error:'No se pudieron comprobar los permisos.'});
    if (!permission.allowed) return send(res,403,{success:false,error:'Acceso reservado al personal autorizado.'});
    if (pathname==='/api/admin/me' && req.method==='GET')
      return send(res,200,{success:true,role:'admin'});
    if (pathname==='/api/admin/bookings' && req.method==='GET') return await listBookings(res);
    if (pathname==='/api/admin/bookings/status' && req.method==='PATCH') return await updateBooking(req,res,user);
    return send(res,405,{success:false,error:'Metodo no permitido.'});
  } catch (error) {
    if ([400,413,415].includes(error.status)) return send(res,error.status,{success:false,error:error.message});
    console.error('Admin API:',error.name||'Error');
    return send(res,503,{success:false,error:'Administracion no disponible.'});
  }
}
module.exports={handleAdmin,validChange,allowedOrigin};
