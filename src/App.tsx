import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { Dashboard } from './modules/dashboard/Dashboard'
import { Finances } from './modules/finances/Finances'
import { Habits } from './modules/habits/Habits'
import { Tasks } from './modules/tasks/Tasks'
import { Wishlist } from './modules/wishlist/Wishlist'

export default function App() {
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
