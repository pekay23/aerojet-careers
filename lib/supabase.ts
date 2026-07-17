'use client'

import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client.
 * Refactored to ensure environment variables are correctly inlined by Next.js
 * and provide descriptive error messages for missing configuration.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  // We throw a descriptive error that helps the user identify EXACTLY what's missing
  const missing = [
    !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
    !supabaseKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter(Boolean)
  
  console.error(`[Supabase] Initialization Error: Missing environment variables: ${missing.join(', ')}`)
}

// Singleton instance to prevent multiple GoTrueClient warnings
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
