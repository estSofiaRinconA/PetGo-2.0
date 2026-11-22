
// ==================================================
// PETGO 2.0 - NAVEGACIÓN
// Control de páginas que todavía no existen
// ==================================================

// Todas las páginas actuales del frontend ya tienen
// un archivo HTML correspondiente.
//
// Si en el futuro agregamos enlaces a páginas
// inexistentes, podemos incluirlos aquí.

const paginasPendientes = new Set();

document.addEventListener('click', (evento) => {
  const enlace = evento.target.closest('a[href]');

  if (!enlace) {
    return;
  }

  const destino = new URL(enlace.href);

  if (destino.origin !== window.location.origin) {
    return;
  }

  if (!paginasPendientes.has(destino.pathname)) {
    return;
  }

  evento.preventDefault();

  window.alert(
    'Esta función estará disponible próximamente en PetGo.'
  );
});
