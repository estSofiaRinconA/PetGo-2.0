
// PETGO 2.0 - INTERACCIONES DEL PANEL

const botonNotificaciones = document.getElementById(
  'boton-notificaciones'
);

const menuNotificaciones = document.getElementById(
  'menu-notificaciones'
);

const botonPerfil = document.getElementById(
  'boton-perfil'
);

const menuPerfil = document.getElementById(
  'menu-perfil'
);

const botonCerrarSesion = document.getElementById(
  'cerrar-sesion'
);

// Abrir o cerrar menús

function cerrarMenus() {
  menuNotificaciones.classList.add('oculto');
  menuPerfil.classList.add('oculto');

  botonNotificaciones.setAttribute('aria-expanded', 'false');
  botonPerfil.setAttribute('aria-expanded', 'false');
}

function alternarMenu(boton, menu) {
  const estabaAbierto = !menu.classList.contains('oculto');

  cerrarMenus();

  if (!estabaAbierto) {
    menu.classList.remove('oculto');
    boton.setAttribute('aria-expanded', 'true');
  }
}

botonNotificaciones.addEventListener('click', () => {
  alternarMenu(botonNotificaciones, menuNotificaciones);
});

botonPerfil.addEventListener('click', () => {
  alternarMenu(botonPerfil, menuPerfil);
});

// Cerrar al pulsar fuera del menú

document.addEventListener('click', (evento) => {
  if (!evento.target.closest('.menu-contenedor')) {
    cerrarMenus();
  }
});

// Cerrar al pulsar Escape

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') {
    cerrarMenus();
  }
});

// Cerrar la sesion a traves de nuestra API, no desde Supabase.

botonCerrarSesion.addEventListener('click', async () => {
  cerrarMenus();
  botonCerrarSesion.disabled = true;

  try {
    const respuesta = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    });

    // La API borra cookies incluso si no pudo confirmar
    // la revocacion remota (503). Informar al usuario.
    if (respuesta.ok) {
      window.location.replace('/login.html');
      return;
    }

    const datos = await respuesta.json().catch(() => ({}));

    if (respuesta.status === 503) {
      window.alert(
        datos.error || 'Se borro la sesion del navegador, pero no se pudo confirmar el cierre remoto.'
      );
      window.location.replace('/login.html');
      return;
    }

    throw new Error(datos.error || 'No se pudo cerrar la sesion.');
  } catch (error) {
    window.alert(
      error.message || 'No se pudo conectar con la API para cerrar sesion.'
    );
    botonCerrarSesion.disabled = false;
  }
});
