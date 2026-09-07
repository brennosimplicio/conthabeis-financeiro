const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabaseUrl = 'https://eimerlltnyoymshivbix.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbWVybGx0bnlveW1zaGl2Yml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NDIyMTUsImV4cCI6MjEwNDMxODIxNX0.MJxcUXsCgKXwIYBt0g65FniHUEnpYxGDOkbFoL0CsIM';
const supabase = createClient(supabaseUrl, supabaseKey);

const dbPath = path.join(__dirname, '..', 'data', 'conthabeis.db');
const db = new Database(dbPath);

async function migrate() {
  const tables = [
    'socios', 'clientes', 'split_socios', 'campos_cliente', 'valores_campos_cliente',
    'despesas', 'recebimentos_mensais', 'pagamentos_mensais', 'receitas_extras'
  ];

  for (const table of tables) {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    if (rows.length > 0) {
      console.log(`Migrating ${rows.length} rows to ${table}...`);
      // Upload in chunks of 100 to avoid limits
      for (let i = 0; i < rows.length; i += 100) {
        const chunk = rows.slice(i, i + 100);
        const { data, error } = await supabase.from(table).insert(chunk);
        if (error) {
          console.error(`Error migrating ${table}:`, error);
        }
      }
    }
  }
  console.log('Migration complete!');
}

migrate();
