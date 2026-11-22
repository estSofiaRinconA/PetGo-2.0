
// ==================================================
// PETGO 2.0 - MI PERFIL
// Demostración de edición sin base de datos
// ==================================================

const $ = (id) => document.getElementById(id);

// Datos temporales solo para la demostración.
// Al recargar la página se restablecerán.

let datosPerfil = {
  nombre: '',
  email: '',
  telefono: '',
  ciudad: ''
};

// Elementos principales

const vistaLectura = $('vista-lectura');
const formulario = $('formulario-perfil');
const botonEditar = $('boton-editar');
const botonCancelar = $('boton-cancelar');
const mensaje = $('mensaje-perfil');

// --------------------------------------------------
// MOSTRAR MENSAJES
// --------------------------------------------------

function mostrarMensaje(texto = '', tipo = '') {
  mensaje.textContent = texto;
  mensaje.className = 'mensaje';

  if (tipo) {
    mensaje.classList.add(tipo);
  }
}

// --------------------------------------------------
// ACTUALIZAR DATOS VISIBLES
// --------------------------------------------------

function mostrarDatos() {
  $('ver-nombre').textContent =
    datosPerfil.nombre || 'Sin registrar';

  $('ver-email').textContent =
    datosPerfil.email ||
    'Disponible al iniciar sesión';

  $('ver-telefono').textContent =
    datosPerfil.telefono || 'Sin registrar';

  $('ver-ciudad').textContent =
    datosPerfil.ciudad || 'Sin registrar';
}

// --------------------------------------------------
// MOSTRAR FORMULARIO DE EDICIÓN
// --------------------------------------------------

function abrirEdicion() {
  $('nombre').value = datosPerfil.nombre;
  $('email').value = datosPerfil.email;
  $('telefono').value = datosPerfil.telefono;
  $('ciudad').value = datosPerfil.ciudad;

  vistaLectura.classList.add('oculto');
  formulario.classList.remove('oculto');

  mostrarMensaje('');

  $('nombre').focus();
}

// --------------------------------------------------
// CANCELAR EDICIÓN
// --------------------------------------------------

function cancelarEdicion() {
  formulario.classList.add('oculto');
  vistaLectura.classList.remove('oculto');

  formulario.reset();
  mostrarMensaje('');
}

// --------------------------------------------------
// GUARDAR CAMBIOS EN MEMORIA TEMPORAL
// --------------------------------------------------

function guardarCambios(evento) {
  evento.preventDefault();

  if (!formulario.reportValidity()) {
    return;
  }

  const nombre = $('nombre').value.trim();
  const telefono = $('telefono').value.trim();
  const ciudad = $('ciudad').value.trim();

  if (!nombre || nombre.length > 100) {
    mostrarMensaje(
      'Ingresa un nombre válido de máximo 100 caracteres.',
      'error'
    );

    return;
  }

  if (telefono.length > 30 || ciudad.length > 100) {
    mostrarMensaje(
      'Revisa la longitud de los datos ingresados.',
      'error'
    );

    return;
  }

  // No enviamos información a ningún servidor.
  // Conservamos el correo sin permitir su edición.

  datosPerfil = {
    ...datosPerfil,
    nombre,
    telefono,
    ciudad
  };

  mostrarDatos();

  formulario.classList.add('oculto');
  vistaLectura.classList.remove('oculto');

  mostrarMensaje(
    'Vista previa actualizada. Los cambios no se han guardado en una cuenta real.',
    'exito'
  );
}

// --------------------------------------------------
// EVENTOS
// --------------------------------------------------

botonEditar.addEventListener('click', abrirEdicion);

botonCancelar.addEventListener(
  'click',
  cancelarEdicion
);

formulario.addEventListener(
  'submit',
  guardarCambios
);

// Iniciar vista en modo lectura

mostrarDatos();
