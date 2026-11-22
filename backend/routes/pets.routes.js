// PETGO 2.0 — API DE MASCOTAS. Siempre a traves de Node.js.
const { supabaseAuth, supabaseAdmin } = require('../database/supabase');
const MAX_BODY = 16 * 1024;

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
  res.end(JSON.stringify(obj));
}
function cookies(req) {
  const parsed = Object.create(null);
  for (const item of (req.headers.cookie || '').split(';')) {
    const idx = item.indexOf('=');
    if (idx < 0) continue;
    try { parsed[item.slice(0,idx).trim()] = decodeURIComponent(item.slice(idx+1).trim()); }
    catch { /* Malformed cookie */ }
  }
  return parsed;
}
function cookie(name, value, maxAge) {
  const args = [`${name}=${encodeURIComponent(value)}`, 'HttpOnly', 'SameSite=Lax', 'Path=/api', `Max-Age=${maxAge}`];
  if (process.env.NODE_ENV === 'production') args.push('Secure');
  return args.join('; ');
}
async function getUser(req,res) {
  const c = cookies(req);
  if (c.petgo_access) {
    const {data,error} = await supabaseAuth.auth.getUser(c.petgo_access);
    if (!error && data?.user) return data.user;
  }
  if (c.petgo_refresh) {
    const {data,error} = await supabaseAuth.auth.refreshSession({refresh_token:c.petgo_refresh});
    if (!error && data?.user && data?.session) {
      res.setHeader('Set-Cookie', [
        cookie('petgo_access',data.session.access_token,Number(data.session.expires_in)||3600),
        cookie('petgo_refresh',data.session.refresh_token,30*24*3600)
      ]);
      return data.user;
    }
  }
  res.setHeader('Set-Cookie',[cookie('petgo_access','',0),cookie('petgo_refresh','',0)]);
  return null;
}
function validOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    if (['http:','https:'].includes(parsed.protocol) && parsed.host === req.headers.host) return true;
    if (process.env.FRONTEND_ORIGIN && origin === process.env.FRONTEND_ORIGIN) return true;
    if (process.env.NODE_ENV !== 'production') return [
      'http://localhost:5173', 'http://localhost:5174',
      'http://127.0.0.1:5173', 'http://127.0.0.1:5174'
    ].includes(origin);
  } catch { return false; }
  return false;
}
async function readJSON(req) {
  if (!/^application\/json(?:\s*;|\s*$)/i.test(req.headers['content-type'] || '')) {
    throw Object.assign(new Error('Se requiere JSON.'),{status:415});
  }
  const chunks=[];let size=0;
  for await(const chunk of req) {
    size+=chunk.length;
    if(size>MAX_BODY) throw Object.assign(new Error('Solicitud demasiado grande.'),{status:413});
    chunks.push(chunk);
  }
  let body;
  try { body=JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch {throw Object.assign(new Error('JSON invalido.'),{status:400});}
  if (!body || typeof body!=='object' || Array.isArray(body)) throw Object.assign(new Error('Se requiere un objeto JSON.'),{status:400});
  return body;
}
function validate(body) {
  const allowed=['nombre','especie','raza','observaciones'];
  if(Object.keys(body).some(k=>!allowed.includes(k))) return null;
  if(!allowed.every(k=>k in body)) return null;
  if(allowed.some(k=>typeof body[k]!=='string')) return null;
  const nombre=body.nombre.trim();const especie=body.especie.trim().toLowerCase();
  const raza=body.raza.trim();const observaciones=body.observaciones.trim();
  if(!nombre || nombre.length>100 || !['perro','gato'].includes(especie) || raza.length>100 || observaciones.length>1000) return null;
  return {nombre,especie,raza:raza||null,observaciones:observaciones||null};
}
async function handlePets(req,res) {
  try {
    if(req.method==='POST' && !validOrigin(req)) return send(res,403,{success:false,error:'Origen no permitido.'});
    const user=await getUser(req,res);
    if(!user) return send(res,401,{success:false,error:'Debes iniciar sesion.'});
    if(req.method==='GET') {
      const {data,error}=await supabaseAdmin.from('pets').select('id,nombre,especie,raza,observaciones,created_at').eq('user_id',user.id).order('created_at',{ascending:false});
      if(error) {console.error('Pets GET:',error.code);return send(res,503,{success:false,error:'No se pudieron consultar tus mascotas.'});}
      return send(res,200,{success:true,pets:data});
    }
    const body=await readJSON(req);
    const pet=validate(body);
    if(!pet) return send(res,400,{success:false,error:'Revisa los datos de tu mascota.'});
    const {data,error}=await supabaseAdmin.from('pets').insert({...pet,user_id:user.id}).select('id,nombre,especie,raza,observaciones,created_at').single();
    if(error){console.error('Pets POST:',error.code);return send(res,503,{success:false,error:'No se pudo guardar la mascota.'});}
    return send(res,201,{success:true,pet:data});
  } catch(err) {
    if([400,413,415].includes(err.status)) return send(res,err.status,{success:false,error:err.message});
    console.error('Pets API:',err.name||'Error');
    return send(res,503,{success:false,error:'Servicio de mascotas no disponible.'});
  }
}
module.exports={handlePets};
