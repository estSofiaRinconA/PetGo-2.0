// PETGO 2.0 - Mis solicitudes reales desde la API propia Node.js.
const loading = document.getElementById('estado-cargando');
const empty = document.getElementById('estado-vacio');
const failure = document.getElementById('estado-error');
const list = document.getElementById('lista-reservas');
let saving = false;

function show(name) {
  loading.classList.toggle('oculto', name !== 'loading');
  empty.classList.toggle('oculto', name !== 'empty');
  failure.classList.toggle('oculto', name !== 'error');
  list.classList.toggle('oculto', name !== 'list');
}
function create(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}
function displayDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short' }).format(date)
    : 'Fecha no disponible';
}
async function loadBookings() {
  show('loading');
  try {
    const response = await fetch('/api/reservations', { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401) {
      window.location.replace('/login.html');
      return;
    }
    const result = await response.json();
    if (!response.ok || !result.success || !Array.isArray(result.reservations)) {
      throw new Error(result.error || 'No pudimos consultar tus reservas.');
    }
    list.replaceChildren();
    if (!result.reservations.length) { show('empty'); return; }
    for (const booking of result.reservations) {
      const article = create('article', 'reserva');
      const header = create('div', 'reserva-cabecera');
      header.append(
        create('h3', '', booking.service_name || 'Servicio'),
        create('span', 'reserva-estado', (booking.status || 'pendiente').replace(/^./, letter => letter.toUpperCase()))
      );
      article.append(
        header,
        create('p', '', `Modalidad: ${booking.variant_name || 'Sin modalidad'}`),
        create('p', '', `Mascota: ${booking.pet_name || 'Mascota'}`),
        create('p', '', `Fecha y hora solicitadas: ${displayDate(booking.scheduled_at)}`)
      );
      if (booking.status === 'pendiente') {
        article.append(create('p', '', 'Solicitud recibida; todavía no es una reserva confirmada.'));
        const actions = create('div', 'reserva-acciones');
        const cancel = create('button', 'boton-cancelar-reserva', 'Cancelar solicitud');
        cancel.type = 'button';
        cancel.addEventListener('click', () => cancelRequest(booking, cancel));
        actions.append(cancel);
        article.append(actions);
      }
      if (booking.status === 'cancelada') {
        article.append(create('p', 'reserva-nota-cancelada', 'Esta solicitud fue cancelada.'));
      }
      list.append(article);
    }
    show('list');
  } catch (error) {
    failure.querySelector('p').textContent = error instanceof TypeError
      ? 'Revisa la conexión con la API de PetGo.'
      : error.message;
    show('error');
  }
}
async function cancelRequest(booking, button) {
  if (saving) return;
  const agreed = window.confirm('¿Quieres cancelar esta solicitud pendiente? Esta acción no se puede deshacer.');
  if (!agreed) return;
  saving = true;
  button.disabled = true;
  button.textContent = 'Cancelando...';
  try {
    const response = await fetch('/api/reservations/cancel', {
      method: 'PATCH', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: booking.id })
    });
    if (response.status === 401) {
      window.location.replace('/login.html');
      return;
    }
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'No se pudo cancelar la solicitud.');
    }
    await loadBookings();
  } catch (error) {
    const notice = document.createElement('p');
    notice.className = 'error-cancelar-reserva';
    notice.setAttribute('role', 'alert');
    notice.textContent = error instanceof TypeError
      ? 'No pudimos conectar con la API. Comprueba la conexión.'
      : error.message;
    button.parentNode.querySelector('.error-cancelar-reserva')?.remove();
    button.parentNode.append(notice);
  } finally {
    saving = false;
    button.disabled = false;
    button.textContent = 'Cancelar solicitud';
  }
}
loadBookings();
