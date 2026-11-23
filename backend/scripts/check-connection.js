
// =====================================================
// PETGO 2.0 - COMPROBAR CONEXION
// No crea, edita ni elimina datos
// =====================================================

const {
  supabaseAdmin
} = require('../database/supabase');

async function comprobarConexion() {
  console.log('Comprobando nuevo Supabase de PetGo...');

  const { data, error } = await supabaseAdmin
    .from('services')
    .select('nombre, slug')
    .order('orden', { ascending: true });

  if (error) {
    console.error(
      'La conexion no pudo verificarse:',
      error.message
    );

    process.exitCode = 1;
    return;
  }

  console.log('Conexion correcta.');

  console.log(
    'Servicios encontrados:',
    data.length
  );

  for (const servicio of data) {
    console.log(`- ${servicio.nombre}`);
  }

  if (data.length !== 2) {
    console.error(
      'Se esperaban 2 categorias de servicios.'
    );
    process.exitCode = 1;
  }
}

comprobarConexion().catch((error) => {
  console.error(
    'Error al comprobar la conexion:',
    error.message
  );

  process.exitCode = 1;
});
