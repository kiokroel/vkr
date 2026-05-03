import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import OperationsPage from './pages/OperationsPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import ChartsPage from './pages/ChartsPage.jsx'
import AdminPage from './pages/AdminPage.jsx'
import AppLayout from './components/AppLayout.jsx'
import { getMe } from './api/users.js'
import { isAuthenticated } from './auth/token.js'

function RequireAuth({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  return children
}

function RequireAdmin({ children }) {
  const [isAdmin, setIsAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const user = await getMe()
        setIsAdmin(user.is_admin)
      } catch {
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>
  if (!isAdmin) return <Navigate to="/profile" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/profile" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/operations" element={<OperationsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/charts" element={<ChartsPage />} />
        <Route path="/admin" element={
          <RequireAdmin>
            <AdminPage />
          </RequireAdmin>
        } />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
