import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppShell } from './layouts/AppShell'
import { Dashboard } from './modules/dashboard/Dashboard'
import { Finances } from './modules/finances/Finances'
import { Habits } from './modules/habits/Habits'
import { Tasks } from './modules/tasks/Tasks'
import { Wishlist } from './modules/wishlist/Wishlist'
import { LoginScreen } from './modules/auth/LoginScreen'

function AppContent() {
  const { user } = useAuth()
  if (!user) return <LoginScreen />
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="financas" element={<Finances />} />
          <Route path="habitos" element={<Habits />} />
          <Route path="tarefas" element={<Tasks />} />
          <Route path="desejos" element={<Wishlist />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
