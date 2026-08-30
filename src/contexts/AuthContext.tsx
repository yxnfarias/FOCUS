import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface AppUser {
  id: string
  name: string
  email: string
}

interface AuthContextValue {
  user: AppUser | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

async function fetchProfile(supabaseUser: SupabaseUser): Promise<AppUser> {
  const { data } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', supabaseUser.id)
    .single()
  return {
    id: supabaseUser.id,
    name: data?.name ?? (supabaseUser.user_metadata?.name as string) ?? supabaseUser.email ?? '',
    email: supabaseUser.email ?? '',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(await fetchProfile(session.user))
      }
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(await fetchProfile(session.user))
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('E-mail ou senha incorretos.')
  }

  async function register(name: string, email: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        throw new Error('Este e-mail já está cadastrado.')
      }
      if (msg.includes('database error saving new user')) {
        throw new Error('Erro ao criar conta. Tente novamente em instantes.')
      }
      throw new Error(error.message)
    }
  }

  function logout() {
    supabase.auth.signOut().then(() => setUser(null))
  }

  if (!ready) return null
  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>
}
