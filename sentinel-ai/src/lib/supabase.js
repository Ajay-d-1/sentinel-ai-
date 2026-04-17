import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Check .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { enabled: true },
  db: { schema: 'public' },
})