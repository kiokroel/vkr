import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMe } from '../api/users.js'
import { clearAccessToken } from '../auth/token.js'
import UserMenu from '../components/UserMenu.jsx'

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="page-title">Профиль</h1>
          <Link to="/operations">Операции</Link>
        </div>
        <UserMenu username={me?.username} onLogout={logout} showProfileLink />
      </div>

      <div className="surface">
        {loading ? <p className="muted">Загрузка...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}

        {me ? <pre className="json-view">{JSON.stringify(me, null, 2)}</pre> : null}

        <button onClick={load} className="btn btn-primary" style={{ marginTop: 14 }}>
          Обновить
        </button>
      </div>
    </div>
  )
}
