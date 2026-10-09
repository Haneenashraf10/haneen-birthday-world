import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Temporary check: prints only true/false, never the real values
console.log(
  'Supabase env loaded? url:',
  Boolean(supabaseUrl),
  '| key:',
  Boolean(supabaseAnonKey),
)

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null 