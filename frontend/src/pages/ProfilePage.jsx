import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe } from '../api/users.js'
import { clearAccessToken } from '../auth/token.js'
import { Link } from 'react-router-dom'

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
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0 }}>Профиль</h1>
          <Link to="/operations">Операции</Link>
        </div>
        <button onClick={logout} style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', background: '#fff' }}>
          Выйти
        </button>
      </div>

      {loading ? <p>Загрузка...</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      {me ? (
        <pre style={{ padding: 12, borderRadius: 8, background: '#f6f6f6', overflow: 'auto' }}>
          {JSON.stringify(me, null, 2)}
        </pre>
      ) : null}

      <button
        onClick={load}
        style={{ marginTop: 12, padding: 10, borderRadius: 8, border: '1px solid #111', background: '#111', color: '#fff' }}
      >
        Обновить
      </button>
    </div>
  )
}
