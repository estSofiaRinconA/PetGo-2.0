
// ==================================================
// PETGO 2.0 — MIS RESERVAS
// Vista visual sin conexión a la base de datos
// ==================================================

const estadoCargando = document.getElementById(
  'estado-cargando'
);

const estadoVacio = document.getElementById(
  'estado-vacio'
);

const estadoError = document.getElementById(
  'estado-error'
);

const listaReservas = document.getElementById(
  'lista-reservas'
);

function mostrarEstado(estado) {
  estadoCargando.classList.toggle(
    'oculto',
    estado !== 'cargando'
  );

  estadoVacio.classList.toggle(
    'oculto',
    estado !== 'vacio'
  );

  estadoError.classList.toggle(
    'oculto',
    estado !== 'error'
  );

  listaReservas.classList.toggle(
    'oculto',
    estado !== 'lista'
  );
}

// Por ahora mostramos una pantalla de demostración.
// No consultamos Supabase ni creamos reservas ficticias.

mostrarEstado('vacio');
