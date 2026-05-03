import { NavLink, useNavigate } from 'react-router-dom'
import { clearAccessToken } from '../auth/token.js'
import UserMenu from './UserMenu.jsx'

export default function AppHeader({ username, isAdmin }) {
  const navigate = useNavigate()

  function logout() {
    clearAccessToken()
    navigate('/login', { replace: true })
  }

  return (
    <header className="app-header">
      <div className="app-header-left">
        <NavLink to="/profile" className="app-logo">
          VKR Finance
        </NavLink>
        <nav className="app-nav">
          <NavLink to="/operations" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Операции
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Аналитика
          </NavLink>
          <NavLink to="/charts" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Диаграммы
          </NavLink>
          {isAdmin && (
            <NavLink 
              to="/admin" 
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              style={{ color: 'var(--primary)', fontWeight: 600 }}
            >
              Админка
            </NavLink>
          )}
        </nav>
      </div>
      <UserMenu username={username} onLogout={logout} showProfileLink />
    </header>
  )
}
