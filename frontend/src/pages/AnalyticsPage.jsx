import { useEffect, useState } from 'react'
import { getAnalyticsOverview } from '../api/analytics.js'
import { formatApiError } from '../api/error.js'

const moneyFormatter = new Intl.NumberFormat('ru-RU')
const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })

function formatMoney(value) {
  return `${moneyFormatter.format(Math.round(Number(value) || 0))} ₽`
}

function formatMonth(value) {
  if (!value) return ''
  try {
    const date = new Date(`${value}-01T00:00:00`)
    return monthFormatter.format(date)
  } catch {
    return value
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [historyMonths, setHistoryMonths] = useState(12)

  useEffect(() => {
    async function load() {
      setError('')
      setLoading(true)
      try {
        const result = await getAnalyticsOverview({ history_months: historyMonths })
        setData(result)
      } catch (err) {
        setError(formatApiError(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [historyMonths])

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Аналитика</h1>
        <div className="header-actions">
          <select 
            value={historyMonths} 
            onChange={(e) => setHistoryMonths(Number(e.target.value))}
            style={{ width: 'auto' }}
          >
            <option value={3}>За 3 месяца</option>
            <option value={6}>За 6 месяцев</option>
            <option value={12}>За год</option>
            <option value={24}>За 2 года</option>
          </select>
        </div>
      </div>

      {loading && !data ? <p className="muted" style={{ marginTop: 24 }}>Загрузка аналитики...</p> : null}
      {error ? <p className="error-text" style={{ marginTop: 24 }}>{error}</p> : null}

      {data ? (
        <div className="stack" style={{ marginTop: 24 }}>
          {/* Отчет */}
          <div className="surface">
            <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>Отчет за период</h2>
            <div className="forecast-report" style={{ fontSize: 16 }}>
              <b>{data.report?.summary || 'Нет данных для формирования отчета'}</b>
              {(data.report?.risks || []).map((risk, i) => (
                <span key={i} style={{ color: 'var(--danger)', fontWeight: 600 }}>• {risk}</span>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <div className="surface">
              <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>Текущий месяц ({formatMonth(data.current_month?.month)})</h2>
              <div className="profile-grid">
                <div className="profile-item">
                  <div className="profile-label">Доходы</div>
                  <div className="profile-value" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                    {formatMoney(data.current_month?.income)}
                  </div>
                </div>
                <div className="profile-item">
                  <div className="profile-label">Расходы</div>
                  <div className="profile-value" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                    {formatMoney(data.current_month?.expenses)}
                  </div>
                </div>
                <div className="profile-item">
                  <div className="profile-label">Остаток</div>
                  <div className="profile-value" style={{ fontWeight: 'bold' }}>
                    {formatMoney((data.current_month?.income || 0) - (data.current_month?.expenses || 0))}
                  </div>
                </div>
              </div>
            </div>

            <div className="surface">
              <h2 style={{ margin: '0 0 12px', fontSize: 20 }}>Прогноз ({formatMonth(data.forecast?.month)})</h2>
              <div className="profile-grid">
                <div className="profile-item">
                  <div className="profile-label">Ожидаемые расходы</div>
                  <div className="profile-value" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                    {formatMoney(data.forecast?.predicted_expenses)}
                  </div>
                </div>
                <div className="profile-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="profile-label">Модель и данные</div>
                  <div className="profile-value muted" style={{ fontSize: 13 }}>
                    Алгоритм: {data.forecast?.algorithm} <br/>
                    Обучено: {data.forecast?.trained_at ? new Date(data.forecast.trained_at).toLocaleDateString() : '—'} <br/>
                    {data.forecast?.detail}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Таблица истории */}
          <div className="surface" style={{ overflowX: 'auto' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>История по месяцам</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Месяц</th>
                  <th>Доходы</th>
                  <th>Расходы</th>
                  <th>Остаток</th>
                </tr>
              </thead>
              <tbody>
                {(data.history || []).map((row) => {
                  const balance = (row.income || 0) - (row.expenses || 0)
                  return (
                    <tr key={row.month}>
                      <td style={{ fontWeight: 600 }}>{formatMonth(row.month)}</td>
                      <td style={{ color: 'var(--primary)' }}>{formatMoney(row.income)}</td>
                      <td style={{ color: 'var(--danger)' }}>{formatMoney(row.expenses)}</td>
                      <td style={{ fontWeight: 'bold', color: balance > 0 ? 'var(--primary)' : balance < 0 ? 'var(--danger)' : 'inherit' }}>
                        {formatMoney(balance)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  )
}
