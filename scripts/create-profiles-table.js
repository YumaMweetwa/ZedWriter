import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.log('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createProfilesTable() {
  console.log('🚀 Creating profiles table...')
  
  try {
    // Create profiles table
    const createTableQuery = `
      -- Create profiles table
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        first_name TEXT NOT NULL DEFAULT '',
        last_name TEXT NOT NULL DEFAULT '',
        phone TEXT,
        school TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
      DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
      DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

      -- Create RLS policies for users
      CREATE POLICY "Users can view own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);
        
      CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);
        
      CREATE POLICY "Users can insert own profile" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = id);

      -- Create RLS policies for admins
      CREATE POLICY "Admins can view all profiles" ON profiles
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
                 OR auth.users.email = 'admin@zedwriter.com')
          )
        );

      CREATE POLICY "Admins can update all profiles" ON profiles
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
                 OR auth.users.email = 'admin@zedwriter.com')
          )
        );

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

      -- Create updated_at trigger function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create updated_at trigger
      DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
      CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    console.log('📝 Executing SQL...')
    
    // Execute the SQL using rpc
    const { error } = await supabase.rpc('exec', { sql: createTableQuery })
    
    if (error) {
      console.error('❌ Error creating table:', error)
      
      // Alternative: Try individual operations
      console.log('🔄 Trying alternative approach...')
      
      // Just try to create a simple test
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count(*)')
        .limit(1)
      
      if (testError && testError.code === '42P01') {
        console.log('ℹ️  Table does not exist - you may need to create it manually in Supabase dashboard')
        console.log('ℹ️  SQL to run in Supabase SQL Editor:')
        console.log('')
        console.log(createTableQuery)
        console.log('')
      } else if (testError) {
        console.log('⚠️  Table access error:', testError.message)
      } else {
        console.log('✅ Profiles table exists and is accessible')
      }
    } else {
      console.log('✅ Profiles table setup complete!')
    }
    
    // Test table access
    console.log('🧪 Testing table access...')
    const { data: profiles, error: selectError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.log('⚠️  Could not access profiles table:', selectError.message)
      console.log('ℹ️  This might be normal due to RLS policies')
    } else {
      console.log('✅ Table access test successful')
      console.log(`📊 Found ${profiles?.length || 0} existing profiles`)
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    console.log('')
    console.log('🔧 Manual setup instructions:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Run the SQL commands shown above')
  }
}

createProfilesTable()