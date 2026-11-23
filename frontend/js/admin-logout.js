// PetGo 2.0 — cierre de sesión administrativo.
// Las cookies HttpOnly se gestionan exclusivamente mediante nuestra API.
const logoutButton = document.getElementById('admin-logout');

if (logoutButton) {
  logoutButton.addEventListener('click', async () => {
    if (logoutButton.disabled) return;

    logoutButton.disabled = true;
    logoutButton.textContent = 'Cerrando sesión...';

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });

      // El backend puede reportar 503 si falló la revocación remota,
      // pero en PetGo borra las cookies locales igualmente.
      if (response.ok || response.status === 503) {
        window.location.replace('/login.html');
        return;
      }

      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'No se pudo cerrar la sesión.');
    } catch (error) {
      window.alert(error.message || 'Error de conexión con la API de PetGo.');
      logoutButton.disabled = false;
      logoutButton.textContent = 'Cerrar sesión';
    }
  });
}
