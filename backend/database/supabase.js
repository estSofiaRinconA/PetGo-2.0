
// =====================================================
// PETGO 2.0 - CONEXION A SUPABASE
// Exclusiva de nuestra API Node.js
// =====================================================

const path = require('node:path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Leer variables desde backend/.env
dotenv.config({
  path: path.join(__dirname, '..', '.env'),
  quiet: true
});

function obtenerVariable(nombre) {
  const valor = process.env[nombre]?.trim();

  if (!valor || valor.includes('REEMPLAZAR')) {
    throw new Error(
      `Falta configurar ${nombre} en backend/.env`
    );
  }

  return valor;
}

const url = obtenerVariable('SUPABASE_URL');

if (!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(url)) {
  throw new Error(
    'SUPABASE_URL no tiene un formato valido'
  );
}

const opciones = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
};

// Cliente para autenticacion mediante la API
const supabaseAuth = createClient(
  url,
  obtenerVariable('SUPABASE_PUBLISHABLE_KEY'),
  opciones
);

// Cliente privilegiado: solo debe utilizarse
// dentro del backend, tras verificar autorizacion.
const supabaseAdmin = createClient(
  url,
  obtenerVariable('SUPABASE_SECRET_KEY'),
  opciones
);

module.exports = {
  supabaseAuth,
  supabaseAdmin
};
