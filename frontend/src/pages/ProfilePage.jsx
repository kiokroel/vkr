import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMe } from '../api/users.js'
import { clearAccessToken } from '../auth/token.js'
import UserMenu from '../components/UserMenu.jsx'

function ProfileItem({ label, value }) {
  return (
    <div className="profile-item">
      <div className="profile-label">{label}</div>
      <div className="profile-value">{value || '—'}</div>
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setError('')
    setLoading(true)
    try {
      const data = await getMe()
      setMe(data)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Не удалось загрузить профиль')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function logout() {
    clearAccessToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Профиль</h1>
        <div className="header-actions">
          <Link to="/operations" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Операции
          </Link>
          <UserMenu username={me?.username} onLogout={logout} showProfileLink />
        </div>
      </div>

      <div className="surface">
        {loading ? <p className="muted">Загрузка...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {me ? (
          <div className="profile-grid">
            <ProfileItem label="Имя пользователя" value={me.username} />
            <ProfileItem label="Email" value={me.email} />
            <ProfileItem label="ID пользователя" value={me.id} />
          </div>
        ) : null}

        <button onClick={load} className="btn btn-secondary" style={{ marginTop: 14 }}>
          Обновить данные
        </button>
      </div>
    </div>
  )
}
