import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // This will show up loudly in the browser console if the .env file is missing
  // or the keys weren't filled in. It saves a lot of confusing debugging later.
  console.error(
    'Missing Supabase environment variables. Check that .env exists and contains ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
