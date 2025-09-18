import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = join(__dirname, '../.env');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (value) {
          envVars[key.trim()] = value.replace(/^["']|["']$/g, ''); // Remove quotes
        }
      }
    });

    return envVars;
  } catch (error) {
    console.error('❌ Error loading .env file:', error.message);
    return {};
  }
}

const envVars = loadEnv();
const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAdminAccess() {
  try {
    console.log('🔍 Checking admin access for admin@zedwriter.com...');

    // First, let's see what users exist
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, created_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log('📋 Current users in database:');
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - Created: ${new Date(user.created_at).toLocaleDateString()}`);
      });
    } else {
      console.log('  No users found');
    }

    // Check if admin@zedwriter.com exists
    const adminUser = users?.find(user => user.email === 'admin@zedwriter.com');

    if (adminUser) {
      console.log('\n👤 Admin user details:');
      console.log(`  Email: ${adminUser.email}`);
      console.log(`  Role: ${adminUser.role}`);
      console.log(`  Name: ${adminUser.first_name} ${adminUser.last_name}`);
      console.log(`  ID: ${adminUser.id}`);

      if (adminUser.role === 'admin') {
        console.log('✅ Admin role is correctly set!');
        console.log('💡 If access is still denied, check:');
        console.log('   1. User is logged in with correct account');
        console.log('   2. JWT token is valid');
        console.log('   3. Server logs for authentication errors');
      } else {
        console.log('❌ Admin role is NOT set (current role:', adminUser.role, ')');
        console.log('🔧 Setting admin role...');

        // Update the user's role to admin
        const { data, error } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('email', 'admin@zedwriter.com')
          .select();

        if (error) {
          console.error('❌ Error updating user role:', error);
        } else if (data && data.length > 0) {
          console.log('✅ Successfully set admin role!');
          console.log('👤 Updated user details:', {
            id: data[0].id,
            email: data[0].email,
            role: data[0].role
          });
        }
      }
    } else {
      console.log('\n⚠️  admin@zedwriter.com not found in database');
      console.log('💡 The user needs to sign up first:');
      console.log('🔗 Visit: http://localhost:5173/auth/signup');
      console.log('📧 Sign up with email: admin@zedwriter.com');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the script
checkAdminAccess();
