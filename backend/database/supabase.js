
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const schema = process.env.SUPABASE_SCHEMA || 'petgo_v2';

if (!url || !secretKey) {
  throw new Error(
    'Falta configurar SUPABASE_URL o SUPABASE_SECRET_KEY'
  );
}

const supabase = createClient(url, secretKey, {
  db: {
    schema
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

module.exports = supabase;
