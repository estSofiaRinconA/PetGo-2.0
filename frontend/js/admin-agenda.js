// Panel de agenda PetGo. Todos los permisos los verifica el backend.
const $=id=>document.getElementById(id);
const form=$('schedule-form'),message=$('message'),days=$('days'),variants=$('variants'),save=$('save');
const weekdays=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
let rules=[];
function say(text,error=false){message.textContent=text;message.classList.toggle('error',error);}
async function api(method,body){
  const options={method,credentials:'same-origin',cache:'no-store'};
  if(body){options.headers={'Content-Type':'application/json'};options.body=JSON.stringify(body);}
  const response=await fetch('/api/admin/schedule',options);
  if(response.status===401){location.replace('/login.html');throw new Error('Debes iniciar sesión.');}
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.success){const e=new Error(data.error||'No se pudo consultar la agenda.');e.status=response.status;throw e;}
  return data;
}
function el(tag,className,text){const item=document.createElement(tag);if(className)item.className=className;if(text!==undefined)item.textContent=text;return item;}
function render(data){
  const s=data.schedule;rules=s.variants;
  $('opening').value=s.opening;$('closing').value=s.closing;
  days.replaceChildren();
  weekdays.forEach((name,index)=>{
    const label=el('label','day');const input=el('input');input.type='checkbox';input.value=String(index+1);input.checked=s.weekdays.includes(index+1);label.append(input,document.createTextNode(name));days.append(label);
  });
  variants.replaceChildren();
  for(const v of rules){
    const card=el('div','variant');card.dataset.id=v.id;
    const title=el('div','variant-title',`${v.service} · ${v.name}`);
    const grid=el('div','grid');
    const duration=el('label','', 'Duración (minutos)');const a=el('input');a.type='number';a.min='15';a.max='480';a.step='1';a.required=true;a.className='duration';a.value=String(v.duration_minutes);duration.append(a);
    const capacity=el('label','', 'Capacidad simultánea');const b=el('input');b.type='number';b.min='1';b.max='100';b.step='1';b.required=true;b.className='capacity';b.value=String(v.capacity);capacity.append(b);
    grid.append(duration,capacity);card.append(title,grid);variants.append(card);
  }
  form.hidden=false;say('Reglas cargadas. Puedes editarlas.');
}
async function load(){
  form.hidden=true;
  try{render(await api('GET'));}
  catch(e){say(e.status===403?'Tu cuenta no tiene permisos de administración.':e.message,true);}
}
form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const selected=[...days.querySelectorAll('input:checked')].map(x=>Number(x.value));
  const opening=$('opening').value,closing=$('closing').value;
  if(selected.length===0){say('Selecciona al menos un día.',true);return;}
  if(!opening||!closing||opening>=closing){say('El cierre debe ser posterior a la apertura.',true);return;}
  const list=[...variants.querySelectorAll('.variant')].map(x=>({id:x.dataset.id,duration_minutes:Number(x.querySelector('.duration').value),capacity:Number(x.querySelector('.capacity').value)}));
  if(list.some(x=>!Number.isInteger(x.duration_minutes)||x.duration_minutes<15||x.duration_minutes>480||!Number.isInteger(x.capacity)||x.capacity<1||x.capacity>100)){say('Revisa las duraciones y capacidades.',true);return;}
  save.disabled=true;say('Guardando reglas...');
  try{
    await api('PATCH',{weekdays:selected,opening,closing,variants:list});
    await load();say('Reglas guardadas correctamente en Supabase.');
  }catch(e){say(e.message,true);}
  finally{save.disabled=false;}
});
$('reload').addEventListener('click',load);
load();
