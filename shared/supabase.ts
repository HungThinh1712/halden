import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function createSupabase(url?: string, key?: string): SupabaseClient | null {
  const projectUrl = url?.trim() ?? ''
  const anonKey = key?.trim() ?? ''
  const placeholder = projectUrl.includes('your-project') || anonKey.includes('your-anon')
  if (!projectUrl.startsWith('http') || anonKey.length < 20 || placeholder) return null
  return createClient(projectUrl, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}
