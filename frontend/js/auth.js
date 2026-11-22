
// =====================================================
// PETGO 2.0 - REGISTRO E INICIO DE SESION
// Frontend conectado exclusivamente a nuestra API
// =====================================================

const loginForm = document.getElementById('login-form');
const registroForm = document.getElementById('registro-form');
const mensaje = document.getElementById('mensaje');
const boton = document.getElementById('submit-btn');

function mostrarMensaje(texto, tipo = 'error') {
  if (!mensaje) return;

  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
}

async function enviarDatos(ruta, datos) {
  const respuesta = await fetch(`/api/auth/${ruta}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datos)
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok || !resultado.success) {
    throw new Error(
      resultado.error || 'No se pudo completar la solicitud.'
    );
  }

  return resultado;
}

async function procesarFormulario(evento, accion) {
  evento.preventDefault();

  if (!boton) return;

  mostrarMensaje('');

  const formulario = evento.currentTarget;
  const datos = Object.fromEntries(
    new FormData(formulario)
  );

  if (accion === 'register') {
    if (datos.password !== datos.confirmar) {
      mostrarMensaje('Las contraseñas no coinciden.');
      return;
    }

    if (datos.password.length < 12) {
      mostrarMensaje(
        'La contraseña debe tener al menos 12 caracteres.'
      );
      return;
    }

    delete datos.confirmar;
  }

  const textoOriginal = boton.textContent;

  boton.disabled = true;
  boton.textContent = 'Procesando...';

  try {
    const resultado = await enviarDatos(
      accion,
      datos
    );

    if (accion === 'register') {
      mostrarMensaje(
        resultado.message ||
        'Registro procesado. Revisa tu correo.',
        'exito'
      );

      formulario.reset();
      return;
    }

    // El backend ya guardo la sesion en cookies
    // HttpOnly. No usamos localStorage.

    mostrarMensaje(
      'Inicio de sesión correcto. Abriendo tu espacio...',
      'exito'
    );

    formulario.reset();

    window.location.assign('/panel.html');

  } catch (error) {
    mostrarMensaje(
      error instanceof TypeError
        ? 'No se pudo conectar con la API de PetGo.'
        : error.message
    );

  } finally {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', (evento) => {
    procesarFormulario(evento, 'login');
  });
}

if (registroForm) {
  registroForm.addEventListener('submit', (evento) => {
    procesarFormulario(evento, 'register');
  });
}
