// Este archivo crea la conexión a Supabase usando las credenciales
// que guardaste en el archivo .env (o en las variables de entorno de Render)
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Faltan las variables SUPABASE_URL y/o SUPABASE_KEY. Revisa tu archivo .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
