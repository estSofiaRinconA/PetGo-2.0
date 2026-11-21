
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

// Cierre de sesión pendiente de integración

botonCerrarSesion.addEventListener('click', () => {
  cerrarMenus();

  window.alert(
    'El cierre de sesión estará disponible cuando conectemos la autenticación.'
  );
});
