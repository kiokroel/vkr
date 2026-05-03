import { useEffect, useState } from 'react'
import { formatApiError } from '../api/error.js'
import { 
  getAllUsers, 
  deleteUser, 
  toggleAdminStatus, 
  getUsersStats, 
  getSystemStats 
} from '../api/admin.js'

const moneyFormatter = new Intl.NumberFormat('ru-RU')

function formatMoney(value) {
  return `${moneyFormatter.format(Math.round(Number(value) || 0))} ₽`
}

function formatDate(dateString) {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleDateString('ru-RU')
  } catch {
    return dateString
  }
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [usersStats, setUsersStats] = useState(null)
  const [systemStats, setSystemStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  useEffect(() => {
    loadData()
  }, [activeTab])

  async function loadData() {
    setError('')
    setActionError('')
    setLoading(true)
    try {
      if (activeTab === 'users') {
        const [usersData, statsData] = await Promise.all([
          getAllUsers(),
          getUsersStats()
        ])
        setUsers(usersData)
        setUsersStats(statsData)
      } else if (activeTab === 'analytics') {
        const data = await getSystemStats()
        setSystemStats(data)
      }
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(userId) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return
    
    setDeletingId(userId)
    setActionError('')
    try {
      await deleteUser(userId)
      setUsers(users.filter(u => u.id !== userId))
    } catch (err) {
      setActionError(formatApiError(err))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggleAdmin(userId, currentStatus) {
    setTogglingId(userId)
    setActionError('')
    try {
      const updated = await toggleAdminStatus(userId, !currentStatus)
      setUsers(users.map(u => u.id === updated.id ? updated : u))
    } catch (err) {
      setActionError(formatApiError(err))
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Администрирование</h1>
      </div>

      <div className="tabs" style={{ marginTop: 16, marginBottom: 24 }}>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Пользователи
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Аналитика системы
        </button>
      </div>

      {actionError && (
        <div className="error-message" style={{ marginBottom: 16 }}>
          {actionError}
        </div>
      )}

      {loading && <p className="muted">Загрузка...</p>}
      {error && <p className="error-text">{error}</p>}

      {/* Вкладка Пользователи */}
      {!loading && activeTab === 'users' && (
        <div className="stack">
          {usersStats && (
            <div className="surface" style={{ padding: 16 }}>
              <div className="profile-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="profile-item">
                  <div className="profile-label">Всего пользователей</div>
                  <div className="profile-value">{usersStats.total_users}</div>
                </div>
                <div className="profile-item">
                  <div className="profile-label">Администраторов</div>
                  <div className="profile-value" style={{ color: 'var(--primary)' }}>
                    {usersStats.total_admins}
                  </div>
                </div>
                <div className="profile-item">
                  <div className="profile-label">Обычных пользователей</div>
                  <div className="profile-value">{usersStats.regular_users}</div>
                </div>
              </div>
            </div>
          )}

          <div className="surface" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Статус</th>
                  <th>Дата регистрации</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{user.username}</div>
                      {user.bio && (
                        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                          {user.bio}
                        </div>
                      )}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      {user.is_admin ? (
                        <span style={{ 
                          color: 'var(--primary)', 
                          fontWeight: 600,
                          background: 'var(--primary-light)',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12
                        }}>
                          Админ
                        </span>
                      ) : (
                        <span className="muted">Пользователь</span>
                      )}
                    </td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn-small"
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          disabled={togglingId === user.id}
                          style={{ 
                            background: user.is_admin ? 'var(--danger-light)' : 'var(--primary-light)',
                            color: user.is_admin ? 'var(--danger)' : 'var(--primary)'
                          }}
                        >
                          {togglingId === user.id ? '...' : (user.is_admin ? 'Снять админа' : 'Сделать админом')}
                        </button>
                        <button
                          className="btn-small"
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}
                        >
                          {deletingId === user.id ? '...' : 'Удалить'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Вкладка Аналитика */}
      {!loading && activeTab === 'analytics' && systemStats && (
        <div className="stack">
          {/* Пользователи */}
          <div className="surface">
            <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Пользователи</h2>
            <div className="profile-grid">
              <div className="profile-item">
                <div className="profile-label">Всего</div>
                <div className="profile-value">{systemStats.users.total}</div>
              </div>
              <div className="profile-item">
                <div className="profile-label">Администраторов</div>
                <div className="profile-value" style={{ color: 'var(--primary)' }}>
                  {systemStats.users.admins}
                </div>
              </div>
              <div className="profile-item">
                <div className="profile-label">Активны сегодня</div>
                <div className="profile-value" style={{ color: 'var(--success)' }}>
                  {systemStats.users.active_today}
                </div>
              </div>
            </div>
          </div>

          {/* Операции */}
          <div className="surface">
            <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Операции</h2>
            <div className="profile-grid">
              <div className="profile-item">
                <div className="profile-label">Всего операций</div>
                <div className="profile-value">{systemStats.operations.total_operations}</div>
              </div>
              <div className="profile-item">
                <div className="profile-label">Доходы (кол-во)</div>
                <div className="profile-value" style={{ color: 'var(--primary)' }}>
                  {systemStats.operations.income_operations}
                </div>
              </div>
              <div className="profile-item">
                <div className="profile-label">Расходы (кол-во)</div>
                <div className="profile-value" style={{ color: 'var(--danger)' }}>
                  {systemStats.operations.expense_operations}
                </div>
              </div>
              <div className="profile-item">
                <div className="profile-label">Общий доход</div>
                <div className="profile-value" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                  {formatMoney(systemStats.operations.total_income_amount)}
                </div>
              </div>
              <div className="profile-item">
                <div className="profile-label">Общий расход</div>
                <div className="profile-value" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                  {formatMoney(systemStats.operations.total_expense_amount)}
                </div>
              </div>
            </div>
          </div>

          {/* Месячная статистика */}
          <div className="surface">
            <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Статистика по месяцам</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Месяц</th>
                  <th>Операций</th>
                  <th>Активных пользователей</th>
                  <th>Доходы</th>
                  <th>Расходы</th>
                </tr>
              </thead>
              <tbody>
                {systemStats.monthly_stats.map((stat, i) => (
                  <tr key={i}>
                    <td>{stat.month}</td>
                    <td>{stat.operation_count}</td>
                    <td>{stat.active_users}</td>
                    <td style={{ color: 'var(--primary)' }}>{formatMoney(stat.income)}</td>
                    <td style={{ color: 'var(--danger)' }}>{formatMoney(stat.expense)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
