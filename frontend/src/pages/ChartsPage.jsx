import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { getAnalyticsOverview } from '../api/analytics.js'
import { formatApiError } from '../api/error.js'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#F95D6A', '#2F4B7C']

const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'short', year: '2-digit' })
const moneyFormatter = new Intl.NumberFormat('ru-RU')

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

export default function ChartsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setError('')
      setLoading(true)
      try {
        const result = await getAnalyticsOverview({ history_months: 12 })
        setData(result)
      } catch (err) {
        setError(formatApiError(err))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading && !data) {
    return <div className="page"><p className="muted">Загрузка диаграмм...</p></div>
  }

  if (error) {
    return <div className="page"><p className="error-text">{error}</p></div>
  }

  const historyData = (data?.history || []).map(row => ({
    name: formatMonth(row.month),
    Доходы: row.income || 0,
    Расходы: row.expenses || 0
  }))

  const categoriesData = (data?.categories || [])
    .filter(cat => cat.predicted_amount > 0)
    .map(cat => ({
      name: cat.category_name || 'Без категории',
      value: cat.predicted_amount
    }))

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Диаграммы</h1>
      </div>

      <div className="stack" style={{ marginTop: 24 }}>
        
        {/* Круговая диаграмма (Pie Chart) */}
        <div className="surface">
          <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Прогноз расходов по категориям (круговая диаграмма)</h2>
          {categoriesData.length > 0 ? (
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoriesData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="muted">Нет данных для круговой диаграммы по категориям.</p>
          )}
        </div>

        {/* Линейный график (Line Chart) */}
        <div className="surface">
          <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Динамика доходов и расходов (линейный график)</h2>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => moneyFormatter.format(value)} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatMoney(value)} />
                <Legend />
                <Line type="monotone" dataKey="Доходы" stroke="#00C49F" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Расходы" stroke="#F95D6A" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Столбчатый график (Bar Chart) */}
        <div className="surface">
          <h2 style={{ margin: '0 0 16px', fontSize: 20 }}>Сравнение доходов и расходов (столбчатый график)</h2>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => moneyFormatter.format(value)} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatMoney(value)} cursor={{ fill: '#f5f5f5' }} />
                <Legend />
                <Bar dataKey="Доходы" fill="#00C49F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Расходы" fill="#F95D6A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
