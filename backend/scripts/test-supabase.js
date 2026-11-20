
const supabase = require('../database/supabase');

async function testConnection() {
  console.log('Probando conexión con Supabase...');

  const { data, error } = await supabase
    .from('services')
    .select('nombre, slug, activo')
    .order('nombre');

  if (error) {
    console.error('Error de Supabase:', error.message);
    process.exitCode = 1;
    return;
  }

  console.log('Conexión exitosa.');

  console.table(data);
}

testConnection().catch((error) => {
  console.error('Error de conexión:', error.message);
  process.exitCode = 1;
});
