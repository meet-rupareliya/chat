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

async function listProfilesAndMessages() {
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  console.log('Profiles in DB:', profiles);
  if (pError) console.error('Profiles error:', pError);

  const { data: messages, error: mError } = await supabase.from('messages').select('*');
  console.log('Messages in DB:', messages);
  if (mError) console.error('Messages error:', mError);
}

listProfilesAndMessages();
