
// ===================================================
// PETGO 2.0 - RESERVAS
// Selectores de fecha y hora personalizados
// Solicitudes reales con estado pendiente; sin disponibilidad confirmada
// ===================================================

const $ = (id) => document.getElementById(id);

// Las categorías visibles conservan sus tarjetas originales.
// Las modalidades ya no se obtienen de una lista escrita en JavaScript.
const opciones = { paseo: [], bano: [] };
const nombresServicios = { paseo: 'Paseos', bano: 'Baño y peluquería' };
const serviciosDisponibles = { paseo: null, bano: null };
let catalogoCargado = false;

function normalizar(texto) {
  return String(texto || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

async function cargarCatalogo() {
  const botones = document.querySelectorAll('.opcion-servicio');
  botones.forEach(boton => { boton.disabled = true; });
  $('siguiente-1').disabled = true;
  $('mensaje-1').textContent = 'Cargando servicios reales...';

  try {
    const respuesta = await fetch('/api/services', {
      credentials: 'same-origin', cache: 'no-store'
    });
    if (respuesta.status === 401) {
      window.location.replace('/login.html');
      return;
    }
    const datos = await respuesta.json();
    if (!respuesta.ok || !datos.success || !Array.isArray(datos.services)) {
      throw new Error(datos.error || 'No fue posible cargar los servicios.');
    }

    for (const boton of botones) {
      const tipo = boton.dataset.servicio;
      const nombreBuscado = normalizar(nombresServicios[tipo]);
      const servicio = datos.services.find(item => normalizar(item.nombre) === nombreBuscado);
      serviciosDisponibles[tipo] = servicio || null;
      opciones[tipo] = (servicio?.variants || []).map(item => ({
        valor: item.id, texto: item.nombre
      }));
      boton.disabled = opciones[tipo].length === 0;
    }

    catalogoCargado = true;
    $('siguiente-1').disabled = false;
    $('mensaje-1').textContent = botones.length && [...botones].some(b => !b.disabled)
      ? '' : 'No hay servicios activos disponibles por ahora.';

    // El catálogo ya es real; los horarios y las reservas aún no lo son.
    const avisoModalidad = document.querySelector('#contenedor-modalidad .ayuda');
    if (avisoModalidad) avisoModalidad.textContent =
      'Modalidades reales de PetGo. Los horarios elegidos serán preferencias, no disponibilidad confirmada.';
  } catch (error) {
    $('mensaje-1').textContent = error instanceof TypeError
      ? 'No pudimos conectar con la API. Revisa que el backend esté encendido.'
      : error.message;
  }
}

const estado = {
  servicio: '',
  modalidad: '',
  mascota: '',
  fecha: '',
  hora: ''
};

const formatoMes = new Intl.DateTimeFormat('es-CO', {
  month: 'long',
  year: 'numeric'
});

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

const formatoHora = new Intl.DateTimeFormat('es-CO', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});

let mesVisible = new Date();
mesVisible.setDate(1);
mesVisible.setHours(12, 0, 0, 0);

// ---------------------------------------------------
// FUNCIONES DE FECHA Y HORA
// ---------------------------------------------------

function fechaLocal(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

function crearFechaLocal(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia, 12);
}

function horaBonita(valor) {
  const [horas, minutos] = valor.split(':').map(Number);
  const fecha = new Date(2026, 0, 1, horas, minutos);

  return formatoHora.format(fecha);
}

function fechaBonita(valor) {
  return formatoFecha.format(crearFechaLocal(valor));
}

function fechaYHoraFuturas() {
  if (!estado.fecha || !estado.hora) return false;

  const [anio, mes, dia] = estado.fecha.split('-').map(Number);
  const [hora, minuto] = estado.hora.split(':').map(Number);

  const fechaSolicitada = new Date(
    anio, mes - 1, dia, hora, minuto
  );

  return fechaSolicitada > new Date();
}

// ---------------------------------------------------
// PASOS DEL FORMULARIO
// ---------------------------------------------------

function mostrarPaso(numero) {
  cerrarSelectores();

  for (let i = 1; i <= 3; i++) {
    $(`paso-${i}`).classList.toggle(
      'oculto',
      i !== numero
    );

    $(`indicador-${i}`).classList.toggle(
      'activo',
      i === numero
    );
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------------------------------------------------
// ELEGIR SERVICIO
// ---------------------------------------------------

const botonesServicio = document.querySelectorAll(
  '.opcion-servicio'
);

botonesServicio.forEach((boton) => {
  boton.addEventListener('click', () => {
    estado.servicio = boton.dataset.servicio;
    estado.modalidad = '';

    botonesServicio.forEach((opcion) => {
      const seleccionado = opcion === boton;

      opcion.classList.toggle(
        'seleccionado',
        seleccionado
      );

      opcion.setAttribute(
        'aria-pressed',
        String(seleccionado)
      );
    });

    const selector = $('modalidad');

    selector.replaceChildren(
      new Option('Selecciona una modalidad', '')
    );

    (opciones[estado.servicio] || []).forEach((opcion) => {
      selector.add(
        new Option(opcion.texto, opcion.valor)
      );
    });

    $('contenedor-modalidad').classList.remove('oculto');
    $('mensaje-1').textContent = '';
  });
});

$('modalidad').addEventListener('change', (evento) => {
  estado.modalidad = evento.target.value;
  $('mensaje-1').textContent = '';
});

$('siguiente-1').addEventListener('click', () => {
  if (!catalogoCargado || !estado.servicio || !estado.modalidad || !opciones[estado.servicio]?.some(o => o.valor === estado.modalidad)) {
    $('mensaje-1').textContent =
      'Selecciona un servicio y una modalidad.';
    return;
  }

  cargarMascotas();
  mostrarPaso(2);
});

$('anterior-2').addEventListener('click', () => {
  mostrarPaso(1);
});

// ---------------------------------------------------
// ABRIR Y CERRAR SELECTORES
// ---------------------------------------------------

function cerrarSelectores() {
  $('calendario').classList.add('oculto');
  $('lista-horas').classList.add('oculto');

  $('abrir-fecha').setAttribute(
    'aria-expanded', 'false'
  );

  $('abrir-hora').setAttribute(
    'aria-expanded', 'false'
  );
}

function alternarSelector(tipo) {
  const popup = tipo === 'fecha'
    ? $('calendario')
    : $('lista-horas');

  const boton = tipo === 'fecha'
    ? $('abrir-fecha')
    : $('abrir-hora');

  const estabaAbierto = !popup.classList.contains('oculto');

  cerrarSelectores();

  if (!estabaAbierto) {
    if (tipo === 'fecha') {
      dibujarCalendario();
    } else {
      dibujarHoras();
    }

    popup.classList.remove('oculto');
    boton.setAttribute('aria-expanded', 'true');
  }
}

$('abrir-fecha').addEventListener('click', () => {
  alternarSelector('fecha');
});

$('abrir-hora').addEventListener('click', () => {
  alternarSelector('hora');
});

// Cerrar al hacer clic fuera

document.addEventListener('click', (evento) => {
  if (!evento.target.closest('.selector-contenedor')) {
    cerrarSelectores();
  }
});

// Cerrar con Escape

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') {
    const fechaAbierta =
      !$('calendario').classList.contains('oculto');

    const horaAbierta =
      !$('lista-horas').classList.contains('oculto');

    if (fechaAbierta || horaAbierta) {
      cerrarSelectores();

      if (fechaAbierta) {
        $('abrir-fecha').focus();
      } else {
        $('abrir-hora').focus();
      }
    }
  }
});

// ---------------------------------------------------
// CALENDARIO PETGO
// ---------------------------------------------------

function dibujarCalendario() {
  const anio = mesVisible.getFullYear();
  const mes = mesVisible.getMonth();

  $('mes-actual').textContent =
    formatoMes.format(mesVisible);

  const contenedor = $('calendario-dias');
  contenedor.replaceChildren();

  const hoy = fechaLocal();

  const mesActual = new Date();
  mesActual.setDate(1);

  const puedeRetroceder =
    anio > mesActual.getFullYear() ||
    (
      anio === mesActual.getFullYear() &&
      mes > mesActual.getMonth()
    );

  $('mes-anterior').disabled = !puedeRetroceder;

  const primerDia = new Date(anio, mes, 1);
  const cantidadDias = new Date(anio, mes + 1, 0).getDate();

  // Lunes = 0, domingo = 6
  const espacios = (primerDia.getDay() + 6) % 7;

  for (let i = 0; i < espacios; i++) {
    const vacio = document.createElement('span');
    vacio.className = 'dia-vacio';
    contenedor.appendChild(vacio);
  }

  for (let dia = 1; dia <= cantidadDias; dia++) {
    const fecha = fechaLocal(
      new Date(anio, mes, dia)
    );

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'dia';
    boton.textContent = dia;

    if (fecha < hoy) {
      boton.disabled = true;
    }

    if (fecha === hoy) {
      boton.classList.add('hoy');
    }

    if (fecha === estado.fecha) {
      boton.classList.add('seleccionado');
    }

    boton.setAttribute(
      'aria-label',
      fechaBonita(fecha)
    );

    boton.setAttribute(
      'aria-pressed',
      String(fecha === estado.fecha)
    );

    boton.addEventListener('click', () => {
      seleccionarFecha(fecha);
    });

    contenedor.appendChild(boton);
  }
}

function seleccionarFecha(fecha) {
  estado.fecha = fecha;

  $('texto-fecha').textContent = fechaBonita(fecha);
  $('texto-fecha').classList.add('elegido');

  // Evitar conservar una hora pasada si cambia la fecha.
  if (estado.hora && !fechaYHoraFuturas()) {
    estado.hora = '';
    $('texto-hora').textContent = 'Seleccionar hora';
    $('texto-hora').classList.remove('elegido');
  }

  $('mensaje-2').textContent = '';

  cerrarSelectores();
}

$('mes-anterior').addEventListener('click', () => {
  mesVisible = new Date(
    mesVisible.getFullYear(),
    mesVisible.getMonth() - 1,
    1,
    12
  );

  dibujarCalendario();
});

$('mes-siguiente').addEventListener('click', () => {
  mesVisible = new Date(
    mesVisible.getFullYear(),
    mesVisible.getMonth() + 1,
    1,
    12
  );

  dibujarCalendario();
});

$('elegir-hoy').addEventListener('click', () => {
  seleccionarFecha(fechaLocal());
});

// ---------------------------------------------------
// SELECTOR DE HORA PETGO
// ---------------------------------------------------

function dibujarHoras() {
  const contenedor = $('lista-horas');
  contenedor.replaceChildren();

  // Horas preferidas cada 30 minutos; NO equivalen a disponibilidad real.
  for (let hora = 0; hora < 24; hora++) {
    for (const minuto of [0, 30]) {
      const valor =
        `${String(hora).padStart(2, '0')}:` +
        `${String(minuto).padStart(2, '0')}`;

      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'hora-opcion';
      boton.textContent = horaBonita(valor);

      boton.setAttribute('role', 'option');
      boton.setAttribute(
        'aria-selected',
        String(valor === estado.hora)
      );

      if (valor === estado.hora) {
        boton.classList.add('seleccionada');
      }

      boton.addEventListener('click', () => {
        estado.hora = valor;

        $('texto-hora').textContent = horaBonita(valor);
        $('texto-hora').classList.add('elegido');

        $('mensaje-2').textContent = '';

        cerrarSelectores();
      });

      contenedor.appendChild(boton);
    }
  }
}

// ---------------------------------------------------
// REVISAR SOLICITUD
// ---------------------------------------------------

$('siguiente-2').addEventListener('click', () => {
  const mascota = $('mascota').value;
  const opcionMascota = [...$('mascota').options].find(opcion =>
    opcion.value === mascota && opcion.value !== ''
  );

  if (!opcionMascota || !estado.fecha || !estado.hora) {
    $('mensaje-2').textContent =
      'Selecciona una mascota registrada, fecha y hora.';
    return;
  }
  estado.mascota = mascota;

  if (!fechaYHoraFuturas()) {
    $('mensaje-2').textContent =
      'Selecciona una fecha y una hora futuras.';
    return;
  }

  $('mensaje-2').textContent = '';

  $('resumen-servicio').textContent =
    nombresServicios[estado.servicio];

  const opcionElegida = (opciones[estado.servicio] || []).find(
    (opcion) => opcion.valor === estado.modalidad
  );

  $('resumen-modalidad').textContent =
    opcionElegida?.texto || '—';

  $('resumen-mascota').textContent = opcionMascota.textContent;
  $('resumen-fecha').textContent =
    fechaBonita(estado.fecha);

  $('resumen-hora').textContent =
    horaBonita(estado.hora);

  $('mensaje-final').textContent = '';

  mostrarPaso(3);
});

$('anterior-3').addEventListener('click', () => {
  mostrarPaso(2);
});

let mascotasCargadas = false;
let enviando = false;

async function cargarMascotas() {
  if (mascotasCargadas) return;
  const selector = $('mascota');
  selector.disabled = true;
  selector.replaceChildren(new Option('Cargando tus mascotas...', ''));
  try {
    const response = await fetch('/api/pets', { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401) {
      window.location.replace('/login.html');
      return;
    }
    const data = await response.json();
    if (!response.ok || !data.success || !Array.isArray(data.pets)) {
      throw new Error(data.error || 'No se pudieron consultar tus mascotas.');
    }
    selector.replaceChildren(new Option('Selecciona una mascota', ''));
    for (const pet of data.pets) {
      selector.add(new Option(`${pet.nombre} (${pet.especie})`, pet.id));
    }
    mascotasCargadas = true;
    selector.disabled = data.pets.length === 0;
    $('mensaje-2').textContent = data.pets.length
      ? ''
      : 'Primero registra una mascota desde Mis mascotas.';
  } catch (error) {
    $('mensaje-2').textContent = error instanceof TypeError
      ? 'No hay conexión con la API de PetGo.' : error.message;
  }
}

$('finalizar').addEventListener('click', async () => {
  if (enviando) return;
  if (!fechaYHoraFuturas() || !estado.mascota || !estado.modalidad) {
    $('mensaje-final').textContent = 'Verifica los datos antes de enviar.';
    return;
  }
  const [year, month, day] = estado.fecha.split('-').map(Number);
  const [hour, minute] = estado.hora.split(':').map(Number);
  const requestedDate = new Date(year, month - 1, day, hour, minute);
  if (requestedDate.getFullYear() !== year || requestedDate.getMonth() !== month - 1 ||
      requestedDate.getDate() !== day || requestedDate.getHours() !== hour ||
      requestedDate.getMinutes() !== minute) {
    $('mensaje-final').textContent = 'La fecha u hora seleccionada no es válida.';
    return;
  }
  const button = $('finalizar');
  enviando = true;
  button.disabled = true;
  button.textContent = 'Enviando solicitud...';
  $('mensaje-final').textContent = '';
  try {
    const response = await fetch('/api/reservations', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pet_id: estado.mascota,
        service_variant_id: estado.modalidad,
        scheduled_at: requestedDate.toISOString()
      })
    });
    if (response.status === 401) {
      window.location.replace('/login.html');
      return;
    }
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'No se pudo guardar la solicitud.');
    $('mensaje-final').textContent = '¡Solicitud registrada! Está pendiente de confirmación. Consulta su estado en Mis reservas.';
    // La solicitud ya se guardó: el usuario no debe volver a enviarla
    // ni regresar a los pasos anteriores desde esta pantalla.
    button.closest('.acciones').classList.add('oculto');
    const link = document.createElement('a');
    link.href = '/reservas.html';
    link.textContent = 'Ver mis reservas →';
    link.className = 'boton-secundario';
    link.style.marginTop = '12px';
    $('mensaje-final').insertAdjacentElement('afterend', link);
  } catch (error) {
    $('mensaje-final').textContent = error instanceof TypeError
      ? 'No hay conexión con la API de PetGo.' : error.message;
    button.disabled = false;
    button.textContent = 'Enviar solicitud de reserva';
    enviando = false;
  }
});

// Catálogo y mascotas se cargan exclusivamente desde nuestra API.
cargarCatalogo();
