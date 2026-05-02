import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import OperationsPage from './pages/OperationsPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import ChartsPage from './pages/ChartsPage.jsx'
import AppLayout from './components/AppLayout.jsx'
import { isAuthenticated } from './auth/token.js'

function RequireAuth({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
