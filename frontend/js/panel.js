// PetGo 2.0 — Panel: menús, notificaciones reales y cierre de sesión.
const botonNotificaciones = document.getElementById('boton-notificaciones');
const menuNotificaciones = document.getElementById('menu-notificaciones');
const contador = document.getElementById('contador-notificaciones');
const botonPerfil = document.getElementById('boton-perfil');
const menuPerfil = document.getElementById('menu-perfil');
const botonCerrarSesion = document.getElementById('cerrar-sesion');
const mensajeNotificaciones = document.getElementById('mensaje-notificaciones');
let cargandoNotificaciones = false;

function cerrarMenus() {
  menuNotificaciones.classList.add('oculto');
  menuPerfil.classList.add('oculto');
  botonNotificaciones.setAttribute('aria-expanded','false');
  botonPerfil.setAttribute('aria-expanded','false');
}
function alternarMenu(boton,menu) {
  const abierto=!menu.classList.contains('oculto');
  cerrarMenus();
  if(!abierto){menu.classList.remove('oculto');boton.setAttribute('aria-expanded','true');}
  return !abierto;
}
async function api(path,options={}) {
  const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options});
  if(response.status===401){window.location.replace('/login.html');throw new Error('Debes iniciar sesión.');}
  const result=await response.json().catch(()=>({}));
  if(!response.ok || !result.success)throw new Error(result.error||'Error al consultar la API.');
  return result;
}
function element(tag,className,text) {
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
}
function fechaLegible(value) {
  const dt=new Date(value);
  return Number.isNaN(dt.getTime())?'':dt.toLocaleDateString('es-CO',{year:'numeric',month:'short',day:'numeric'});
}
function pintarNotificaciones(items) {
  menuNotificaciones.querySelectorAll('.notificacion-item,.notificacion-acciones').forEach(el=>el.remove());
  const noLeidas=items.filter(item=>!item.leida_at).length;
  contador.textContent=noLeidas>99?'99+':String(noLeidas);
  contador.classList.toggle('oculto',noLeidas===0);
  if(!items.length) {
    mensajeNotificaciones.textContent='Todavía no tienes notificaciones.';
    mensajeNotificaciones.classList.remove('oculto');
    return;
  }
  mensajeNotificaciones.classList.add('oculto');
  for(const item of items) {
    const div=element('div','notificacion-item'+(item.leida_at?'':' sin-leer'));
    div.append(element('strong','notificacion-titulo',item.titulo||'Aviso de PetGo'));
    div.append(element('p','notificacion-mensaje',item.mensaje||''));
    div.append(element('time','notificacion-fecha',fechaLegible(item.created_at)));
    if(!item.leida_at) {
      const btn=element('button','notificacion-leer','Marcar como leída');
      btn.type='button';
      btn.addEventListener('click',async()=>{
        btn.disabled=true;btn.textContent='Guardando...';
        try {
          await api('/api/notifications/read',{
            method:'PATCH',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({id:item.id})
          });
          await cargarNotificaciones();
        }catch(error){btn.disabled=false;btn.textContent='Marcar como leída';window.alert(error.message);}
      });
      div.append(btn);
    }
    menuNotificaciones.append(div);
  }
  const actions=element('div','notificacion-acciones');
  const link=element('a','','Ver mis reservas');
  link.href='/reservas.html';
  actions.append(link);
  menuNotificaciones.append(actions);
}
async function cargarNotificaciones() {
  if(cargandoNotificaciones)return;
  cargandoNotificaciones=true;
  mensajeNotificaciones.textContent='Cargando notificaciones...';
  mensajeNotificaciones.classList.remove('oculto');
  try {
    const data=await api('/api/notifications');
    pintarNotificaciones(data.notifications||[]);
  }catch(error){
    mensajeNotificaciones.textContent=error.message||'No pudimos cargar las notificaciones.';
    mensajeNotificaciones.classList.remove('oculto');
  }finally{cargandoNotificaciones=false;}
}
botonNotificaciones.addEventListener('click',()=>{
  const abierto=alternarMenu(botonNotificaciones,menuNotificaciones);
  if(abierto)cargarNotificaciones();
});
botonPerfil.addEventListener('click',()=>alternarMenu(botonPerfil,menuPerfil));
document.addEventListener('click',(e)=>{if(!e.target.closest('.menu-contenedor'))cerrarMenus();});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape')cerrarMenus();});
botonCerrarSesion.addEventListener('click',async()=>{
  cerrarMenus();botonCerrarSesion.disabled=true;
  try {
    const response=await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',headers:{Accept:'application/json'}});
    if(response.ok){window.location.replace('/login.html');return;}
    const data=await response.json().catch(()=>({}));
    if(response.status===503){window.alert(data.error||'La sesión local se cerró, pero la revocación remota no pudo confirmarse.');window.location.replace('/login.html');return;}
    throw new Error(data.error||'No se pudo cerrar la sesión.');
  }catch(error){window.alert(error.message||'No se pudo conectar con la API.');botonCerrarSesion.disabled=false;}
});
// Una consulta al abrir el panel; no hay sondeo continuo ni solicitudes repetidas.
cargarNotificaciones();
