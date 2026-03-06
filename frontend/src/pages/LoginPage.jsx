import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../api/users.js'
import { isAuthenticated, setAccessToken } from '../auth/token.js'
import { formatApiError } from '../api/error.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/profile', { replace: true })
    }
  }, [navigate])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginUser({ email, password })
      setAccessToken(res.access_token)
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Вход</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          Пароль
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
          />
        </label>
        {error ? <div style={{ color: 'crimson', whiteSpace: 'pre-wrap' }}>{error}</div> : null}
        <button
          type="submit"
          disabled={loading}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #111', background: '#111', color: '#fff' }}
        >
          {loading ? 'Входим...' : 'Войти'}
        </button>
      </form>
      <p style={{ marginTop: 12 }}>
        Нет аккаунта? <Link to="/register">Регистрация</Link>
      </p>
    </div>
  )
}
