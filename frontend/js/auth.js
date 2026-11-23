// PetGo 2.0: registro y acceso por rol. La API comprueba el administrador.
const loginForm = document.getElementById('login-form');
const registroForm = document.getElementById('registro-form');
const mensaje = document.getElementById('mensaje');
const boton = document.getElementById('submit-btn');
let procesando = false;

function mostrarMensaje(texto, tipo = 'error') {
  if (!mensaje) return;
  mensaje.textContent = texto;
  mensaje.className = tipo ? `mensaje ${tipo}` : 'mensaje';
}

async function enviarDatos(accion, datos) {
  const respuesta = await fetch(`/api/auth/${accion}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });

  let resultado;
  try {
    resultado = await respuesta.json();
  } catch {
    throw new Error('La API no devolvio una respuesta valida. Comprueba que el backend este encendido.');
  }

  if (respuesta.status === 429) {
    throw new Error('Hay demasiados intentos. Intenta de nuevo cuando termine el limite temporal.');
  }
  if (!respuesta.ok || !resultado.success) {
    throw new Error(resultado.error || 'No se pudo completar la solicitud.');
  }
  return resultado;
}

async function procesarFormulario(evento, accion) {
  evento.preventDefault();
  if (procesando) return;
  const formulario = evento.currentTarget;
  const datos = Object.fromEntries(new FormData(formulario));
  mostrarMensaje('');

  if (accion === 'register') {
    if (datos.password !== datos.confirmar) {
      mostrarMensaje('Las contraseñas no coinciden.');
      return;
    }
    if (typeof datos.password !== 'string' || datos.password.length < 12) {
      mostrarMensaje('La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    delete datos.confirmar;
  }

  procesando = true;
  if (boton) {
    boton.disabled = true;
    boton.textContent = accion === 'register' ? 'Creando cuenta...' : 'Iniciando sesión...';
  }
  let redirigiendo = false;

  try {
    const resultado = await enviarDatos(accion, datos);
    if (accion === 'register') {
      redirigiendo = true;
      mostrarMensaje('¡Registro procesado! Revisa tu correo para confirmar tu cuenta. Te llevaremos a Iniciar sesión.', 'exito');
      formulario.reset();
      window.setTimeout(() => window.location.replace('/login.html'), 3000);
      return;
    }

    // is_admin es un booleano generado en el backend tras consultar petgo_admin_users.
    // La pagina administrativa vuelve a verificar el rol en cada solicitud.
    const destino = resultado.is_admin === true ? '/admin.html' : '/panel.html';
    redirigiendo = true;
    mostrarMensaje(resultado.is_admin === true ? 'Acceso administrativo autorizado.' : 'Inicio de sesión correcto.', 'exito');
    window.location.replace(destino);
  } catch (error) {
    mostrarMensaje(error instanceof TypeError
      ? 'No se pudo conectar con la API de PetGo.'
      : error.message);
  } finally {
    if (!redirigiendo) {
      procesando = false;
      if (boton) {
        boton.disabled = false;
        boton.textContent = accion === 'register' ? 'Crear mi cuenta' : 'Iniciar sesión';
      }
    }
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', evento => procesarFormulario(evento, 'login'));
}
if (registroForm) {
  registroForm.addEventListener('submit', evento => procesarFormulario(evento, 'register'));
}
