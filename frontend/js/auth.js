
const loginForm = document.getElementById('login-form');
const registroForm = document.getElementById('registro-form');
const mensaje = document.getElementById('mensaje');
const boton = document.getElementById('submit-btn');

function mostrarMensaje(texto, tipo = 'error') {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
}

async function enviarDatos(ruta, datos) {
  const response = await fetch(`/api/auth/${ruta}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datos)
  });

  const resultado = await response.json();

  if (!response.ok || !resultado.success) {
    throw new Error(
      resultado.error || 'No se pudo completar la solicitud'
    );
  }

  return resultado;
}

async function procesarFormulario(evento, accion) {
  evento.preventDefault();
  mostrarMensaje('');

  const formulario = evento.currentTarget;
  const datos = Object.fromEntries(new FormData(formulario));

  if (accion === 'register') {
    if (datos.password !== datos.confirmar) {
      mostrarMensaje('Las contraseñas no coinciden.');
      return;
    }

    if (datos.password.length < 12) {
      mostrarMensaje('La contraseña debe tener al menos 12 caracteres.');
      return;
    }

    delete datos.confirmar;
  }

  boton.disabled = true;
  boton.textContent = 'Procesando...';

  try {
    const resultado = await enviarDatos(accion, datos);

    if (accion === 'register') {
      mostrarMensaje(
        'Solicitud recibida. Revisa tu correo para confirmar tu cuenta si es necesario.',
        'exito'
      );
      formulario.reset();
    } else {
      mostrarMensaje(
        'Inicio de sesión correcto. Estamos preparando tu panel de cliente.',
        'exito'
      );
      formulario.reset();

      // El panel y el manejo seguro de sesiones
      // se conectarán en una etapa posterior.
      // No guardamos tokens en este prototipo.
      void resultado;
    }
  } catch (error) {
    mostrarMensaje(
      error instanceof TypeError
        ? 'No se pudo conectar con el servidor.'
        : error.message
    );
  } finally {
    boton.disabled = false;
    boton.textContent =
      accion === 'register' ? 'Crear mi cuenta' : 'Iniciar sesión';
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
