// PETGO 2.0 — Mis reservas: Activas / Historial.
// Los datos provienen exclusivamente de nuestra API Node.js.
const loading = document.getElementById('estado-cargando');
const empty = document.getElementById('estado-vacio');
const failure = document.getElementById('estado-error');
const list = document.getElementById('lista-reservas');
const emptyTitle = document.getElementById('titulo-vacio');
const emptyDescription = document.getElementById('descripcion-vacio');
const panel = document.getElementById('seccion-reservas');
const tabs = {
  activas: document.getElementById('tab-activas'),
  historial: document.getElementById('tab-historial')
};
const counters = {
  activas: document.getElementById('contador-activas'),
  historial: document.getElementById('contador-historial')
};

let allBookings = [];
let currentTab = 'activas';
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
    ? new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota'
      }).format(date)
    : 'Fecha no disponible';
}

function tabFor(booking) {
  return ['cancelada', 'completada'].includes(booking.status)
    ? 'historial'
    : 'activas';
}

function setTab(name, focus = false) {
  currentTab = name;
  for (const [tabName, button] of Object.entries(tabs)) {
    const selected = tabName === name;
    button.classList.toggle('activa', selected);
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  }
  panel.setAttribute('aria-labelledby', tabs[name].id);
  if (focus) tabs[name].focus();
  renderBookings();
}

function renderBookings() {
  counters.activas.textContent = String(allBookings.filter(b => tabFor(b) === 'activas').length);
  counters.historial.textContent = String(allBookings.filter(b => tabFor(b) === 'historial').length);

  const bookings = allBookings.filter(b => tabFor(b) === currentTab);
  list.replaceChildren();
  if (!bookings.length) {
    emptyTitle.textContent = currentTab === 'activas'
      ? 'No tienes reservas activas'
      : 'Todavía no hay reservas en tu historial';
    emptyDescription.textContent = currentTab === 'activas'
      ? 'Tus solicitudes pendientes y reservas confirmadas aparecerán aquí.'
      : 'Aquí aparecerán las solicitudes canceladas y los servicios completados.';
    show('empty');
    return;
  }

  for (const booking of bookings) {
    const article = create('article', 'reserva');
    const header = create('div', 'reserva-cabecera');
    const status = booking.status || 'pendiente';
    header.append(
      create('h3', '', booking.service_name || 'Servicio'),
      create('span', 'reserva-estado', status.replace(/^./, c => c.toUpperCase()))
    );
    article.append(
      header,
      create('p', '', `Modalidad: ${booking.variant_name || 'Sin modalidad'}`),
      create('p', '', `Mascota: ${booking.pet_name || 'Mascota'}`),
      create('p', '', `Fecha y hora solicitadas: ${displayDate(booking.scheduled_at)}`)
    );

    if (status === 'pendiente') {
      article.append(create('p', '', 'Solicitud recibida; todavía no es una reserva confirmada.'));
      const actions = create('div', 'reserva-acciones');
      const button = create('button', 'boton-cancelar-reserva', 'Cancelar solicitud');
      button.type = 'button';
      button.addEventListener('click', () => cancelRequest(booking, button));
      actions.append(button);
      article.append(actions);
    }
    if (status === 'cancelada') {
      article.append(create('p', 'reserva-nota-cancelada', 'Esta solicitud fue cancelada.'));
    }
    if (status === 'completada') {
      article.append(create('p', '', 'Este servicio ya fue completado.'));
    }
    list.append(article);
  }
  show('list');
}

async function loadBookings() {
  show('loading');
  try {
    const response = await fetch('/api/reservations', {
      credentials: 'same-origin', cache: 'no-store'
    });
    if (response.status === 401) {
      window.location.replace('/login.html');
      return;
    }
    const result = await response.json();
    if (!response.ok || !result.success || !Array.isArray(result.reservations)) {
      throw new Error(result.error || 'No pudimos consultar tus reservas.');
    }
    allBookings = result.reservations;
    renderBookings();
  } catch (error) {
    failure.querySelector('p').textContent = error instanceof TypeError
      ? 'Revisa la conexión con la API de PetGo.'
      : error.message;
    show('error');
  }
}

async function cancelRequest(booking, button) {
  if (saving) return;
  if (!window.confirm('¿Quieres cancelar esta solicitud pendiente? Esta acción no se puede deshacer.')) return;
  saving = true;
  button.disabled = true;
  button.textContent = 'Cancelando...';
  try {
    const response = await fetch('/api/reservations/cancel', {
      method: 'PATCH',
      credentials: 'same-origin',
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
    // Reconsultar a la API: la reserva pasa de Activas a Historial.
    await loadBookings();
  } catch (error) {
    const notice = create('p', 'error-cancelar-reserva',
      error instanceof TypeError
        ? 'No pudimos conectar con la API. Comprueba la conexión.'
        : error.message);
    notice.setAttribute('role', 'alert');
    button.parentNode.querySelector('.error-cancelar-reserva')?.remove();
    button.parentNode.append(notice);
  } finally {
    saving = false;
    button.disabled = false;
    button.textContent = 'Cancelar solicitud';
  }
}

for (const [name, button] of Object.entries(tabs)) {
  button.addEventListener('click', () => setTab(name));
  button.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = name;
    if (event.key === 'Home') next = 'activas';
    if (event.key === 'End') next = 'historial';
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      next = name === 'activas' ? 'historial' : 'activas';
    }
    setTab(next, true);
  });
}

loadBookings();
