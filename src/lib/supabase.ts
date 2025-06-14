import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Debug Supabase Config:')
console.log('URL:', supabaseUrl)
console.log('Key exists:', !!supabaseAnonKey)
console.log('Key length:', supabaseAnonKey?.length)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente faltando:', { supabaseUrl, hasKey: !!supabaseAnonKey })
  throw new Error(`Missing Supabase environment variables - URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

// Test connection
console.log('🚀 Testando conexão Supabase...')
supabase.from('players').select('count', { count: 'exact', head: true })
  .then(({ error, count }) => {
    if (error) {
      console.error('❌ Erro na conexão:', error.message)
      console.error('Detalhes:', error)
    } else {
      console.log('✅ Conexão OK - Jogadores encontrados:', count)
    }
  })

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
  created_at: string
} 