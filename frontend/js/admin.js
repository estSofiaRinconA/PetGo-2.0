// PetGo 2.0: administración (presentación). Los permisos se validan en Node.js.
const message=document.getElementById('message');
const content=document.getElementById('admin-content');
const list=document.getElementById('bookings');
const filter=document.getElementById('filter');
const refresh=document.getElementById('refresh');
let bookings=[];
function status(text,isError=false){message.textContent=text;message.classList.toggle('error',isError);}
async function request(path,options={}){
  const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options});
  if(response.status===401){window.location.replace('/login.html');throw new Error('Inicia sesión.');}
  const json=await response.json().catch(()=>({}));
  if(!response.ok||!json.success){const e=new Error(json.error||'Error de la API.');e.status=response.status;throw e;}
  return json;
}
function node(tag,className,value){const x=document.createElement(tag);if(className)x.className=className;if(value!==undefined)x.textContent=value;return x;}
function dateText(value){const d=new Date(value);return Number.isNaN(d.getTime())?'Fecha no disponible':new Intl.DateTimeFormat('es-CO',{dateStyle:'medium',timeStyle:'short',timeZone:'America/Bogota'}).format(d);}
function render(){
  list.replaceChildren();
  const shown=bookings.filter(b=>filter.value==='todos'||b.status===filter.value);
  if(!shown.length){list.append(node('p','empty','No hay solicitudes para este filtro.'));return;}
  for(const b of shown){
    const card=node('article','card');
    const heading=node('div','card-heading');
    heading.append(node('h2','',`${b.service} · ${b.variant}`));
    heading.append(node('span',`pill pill-${b.status}`,b.status));
    const detail=node('p','detail',`Cliente: ${b.customer} · Mascota: ${b.pet}`);
    const date=node('p','date',`Fecha solicitada: ${dateText(b.scheduled_at)}`);
    card.append(heading,detail,date);
    const next=b.status==='pendiente'?'confirmada':b.status==='confirmada'?'completada':null;
    if(next){
      const btn=node('button','action',next==='confirmada'?'Confirmar reserva':'Marcar completada');
      btn.type='button';
      btn.addEventListener('click',async()=>{
        if(!window.confirm(`¿Confirmas cambiar el estado a ${next}?`))return;
        btn.disabled=true;btn.textContent='Guardando...';
        try{
          await request('/api/admin/bookings/status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:b.id,status:next})});
          await load();
          status('Estado actualizado. Se notificó al cliente.');
        }catch(e){status(e.message,true);btn.disabled=false;btn.textContent=next==='confirmada'?'Confirmar reserva':'Marcar completada';}
      });
      card.append(btn);
    }
    list.append(card);
  }
}
async function load(){
  refresh.disabled=true;
  status('Cargando solicitudes...');
  try{const data=await request('/api/admin/bookings');bookings=data.bookings||[];render();status(`Solicitudes cargadas: ${bookings.length}.`);}
  catch(error){status(error.message,true);}
  finally{refresh.disabled=false;}
}
async function init(){
  refresh.disabled=true;
  try{await request('/api/admin/me');content.hidden=false;await load();}
  catch(error){status(error.status===403?'Esta cuenta no tiene permisos de administración.':error.message,true);}
  finally{refresh.disabled=false;}
}
filter.addEventListener('change',render);
refresh.addEventListener('click',load);
init();
