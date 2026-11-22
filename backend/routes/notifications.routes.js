// PetGo 2.0 — Notificaciones privadas. El navegador nunca accede a Supabase.
const { supabaseAuth, supabaseAdmin } = require('../database/supabase');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function send(res, status, data) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}
function cookies(req) {
  const found = Object.create(null);
  for (const piece of (req.headers.cookie || '').split(';')) {
    const pos = piece.indexOf('=');
    if (pos < 0) continue;
    try { found[piece.slice(0,pos).trim()] = decodeURIComponent(piece.slice(pos+1).trim()); } catch {}
  }
  return found;
}
function cookie(name,value,age) {
  const bits=[`${name}=${encodeURIComponent(value)}`,'HttpOnly','SameSite=Lax','Path=/api',`Max-Age=${age}`];
  if(process.env.NODE_ENV==='production')bits.push('Secure');
  return bits.join('; ');
}
async function userOf(req,res) {
  const c=cookies(req);
  if(c.petgo_access) {
    const {data,error}=await supabaseAuth.auth.getUser(c.petgo_access);
    if(!error && data?.user)return data.user;
  }
  if(c.petgo_refresh) {
    const {data,error}=await supabaseAuth.auth.refreshSession({refresh_token:c.petgo_refresh});
    if(!error && data?.user && data?.session) {
      res.setHeader('Set-Cookie',[
        cookie('petgo_access',data.session.access_token,Number(data.session.expires_in)||3600),
        cookie('petgo_refresh',data.session.refresh_token,30*24*3600)
      ]);
      return data.user;
    }
  }
  res.setHeader('Set-Cookie',[cookie('petgo_access','',0),cookie('petgo_refresh','',0)]);
  return null;
}
function originValid(req) {
  const origin=req.headers.origin;
  if(!origin)return false;
  try {
    const url=new URL(origin);
    if(['http:','https:'].includes(url.protocol) && url.host===req.headers.host)return true;
    if(process.env.FRONTEND_ORIGIN && origin===process.env.FRONTEND_ORIGIN)return true;
    if(process.env.NODE_ENV!=='production')return ['http://localhost:5173','http://localhost:5174','http://127.0.0.1:5173','http://127.0.0.1:5174'].includes(origin);
  } catch {}
  return false;
}
async function readBody(req) {
  if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers['content-type']||''))throw Object.assign(new Error('Se requiere JSON.'),{status:415});
  const parts=[];let total=0;
  for await(const part of req) {
    total+=part.length;
    if(total>4096)throw Object.assign(new Error('Solicitud demasiado grande.'),{status:413});
    parts.push(part);
  }
  let value;
  try{value=JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{throw Object.assign(new Error('JSON invalido.'),{status:400});}
  if(!value || typeof value!=='object' || Array.isArray(value))throw Object.assign(new Error('Se requiere un objeto.'),{status:400});
  return value;
}
async function handleNotifications(req,res,pathname) {
  try {
    if(req.method==='PATCH' && !originValid(req))return send(res,403,{success:false,error:'Origen no permitido.'});
    const user=await userOf(req,res);
    if(!user)return send(res,401,{success:false,error:'Debes iniciar sesion.'});
    if(pathname==='/api/notifications' && req.method==='GET') {
      const {data,error}=await supabaseAdmin.from('notifications')
        .select('id,tipo,titulo,mensaje,leida_at,created_at,booking_id')
        .eq('user_id',user.id).order('created_at',{ascending:false}).limit(50);
      if(error){console.error('Notifications list:',error.code);return send(res,503,{success:false,error:'No pudimos cargar tus notificaciones.'});}
      const list=data||[];
      return send(res,200,{success:true,notifications:list,unread_count:list.filter(n=>!n.leida_at).length});
    }
    if(pathname==='/api/notifications/read' && req.method==='PATCH') {
      const body=await readBody(req);
      if(Object.keys(body).length!==1 || typeof body.id!=='string' || !UUID.test(body.id))return send(res,400,{success:false,error:'Notificacion no valida.'});
      const {data,error}=await supabaseAdmin.from('notifications')
        .update({leida_at:new Date().toISOString()})
        .eq('id',body.id).eq('user_id',user.id).is('leida_at',null)
        .select('id,leida_at').maybeSingle();
      if(error){console.error('Notifications read:',error.code);return send(res,503,{success:false,error:'No pudimos actualizar la notificacion.'});}
      // No distinguir registros ajenos de inexistentes.
      if(!data)return send(res,404,{success:false,error:'Notificacion no encontrada o ya leida.'});
      return send(res,200,{success:true,notification:data});
    }
    return send(res,405,{success:false,error:'Metodo no permitido.'});
  }catch(error) {
    if([400,413,415].includes(error.status))return send(res,error.status,{success:false,error:error.message});
    console.error('Notifications API:',error.name||'Error');
    return send(res,503,{success:false,error:'Notificaciones no disponibles.'});
  }
}
module.exports={handleNotifications};
