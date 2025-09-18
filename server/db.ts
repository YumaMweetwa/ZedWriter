import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';

// Check if DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { 
  max: 10, // Maximum connections in pool
  ssl: process.env.NODE_ENV === 'production' ? 'require' : 'prefer',
  connect_timeout: 30,
  idle_timeout: 20,
  max_lifetime: 60 * 30
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export the postgres client for raw SQL queries
export const pgClient = client;

// Test connection
export async function testConnection() {
  try {
    console.log('Testing Supabase database connection...');
    const result = await client`SELECT version()`;
    console.log('✅ Supabase database connection successful!');
    console.log('PostgreSQL version:', result[0].version);
    return true;
  } catch (error) {
    console.error('❌ Supabase database connection failed:', error);
    console.log('⚠️  Application will continue without database connectivity');
    return false;
  }
}

export { schema };