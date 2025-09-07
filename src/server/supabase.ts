import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url) {
  console.warn('SUPABASE_URL is not set; Supabase client will be unavailable')
}

const key = serviceRoleKey || anonKey
if (!key) {
  console.warn('Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY is set; Supabase client will be unavailable')
}

export const supabase = url && key
  ? createClient(url, key, {
      auth: { persistSession: false },
    })
  : (null as any)

