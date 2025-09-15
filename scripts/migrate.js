import postgres from 'postgres';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Build PostgreSQL connection string from Supabase URL
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  process.exit(1);
}

// Extract database connection details from Supabase URL
const url = new URL(supabaseUrl);
const projectId = url.hostname.split('.')[0];
const dbUrl = `postgresql://postgres:[YOUR-PASSWORD]@db.${projectId}.supabase.co:5432/postgres`;

// For direct connection, we'll use a more direct approach
console.log('🔄 Running database migrations...');
console.log('📝 Please run the following SQL in your Supabase SQL Editor:');
console.log('💡 Go to https://supabase.com/dashboard/project/' + projectId + '/sql');
console.log('');

// Read and display the migration file
const migrationPath = join(__dirname, '../supabase/migrations/20250914225154_zwrite_fixed.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('='.repeat(80));
console.log(migrationSQL);
console.log('='.repeat(80));
console.log('');
console.log('✅ Copy the above SQL and run it in your Supabase SQL Editor');
console.log('🔗 Direct link: https://supabase.com/dashboard/project/' + projectId + '/sql');