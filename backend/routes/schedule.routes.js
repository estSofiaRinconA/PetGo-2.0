// PetGo 2.0 - Solo llamado por admin.routes.js DESPUES de validar sesion y rol.
const {supabaseAdmin} = require('../database/supabase');
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
function validSchedule(b,ids){
  if(!b || typeof b!=='object'||Array.isArray(b) || Object.keys(b).sort().join(',')!=='closing,opening,variants,weekdays') return false;
  const time=/^([01]\d|2[0-3]):[0-5]\d$/;
  if(!Array.isArray(b.weekdays)||b.weekdays.length<1||b.weekdays.length>7||new Set(b.weekdays).size!==b.weekdays.length||!b.weekdays.every(x=>Number.isInteger(x)&&x>=1&&x<=7))return false;
  if(typeof b.opening!=='string'||typeof b.closing!=='string'||!time.test(b.opening)||!time.test(b.closing)||b.opening>=b.closing)return false;
  if(!Array.isArray(b.variants)||b.variants.length!==ids.length)return false;
  const found=new Set();
  for(const v of b.variants){
    if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join(',')!=='capacity,duration_minutes,id'||typeof v.id!=='string'||!UUID.test(v.id)||!ids.includes(v.id)||found.has(v.id)||!Number.isInteger(v.duration_minutes)||v.duration_minutes<15||v.duration_minutes>480||!Number.isInteger(v.capacity)||v.capacity<1||v.capacity>100)return false;
    found.add(v.id);
  }
  return true;
}
async function readBody(req){
  if(!/^application\/json(?:\s*;|\s*$)/i.test(req.headers['content-type']||''))throw Object.assign(new Error('Se requiere JSON.'),{status:415});
  const chunks=[];let size=0;
  for await(const part of req){size+=part.length;if(size>16384)throw Object.assign(new Error('Datos demasiado grandes.'),{status:413});chunks.push(part);}
  try {return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(new Error('JSON invalido.'),{status:400});}
}
async function variants(){
  const [services,v]=await Promise.all([
    supabaseAdmin.from('services').select('id,nombre,orden'),
    supabaseAdmin.from('service_variants').select('id,service_id,nombre,activo,orden').eq('activo',true)
  ]);
  if(services.error||v.error)throw new Error('No se pudo consultar el catalogo.');
  const sm=new Map(services.data.map(s=>[s.id,s]));
  return v.data.map(x=>({id:x.id,name:x.nombre,service:sm.get(x.service_id)?.nombre||'Servicio',service_order:sm.get(x.service_id)?.orden||0,order:x.orden})).sort((a,b)=>a.service_order-b.service_order||a.order-b.order);
}
async function handleSchedule(req,res,user){
  try{
    const list=await variants();
    if(req.method==='GET'){
      const [s,r]=await Promise.all([
        supabaseAdmin.from('petgo_schedule').select('weekdays,opening_time,closing_time,timezone,updated_at').eq('id',1).single(),
        supabaseAdmin.from('petgo_variant_rules').select('variant_id,duration_minutes,capacity')
      ]);
      if(s.error||r.error)throw new Error('No se pudo consultar la agenda. Comprueba la migracion 015.');
      const rule=new Map((r.data||[]).map(x=>[x.variant_id,x]));
      return send(res,200,{success:true,schedule:{weekdays:s.data.weekdays,opening:String(s.data.opening_time).slice(0,5),closing:String(s.data.closing_time).slice(0,5),timezone:s.data.timezone,updated_at:s.data.updated_at,variants:list.map(x=>({...x,duration_minutes:rule.get(x.id)?.duration_minutes??60,capacity:rule.get(x.id)?.capacity??1}))}});
    }
    if(req.method==='PATCH'){
      const b=await readBody(req);
      if(!validSchedule(b,list.map(x=>x.id)))return send(res,400,{success:false,error:'Revisa los dias, horas, duraciones y capacidades.'});
      const {error}=await supabaseAdmin.rpc('petgo_admin_save_schedule',{p_actor:user.id,p_weekdays:b.weekdays,p_open:b.opening,p_close:b.closing,p_variants:b.variants});
      if(error){
        if(error.code==='42501')return send(res,403,{success:false,error:'Acceso no autorizado.'});
        if(error.code==='22023')return send(res,400,{success:false,error:'Configuracion no valida o catalogo cambiado.'});
        console.error('Schedule update:',error.code);return send(res,503,{success:false,error:'No se pudieron guardar las reglas.'});
      }
      return send(res,200,{success:true,message:'Reglas de agenda guardadas correctamente.'});
    }
    return send(res,405,{success:false,error:'Metodo no permitido.'});
  }catch(e){
    if([400,413,415].includes(e.status))return send(res,e.status,{success:false,error:e.message});
    console.error('Schedule:',e.message);
    return send(res,503,{success:false,error:'Agenda no disponible. Verifica la migracion SQL.'});
  }
}
module.exports={handleSchedule,validSchedule};
