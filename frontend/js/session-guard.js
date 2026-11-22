// =====================================================
// PETGO 2.0 - SESION EN PAGINAS PRIVADAS
// Solo utiliza nuestra API /api/auth/me.
// =====================================================

export async function comprobarSesion() {
  const respuesta = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  });

  if (respuesta.status === 401) {
    return { estado: 'no-autorizado', usuario: null };
  }

  if (!respuesta.ok) {
    throw new Error('La API de PetGo no esta disponible.');
  }

  const datos = await respuesta.json();

  if (!datos.success || !datos.user) {
    return { estado: 'no-autorizado', usuario: null };
  }

  return { estado: 'autorizado', usuario: datos.user };
}
