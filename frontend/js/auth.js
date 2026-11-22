
/**
 * PetGo 2.0
 * Registro e inicio de sesion mediante nuestra API Node.js.
 *
 * El frontend nunca se conecta directamente a Supabase.
 * Las sesiones se gestionan con cookies HttpOnly.
 */

const loginForm = document.getElementById('login-form');
const registroForm = document.getElementById('registro-form');
const mensaje = document.getElementById('mensaje');
const boton = document.getElementById('submit-btn');

let procesando = false;

function mostrarMensaje(texto, tipo = 'error') {
  if (!mensaje) return;

  mensaje.textContent = texto;
  mensaje.className = tipo
    ? `mensaje ${tipo}`
    : 'mensaje';
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

  let resultado;

  try {
    resultado = await respuesta.json();
  } catch {
    throw new Error(
      'El servidor devolvio una respuesta inesperada.'
    );
  }

  if (respuesta.status === 429) {
    throw new Error(
      'Se alcanzó temporalmente el límite de intentos. ' +
      'Espera el tiempo indicado por el servicio antes ' +
      'de volver a intentarlo.'
    );
  }

  if (!respuesta.ok || !resultado.success) {
    const errorOriginal = String(resultado.error || '');

    if (
      /rate limit|too many|demasiados intentos|límite de/i
        .test(errorOriginal)
    ) {
      throw new Error(
        'Hay demasiados intentos de registro. ' +
        'Espera antes de volver a intentarlo.'
      );
    }

    throw new Error(
      resultado.error ||
      'No se pudo completar la solicitud.'
    );
  }

  return resultado;
}

async function procesarFormulario(evento, accion) {
  evento.preventDefault();

  // Impide envios duplicados mientras hay una solicitud activa.
  if (procesando) return;

  const formulario = evento.currentTarget;
  const datos = Object.fromEntries(
    new FormData(formulario)
  );

  mostrarMensaje('');

  if (accion === 'register') {
    if (datos.password !== datos.confirmar) {
      mostrarMensaje('Las contraseñas no coinciden.');
      return;
    }

    if (
      typeof datos.password !== 'string' ||
      datos.password.length < 12
    ) {
      mostrarMensaje(
        'La contraseña debe tener al menos 12 caracteres.'
      );
      return;
    }

    delete datos.confirmar;
  }

  procesando = true;

  if (boton) {
    boton.disabled = true;
    boton.textContent = accion === 'register'
      ? 'Creando cuenta...'
      : 'Iniciando sesión...';
  }

  let completado = false;

  try {
    await enviarDatos(accion, datos);

    completado = true;

    if (accion === 'register') {
      mostrarMensaje(
        '¡Registro recibido correctamente! ' +
        'Revisa tu correo para confirmar tu cuenta. ' +
        'En 3 segundos te llevaremos a Iniciar sesión.',
        'exito'
      );

      formulario.reset();

      // Mantener bloqueado el formulario para evitar
      // solicitudes duplicadas durante la redireccion.
      window.setTimeout(() => {
        window.location.replace('/login.html');
      }, 3000);

      return;
    }

    mostrarMensaje(
      '¡Inicio de sesión correcto! ' +
      'Entrando a tu panel...',
      'exito'
    );

    formulario.reset();

    window.location.replace('/panel.html');

  } catch (error) {
    mostrarMensaje(
      error instanceof TypeError
        ? 'No se pudo conectar con el servidor de PetGo.'
        : error.message
    );
  } finally {
    if (!completado) {
      procesando = false;

      if (boton) {
        boton.disabled = false;
        boton.textContent = accion === 'register'
          ? 'Crear mi cuenta'
          : 'Iniciar sesión';
      }
    }
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
