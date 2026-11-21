
// PetGo 2.0 — Interacciones de Mis mascotas

const abrir = document.getElementById('abrir-formulario');
const cerrar = document.getElementById('cerrar-formulario');
const cancelar = document.getElementById('cancelar');

const seccion = document.getElementById('formulario-seccion');
const formulario = document.getElementById('formulario-mascota');
const mensaje = document.getElementById('mensaje-mascota');

function mostrarFormulario() {
  seccion.classList.remove('oculto');
  document.getElementById('nombre').focus();
}

function ocultarFormulario() {
  seccion.classList.add('oculto');
  formulario.reset();
  mensaje.textContent = '';
}

abrir.addEventListener('click', mostrarFormulario);
cerrar.addEventListener('click', ocultarFormulario);
cancelar.addEventListener('click', ocultarFormulario);

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();

  if (!formulario.reportValidity()) {
    return;
  }

  mensaje.textContent =
    'Formulario validado. El guardado estará disponible cuando conectemos la API de mascotas.';
});
