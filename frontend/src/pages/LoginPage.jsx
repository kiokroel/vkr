import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatApiError } from '../api/error.js'
import { loginUser } from '../api/users.js'
import { isAuthenticated, setAccessToken } from '../auth/token.js'

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
    <div className="page page-auth">
      <div className="surface">
        <h1 className="page-title">Вход</h1>
        <form onSubmit={onSubmit} className="stack" style={{ marginTop: 14 }}>
          <label className="field">
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label className="field">
            Пароль
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>
          {error ? <div className="error-text">{error}</div> : null}
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 12 }}>
          Нет аккаунта? <Link to="/register">Регистрация</Link>
        </p>
      </div>
    </div>
  )
}
