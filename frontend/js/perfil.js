
// ==================================================
// PETGO 2.0 - MI PERFIL
// Datos reales mediante nuestra API Node.js
// ==================================================

const $ = (id) => document.getElementById(id);

const vistaLectura = $('vista-lectura');
const formulario = $('formulario-perfil');
const botonEditar = $('boton-editar');
const botonCancelar = $('boton-cancelar');
const mensaje = $('mensaje-perfil');

let datosPerfil = null;

// --------------------------------------------------
// MENSAJES
// --------------------------------------------------

function mostrarMensaje(texto = '', tipo = '') {
  mensaje.textContent = texto;
  mensaje.className = 'mensaje';

  if (tipo) {
    mensaje.classList.add(tipo);
  }
}

// --------------------------------------------------
// CONSULTAS A NUESTRA API
// --------------------------------------------------

async function solicitarPerfil(metodo = 'GET', datos) {
  const opciones = {
    method: metodo,
    credentials: 'same-origin',
    cache: 'no-store'
  };

  if (datos) {
    opciones.headers = {
      'Content-Type': 'application/json'
    };

    opciones.body = JSON.stringify(datos);
  }

  const respuesta = await fetch('/api/profile', opciones);

  if (respuesta.status === 401) {
    window.location.replace('/login.html');
    throw new Error('Tu sesion ha terminado.');
  }

  let resultado;

  try {
    resultado = await respuesta.json();
  } catch {
    throw new Error('La API devolvio una respuesta invalida.');
  }

  if (!respuesta.ok || !resultado.success) {
    throw new Error(
      resultado.error || 'No se pudo completar la solicitud.'
    );
  }

  return resultado.profile;
}

// --------------------------------------------------
// MOSTRAR DATOS
// --------------------------------------------------

function mostrarDatos() {
  if (!datosPerfil) return;

  $('ver-nombre').textContent =
    datosPerfil.nombre || 'Sin registrar';

  $('ver-email').textContent =
    datosPerfil.email || 'Sin registrar';
  $('email-actual').textContent = datosPerfil.email || 'Sin registrar';

  $('ver-telefono').textContent =
    datosPerfil.telefono || 'Sin registrar';

  $('ver-ciudad').textContent =
    datosPerfil.ciudad || 'Sin registrar';
}

// --------------------------------------------------
// CARGAR PERFIL REAL
// --------------------------------------------------

async function cargarPerfil() {
  botonEditar.disabled = true;
  mostrarMensaje('Cargando tus datos...');

  try {
    datosPerfil = await solicitarPerfil();

    mostrarDatos();

    botonEditar.disabled = false;
    mostrarMensaje('');
  } catch (error) {
    mostrarMensaje(
      error instanceof TypeError
        ? 'No se pudo conectar con la API de PetGo.'
        : error.message,
      'error'
    );
  }
}

// --------------------------------------------------
// ACTIVAR EDICION
// --------------------------------------------------

function abrirEdicion() {
  if (!datosPerfil) return;

  $('nombre').value = datosPerfil.nombre || '';
  $('email').value = datosPerfil.email || '';
  $('telefono').value = datosPerfil.telefono || '';
  $('ciudad').value = datosPerfil.ciudad || '';

  vistaLectura.classList.add('oculto');
  formulario.classList.remove('oculto');

  mostrarMensaje('');
  $('nombre').focus();
}

// --------------------------------------------------
// CANCELAR EDICION
// --------------------------------------------------

function cancelarEdicion() {
  formulario.classList.add('oculto');
  vistaLectura.classList.remove('oculto');

  formulario.reset();
  mostrarMensaje('');
}

// --------------------------------------------------
// GUARDAR CAMBIOS REALES
// --------------------------------------------------

async function guardarCambios(evento) {
  evento.preventDefault();

  if (!formulario.reportValidity()) return;

  const nombre = $('nombre').value.trim();
  const telefono = $('telefono').value.trim();
  const ciudad = $('ciudad').value.trim();

  if (!nombre || nombre.length > 100) {
    mostrarMensaje(
      'Ingresa un nombre valido de maximo 100 caracteres.',
      'error'
    );
    return;
  }

  if (telefono.length > 30 || ciudad.length > 100) {
    mostrarMensaje(
      'Revisa la longitud de los datos.',
      'error'
    );
    return;
  }

  const botonGuardar = formulario.querySelector(
    'button[type="submit"]'
  );

  botonGuardar.disabled = true;
  botonCancelar.disabled = true;
  botonGuardar.textContent = 'Guardando...';

  mostrarMensaje('');

  try {
    const perfilActualizado = await solicitarPerfil(
      'PATCH',
      {
        nombre,
        telefono,
        ciudad
      }
    );

    datosPerfil = perfilActualizado;
    mostrarDatos();

    formulario.classList.add('oculto');
    vistaLectura.classList.remove('oculto');

    mostrarMensaje(
      'Tus datos se guardaron correctamente.',
      'exito'
    );
  } catch (error) {
    mostrarMensaje(
      error instanceof TypeError
        ? 'No se pudo conectar con la API de PetGo.'
        : error.message,
      'error'
    );
  } finally {
    botonGuardar.disabled = false;
    botonCancelar.disabled = false;
    botonGuardar.textContent = 'Guardar cambios';
  }
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

// Iniciar consulta a nuestra API.
cargarPerfil();

// --------------------------------------------------
// SEGURIDAD DE LA CUENTA
// --------------------------------------------------

async function solicitarSeguridad(ruta, datos) {
  const respuesta = await fetch(ruta, {
    method: 'PATCH',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (respuesta.status === 401) {
    window.location.replace('/login.html');
    throw new Error('Tu sesion ha terminado.');
  }
  const resultado = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || !resultado.success) {
    throw new Error(resultado.error || 'No se pudo completar la solicitud.');
  }
  return resultado;
}

function mensajeSeguridad(id, texto, esError = false) {
  const elemento = $(id);
  elemento.textContent = texto;
  elemento.className = `mensaje ${esError ? 'error' : 'exito'}`;
}

async function ejecutarSeguridad(formulario, mensajeId, ruta, datos) {
  const boton = formulario.querySelector('button[type="submit"]');
  boton.disabled = true;
  mensajeSeguridad(mensajeId, '', false);
  try {
    const resultado = await solicitarSeguridad(ruta, datos);
    formulario.reset();
    mensajeSeguridad(mensajeId, resultado.message || 'Solicitud procesada.');
    return true;
  } catch (error) {
    mensajeSeguridad(mensajeId,
      error instanceof TypeError ? 'No se pudo conectar con la API de PetGo.' : error.message,
      true);
    return false;
  } finally {
    boton.disabled = false;
  }
}

$('formulario-email').addEventListener('submit', async evento => {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  if (!formulario.reportValidity()) return;
  await ejecutarSeguridad(formulario, 'mensaje-email', '/api/profile/security/email', {
    newEmail: $('seguridad-nuevo-email').value.trim(),
    currentPassword: $('seguridad-clave-email').value
  });
});

$('formulario-password').addEventListener('submit', async evento => {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  if (!formulario.reportValidity()) return;
  const nueva = $('seguridad-clave-nueva').value;
  const confirmar = $('seguridad-clave-confirmar').value;
  if (nueva !== confirmar) {
    mensajeSeguridad('mensaje-password', 'Las contrasenas nuevas no coinciden.', true);
    return;
  }
  const correcto = await ejecutarSeguridad(formulario, 'mensaje-password',
    '/api/profile/security/password', {
      currentPassword: $('seguridad-clave-actual').value,
      newPassword: nueva,
      confirmPassword: confirmar
    });
  if (correcto) {
    window.setTimeout(() => window.location.replace('/login.html'), 1800);
  }
});
