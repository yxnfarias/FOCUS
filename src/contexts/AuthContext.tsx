import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { db, type User } from '../db'
import { hashPassword } from '../lib/crypto'

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

const STORAGE_KEY = 'focus_user_id'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      db.users.get(parseInt(stored)).then(u => {
        setUser(u ?? null)
        setReady(true)
      })
    } else {
      setReady(true)
    }
  }, [])

  async function login(email: string, password: string) {
    const hash = await hashPassword(password)
    const u = await db.users.where('email').equals(email.toLowerCase().trim()).first()
    if (!u || u.passwordHash !== hash) throw new Error('E-mail ou senha incorretos.')
    localStorage.setItem(STORAGE_KEY, String(u.id))
    setUser(u)
  }

  async function register(name: string, email: string, password: string) {
    const existing = await db.users.where('email').equals(email.toLowerCase().trim()).first()
    if (existing) throw new Error('Este e-mail já está cadastrado.')
    const hash = await hashPassword(password)
    const id = await db.users.add({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    })
    const u = await db.users.get(id as number)
    localStorage.setItem(STORAGE_KEY, String(id))
    setUser(u!)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  if (!ready) return null

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
