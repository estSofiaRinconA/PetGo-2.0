
const supabase = require('../database/supabase');

async function getActiveServices() {
  const { data, error } = await supabase
    .from('services')
    .select('id, nombre, slug, descripcion, imagen_path')
    .eq('activo', true)
    .order('nombre');

  if (error) {
    throw new Error('No se pudo consultar el catálogo');
  }

  return data;
}

module.exports = {
  getActiveServices
};
