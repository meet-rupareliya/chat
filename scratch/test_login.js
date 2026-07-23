import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val.trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'user2@example.com',
    password: 'password123'
  });
  if (signInError) {
    console.log('SignIn failed:', signInError.message);
    return;
  }
  console.log('Signed in, ID:', signInData.user.id);
  console.log('Session token exists:', !!signInData.session?.access_token);

  // Test: select ALL profiles with no filter at all
  const { data: all, error: allErr, status, statusText } = await supabase
    .from('profiles')
    .select('*');

  console.log('Select ALL status:', status, statusText);
  console.log('Select ALL error:', allErr);
  console.log('Select ALL data:', all);
  console.log('Row count:', all?.length);
}
run();
