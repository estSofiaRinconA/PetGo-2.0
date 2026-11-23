// PetGo: correo -> verificar OTP -> nueva contraseña.
const solicitar = document.getElementById('solicitar-form');
const verificar = document.getElementById('verificar-form');
const restablecer = document.getElementById('restablecer-form');
const mensaje = document.getElementById('mensaje-recuperacion');
const progreso = document.getElementById('progreso');
let procesando = false;
let emailSolicitado = '';

function aviso(texto, tipo = 'error') {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
}
function mostrarPaso(n) {
  solicitar.hidden = n !== 1;
  verificar.hidden = n !== 2;
  restablecer.hidden = n !== 3;
  progreso.textContent = [
    '',
    'Paso 1 de 3 · Solicitar código',
    'Paso 2 de 3 · Verificar código',
    'Paso 3 de 3 · Nueva contraseña'
  ][n];
}
async function enviar(ruta, datos) {
  const response = await fetch(`/api/auth/password/${ruta}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  let data;
  try { data = await response.json(); }
  catch { throw new Error('No se pudo leer la respuesta de la API Node.js.'); }
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'No fue posible completar esta operación.');
  }
  return data;
}
async function procesar(formulario, accion) {
  if (procesando) return;
  procesando = true;
  const boton = formulario.querySelector('button[type="submit"]');
  boton.disabled = true;
  const original = boton.textContent;
  boton.textContent = 'Procesando...';
  try { await accion(); }
  catch (e) { aviso(e.message || 'Error temporal.'); }
  finally {
    procesando = false;
    boton.disabled = false;
    boton.textContent = original;
  }
}
solicitar.addEventListener('submit', (event) => {
  event.preventDefault();
  procesar(solicitar, async () => {
    const email = document.getElementById('correo').value.trim().toLowerCase();
    await enviar('recovery', { email });
    emailSolicitado = email;
    mostrarPaso(2);
    aviso('Si la cuenta existe, recibirás un código. Revisa también spam.', 'exito');
    document.getElementById('codigo').focus();
  });
});
verificar.addEventListener('submit', (event) => {
  event.preventDefault();
  procesar(verificar, async () => {
    const token = document.getElementById('codigo').value.trim();
    await enviar('verify', { email: emailSolicitado, token });
    document.getElementById('codigo').value = '';
    mostrarPaso(3);
    aviso('¡Código correcto! Ya puedes establecer una nueva contraseña.', 'exito');
    document.getElementById('nueva').focus();
  });
});
document.getElementById('volver-correo').addEventListener('click', () => {
  if (procesando) return;
  mostrarPaso(1);
  aviso('');
  document.getElementById('correo').focus();
});
restablecer.addEventListener('submit', (event) => {
  event.preventDefault();
  procesar(restablecer, async () => {
    const password = document.getElementById('nueva').value;
    const confirmar = document.getElementById('confirmacion').value;
    if (password !== confirmar) throw new Error('Las contraseñas no coinciden.');
    if (password.length < 12) throw new Error('Utiliza al menos 12 caracteres.');
    await enviar('reset', { password, confirmar });
    restablecer.reset();
    restablecer.hidden = true;
    progreso.textContent = 'Recuperación completada';
    aviso('Contraseña actualizada. Ahora puedes iniciar sesión.', 'exito');
  });
});
mostrarPaso(1);
