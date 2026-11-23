// =====================================================
// PETGO 2.0 - ARRANQUE DE PAGINAS PRIVADAS
// No permite mostrar datos si falla la validacion.
// =====================================================

import { comprobarSesion } from './session-guard.js';

function mostrarPagina() {
  document.getElementById('petgo-private-style')?.remove();
  document.documentElement.style.visibility = 'visible';
}

function mostrarErrorConexion() {
  const panel = document.createElement('main');
  panel.style.cssText = 'max-width:520px;margin:12vh auto;padding:30px;font-family:Nunito,Arial,sans-serif;color:#292524;text-align:center';

  const titulo = document.createElement('h1');
  titulo.textContent = 'No pudimos comprobar tu sesion';
  titulo.style.cssText = 'font-size:26px';

  const descripcion = document.createElement('p');
  descripcion.textContent = 'Comprueba que la API de PetGo este encendida e intenta de nuevo. Por seguridad, no mostraremos esta pagina hasta verificar tu cuenta.';
  descripcion.style.cssText = 'line-height:1.7;color:#78716c';

  const reintentar = document.createElement('button');
  reintentar.type = 'button';
  reintentar.textContent = 'Reintentar';
  reintentar.style.cssText = 'background:#ea580c;color:white;border:0;border-radius:12px;padding:13px 25px;font-weight:700;cursor:pointer';
  reintentar.addEventListener('click', () => window.location.reload());

  panel.append(titulo, descripcion, reintentar);
  document.body.replaceChildren(panel);
  mostrarPagina();
}

try {
  const resultado = await comprobarSesion();

  if (resultado.estado !== 'autorizado') {
    window.location.replace('/login.html');
  } else {
    const admin = resultado.is_admin === true;
    const paginaAdmin = ['/admin.html','/admin-agenda.html','/admin-guia.html'].includes(window.location.pathname);
    if (admin && !paginaAdmin) {
      window.location.replace('/admin.html');
    } else if (!admin && paginaAdmin) {
      window.location.replace('/panel.html');
    } else {
      mostrarPagina();
    }
  }
} catch {
  mostrarErrorConexion();
}
