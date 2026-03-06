import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatApiError } from '../api/error.js'
import { registerUser } from '../api/users.js'
import { isAuthenticated } from '../auth/token.js'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
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
      await registerUser({ email, username, password })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page-auth">
      <div className="surface">
        <h1 className="page-title">Регистрация</h1>
        <form onSubmit={onSubmit} className="stack" style={{ marginTop: 14 }}>
          <label className="field">
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label className="field">
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" required />
          </label>
          <label className="field">
            Пароль
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>
          {error ? <div className="error-text">{error}</div> : null}
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Создаём...' : 'Создать аккаунт'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 12 }}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  )
}
