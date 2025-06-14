import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wgmdlkpnfgamzmafolyn.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnbWRsa3BuZmdhbXptYWZvbHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NzU2MjksImV4cCI6MjA2NTQ1MTYyOX0.H7RP4MsA1KaArGu78wk4Mg6uZTqMC9Z_iStSgDzN91Q'

console.log('🔍 Debug Supabase Config:')
console.log('URL:', supabaseUrl)
console.log('Key exists:', !!supabaseAnonKey)
console.log('Key length:', supabaseAnonKey?.length)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      'x-client-info': 'rank-lol-app@1.0.0'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

// Conexão será testada apenas quando necessário
// Remover teste automático para evitar rate limiting

// Types para TypeScript
export interface DatabasePlayer {
  id: string
  name: string
  avatar: string
  total_rating: number
  total_matches: number
  average_rating: number
  total_kills: number
  total_deaths: number
  total_assists: number
  average_kills: number
  average_deaths: number
  average_assists: number
  created_at: string
  updated_at: string
}

export interface DatabaseMatch {
  id: string
  match_date: string
  created_at: string
}

export interface DatabaseMatchParticipant {
  id: string
  match_id: string
  player_id: string
  rating: number
  kills: number
  deaths: number
  assists: number
  lane: string
  created_at: string
} 