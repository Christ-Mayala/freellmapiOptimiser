import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { apiFetch } from '@/lib/api'

interface User {
  id: string
  _id?: string
  name: string
  nom?: string
  email: string
  avatarUrl?: string | null
  avatarPublicId?: string | null
  role?: string
  subtype?: string | null
  isPremium?: boolean
  premiumUntil?: string | null
  premiumPlan?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  label?: string
  slug?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  loading: boolean
}

interface LoginResponse {
  token: string
  user: User
}

interface RegisterResponse {
  token: string
  user: User
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [token])

  const checkAuth = async () => {
    try {
      const data = await apiFetch<User>('/api/user/profile')
      setUser(data)
    } catch (err) {
      console.error('Auth check failed:', err)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const data = await apiFetch<LoginResponse>('/api/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(data.token)
    localStorage.setItem('auth_token', data.token)
    setUser(data.user)
  }

  const register = async (name: string, email: string, password: string) => {
    const data = await apiFetch<RegisterResponse>('/api/user/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    setToken(data.token)
    localStorage.setItem('auth_token', data.token)
    setUser(data.user)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
  }

  const updateUser = (newUser: User) => {
    setUser(newUser)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export type { User }
