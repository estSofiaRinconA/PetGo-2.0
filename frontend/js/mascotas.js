// PETGO 2.0 — Mascotas reales, a traves de la API propia
const $ = id => document.getElementById(id);
const abrir = $('abrir-formulario');
const cerrar = $('cerrar-formulario');
const cancelar = $('cancelar');
const seccion = $('formulario-seccion');
const formulario = $('formulario-mascota');
const mensaje = $('mensaje-mascota');
const lista = $('lista-mascotas');
const vacio = $('estado-mascotas');
const aviso = $('aviso-lista');
const guardar = formulario.querySelector('button[type="submit"]');

function mensajeFormulario(texto, error=false) {
  mensaje.textContent=texto;
  mensaje.className = error ? 'mensaje mensaje-error' : 'mensaje mensaje-exito';
}
function mostrarFormulario() {seccion.classList.remove('oculto');$('nombre').focus();}
function ocultarFormulario() {seccion.classList.add('oculto');formulario.reset();mensajeFormulario('');}
abrir.addEventListener('click',mostrarFormulario);
cerrar.addEventListener('click',ocultarFormulario);
cancelar.addEventListener('click',ocultarFormulario);

async function llamarAPI(method='GET', data) {
  const config={method,credentials:'same-origin',cache:'no-store'};
  if(data){config.headers={'Content-Type':'application/json'};config.body=JSON.stringify(data);}
  const response=await fetch('/api/pets',config);
  if(response.status===401){window.location.replace('/login.html');throw new Error('Tu sesion termino.');}
  const result=await response.json();
  if(!response.ok || !result.success) throw new Error(result.error||'No se pudo completar la solicitud.');
  return result;
}
function pintarMascotas(mascotas) {
  lista.replaceChildren();
  const hay=mascotas.length>0;
  vacio.classList.toggle('oculto',hay);
  lista.classList.toggle('oculto',!hay);
  for (const mascota of mascotas) {
    const card=document.createElement('article');card.className='mascota-tarjeta';
    const emoji=document.createElement('div');emoji.className='mascota-icono';emoji.textContent=mascota.especie==='gato'?'🐱':'🐶';
    const titulo=document.createElement('h3');titulo.textContent=mascota.nombre;
    const tipo=document.createElement('span');tipo.className='mascota-etiqueta';tipo.textContent=mascota.especie==='gato'?'Gato':'Perro';
    card.append(emoji,titulo,tipo);
    if(mascota.raza){const p=document.createElement('p');p.textContent=`Raza: ${mascota.raza}`;card.append(p);}
    if(mascota.observaciones){const p=document.createElement('p');p.textContent=mascota.observaciones;card.append(p);}
    lista.append(card);
  }
}
async function cargarMascotas(){
  aviso.textContent='Cargando tus mascotas...';
  try {const result=await llamarAPI();pintarMascotas(result.pets);aviso.textContent='';}
  catch(err){aviso.textContent=err instanceof TypeError?'No se pudo conectar con la API de PetGo.':err.message;}
}
formulario.addEventListener('submit',async e=>{
  e.preventDefault();if(!formulario.reportValidity())return;
  const body={
    nombre:$('nombre').value.trim(),
    especie:$('especie').value,
    raza:$('raza').value.trim(),
    observaciones:$('observaciones').value.trim()
  };
  guardar.disabled=true;guardar.textContent='Guardando...';mensajeFormulario('');
  try {await llamarAPI('POST',body);ocultarFormulario();await cargarMascotas();aviso.textContent='Mascota guardada correctamente.';}
  catch(err){mensajeFormulario(err instanceof TypeError?'No se pudo conectar con la API de PetGo.':err.message,true);}
  finally{guardar.disabled=false;guardar.textContent='Guardar mascota';}
});
cargarMascotas();
