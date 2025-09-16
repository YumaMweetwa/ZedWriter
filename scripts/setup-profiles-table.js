import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupProfilesTable() {
  console.log('🔧 Setting up profiles table...')
  
  try {
    // Create profiles table if it doesn't exist
    const { error: createTableError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          first_name TEXT,
          last_name TEXT, 
          phone TEXT,
          school TEXT,
          student_id TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles
          FOR SELECT USING (auth.uid() = id);
          
        CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id);
          
        CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
          
        -- Create function to handle new user registration
        CREATE OR REPLACE FUNCTION handle_new_user() 
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO profiles (id, first_name, last_name)
          VALUES (NEW.id, '', '');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        -- Create trigger for new user registration
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION handle_new_user();
      `
    })
    
    if (createTableError) {
      console.error('❌ Error creating table:', createTableError)
      
      // Try alternative method - check if table exists first
      const { data: tables, error: checkError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'profiles')
        .eq('table_schema', 'public')
      
      if (checkError) {
        console.log('ℹ️  Could not check if profiles table exists:', checkError.message)
        console.log('ℹ️  This might be normal if RLS is enabled')
      } else if (tables && tables.length > 0) {
        console.log('✅ Profiles table already exists')
      } else {
        console.log('ℹ️  Profiles table may not exist, but we cannot create it via JavaScript')
        console.log('ℹ️  You may need to create it manually in the Supabase dashboard')
      }
    } else {
      console.log('✅ Profiles table setup complete')
    }
    
    // Test inserting/selecting from profiles table
    const { data: user } = await supabase.auth.getUser()
    if (user?.user) {
      console.log('🧪 Testing profiles table access...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.log('⚠️  Could not access profiles table:', profileError.message)
      } else if (profile) {
        console.log('✅ Profile found:', profile)
      } else {
        console.log('ℹ️  No profile found for current user (this is normal)')
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupProfilesTable()