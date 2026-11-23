// PetGo 2.0 - Gestion de mascotas mediante API Node.js; sin acceso directo a Supabase.
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
let editandoId = null;
let mascotasActuales = [];
let ocupado = false;

function mostrarMensaje(texto, error = false) {
  mensaje.textContent = texto;
  mensaje.className = error ? 'mensaje mensaje-error' : 'mensaje mensaje-exito';
}
function abrirNuevo() {
  formulario.reset();
  editandoId = null;
  $('titulo-formulario').textContent = 'Agregar mascota';
  guardar.textContent = 'Guardar mascota';
  mostrarMensaje('');
  seccion.classList.remove('oculto');
  $('nombre').focus();
}
function ocultarFormulario() {
  if (ocupado) return;
  seccion.classList.add('oculto');
  formulario.reset();
  editandoId = null;
  mostrarMensaje('');
}
abrir.addEventListener('click', abrirNuevo);
cerrar.addEventListener('click', ocultarFormulario);
cancelar.addEventListener('click', ocultarFormulario);

async function api(method = 'GET', body, ruta = '/api/pets') {
  const options = { method, credentials: 'same-origin', cache: 'no-store' };
  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  const response = await fetch(ruta, options);
  if (response.status === 401) {
    window.location.replace('/login.html');
    throw new Error('Tu sesion termino.');
  }
  let result;
  try { result = await response.json(); }
  catch { throw new Error('La API devolvio una respuesta inesperada.'); }
  if (!response.ok || !result.success) throw new Error(result.error || 'No se pudo completar la solicitud.');
  return result;
}
function editar(mascota) {
  if (ocupado) return;
  editandoId = mascota.id;
  $('nombre').value = mascota.nombre || '';
  $('especie').value = mascota.especie || '';
  $('raza').value = mascota.raza || '';
  $('fecha_nacimiento').value = mascota.fecha_nacimiento || '';
  $('observaciones').value = mascota.observaciones || '';
  $('titulo-formulario').textContent = 'Editar mascota';
  guardar.textContent = 'Guardar cambios';
  mostrarMensaje('');
  seccion.classList.remove('oculto');
  seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
async function eliminar(mascota) {
  if (ocupado) return;
  const confirmado = window.confirm(`¿Eliminar a ${mascota.nombre}? Esta accion no se puede deshacer. Las mascotas con reservas no se pueden eliminar.`);
  if (!confirmado) return;
  ocupado = true;
  aviso.textContent = 'Eliminando mascota...';
  try {
    await api('DELETE', { id: mascota.id }, '/api/pets/item');
    await cargarMascotas();
    aviso.textContent = 'Mascota eliminada correctamente.';
  } catch (error) {
    aviso.textContent = error instanceof TypeError ? 'No se pudo conectar con la API de PetGo.' : error.message;
  } finally { ocupado = false; }
}
function pintarMascotas(mascotas) {
  mascotasActuales = mascotas;
  lista.replaceChildren();
  vacio.classList.toggle('oculto', mascotas.length > 0);
  lista.classList.toggle('oculto', mascotas.length === 0);
  for (const mascota of mascotas) {
    const card = document.createElement('article');
    card.className = 'mascota-tarjeta';
    const emoji = document.createElement('div');
    emoji.className = 'mascota-icono';
    emoji.textContent = mascota.especie === 'gato' ? '🐱' : '🐶';
    const nombre = document.createElement('h3');
    nombre.textContent = mascota.nombre;
    const especie = document.createElement('span');
    especie.className = 'mascota-etiqueta';
    especie.textContent = mascota.especie === 'gato' ? 'Gato' : 'Perro';
    card.append(emoji, nombre, especie);
    for (const [etiqueta, valor] of [
      ['Raza', mascota.raza], ['Nacimiento', mascota.fecha_nacimiento], ['Observaciones', mascota.observaciones]
    ]) {
      if (!valor) continue;
      const p = document.createElement('p');
      p.textContent = `${etiqueta}: ${valor}`;
      card.append(p);
    }
    const acciones = document.createElement('div');
    acciones.className = 'mascota-acciones';
    const botonEditar = document.createElement('button');
    botonEditar.type = 'button'; botonEditar.className = 'mascota-editar';
    botonEditar.textContent = 'Editar';
    botonEditar.addEventListener('click', () => editar(mascota));
    const botonEliminar = document.createElement('button');
    botonEliminar.type = 'button'; botonEliminar.className = 'mascota-eliminar';
    botonEliminar.textContent = 'Eliminar';
    botonEliminar.addEventListener('click', () => eliminar(mascota));
    acciones.append(botonEditar, botonEliminar);
    card.append(acciones);
    lista.append(card);
  }
}
async function cargarMascotas() {
  aviso.textContent = 'Cargando tus mascotas...';
  try {
    const result = await api();
    pintarMascotas(result.pets || []);
    aviso.textContent = '';
  } catch (error) {
    aviso.textContent = error instanceof TypeError ? 'No se pudo conectar con la API de PetGo.' : error.message;
  }
}
formulario.addEventListener('submit', async event => {
  event.preventDefault();
  if (ocupado || !formulario.reportValidity()) return;
  const pet = {
    nombre: $('nombre').value.trim(),
    especie: $('especie').value,
    raza: $('raza').value.trim(),
    observaciones: $('observaciones').value.trim(),
    fecha_nacimiento: $('fecha_nacimiento').value
  };
  ocupado = true;
  const esEdicion = Boolean(editandoId);
  guardar.disabled = true;
  guardar.textContent = 'Guardando...';
  mostrarMensaje('');
  try {
    await api(esEdicion ? 'PATCH' : 'POST', esEdicion ? { id: editandoId, ...pet } : pet, esEdicion ? '/api/pets/item' : '/api/pets');
    ocupado = false;
    ocultarFormulario();
    await cargarMascotas();
    aviso.textContent = esEdicion ? 'Cambios guardados correctamente.' : 'Mascota registrada correctamente.';
  } catch (error) {
    mostrarMensaje(error instanceof TypeError ? 'No se pudo conectar con la API de PetGo.' : error.message, true);
  } finally {
    ocupado = false;
    guardar.disabled = false;
    if (!seccion.classList.contains('oculto')) guardar.textContent = esEdicion ? 'Guardar cambios' : 'Guardar mascota';
  }
});
cargarMascotas();
