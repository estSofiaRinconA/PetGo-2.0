(() => {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('google_error')) return;
  const target = document.querySelector('#mensaje');
  if (target) {
    target.textContent = 'No se pudo iniciar sesión con Google. Inténtalo nuevamente.';
    target.className = 'mensaje error';
  }
  window.history.replaceState(null, '', window.location.pathname);
})();
