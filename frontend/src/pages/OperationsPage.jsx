import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAnalyticsOverview } from '../api/analytics.js'
import { createCategory, listCategories } from '../api/categories.js'
import { formatApiError } from '../api/error.js'
import { createOperation, deleteOperation, listOperations, updateOperation } from '../api/operations.js'
import { getMe } from '../api/users.js'
import { clearAccessToken } from '../auth/token.js'

function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return

    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function CollapsibleSurface({ title, right, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="surface">
      <button type="button" className="surface-toggle" onClick={() => setOpen((prev) => !prev)}>
        <div className="surface-toggle-left">
          <span className="surface-toggle-caret">{open ? '▾' : '▸'}</span>
          <span style={{ fontWeight: 800 }}>{title}</span>
        </div>
        {right ? <div className="surface-toggle-right">{right}</div> : null}
      </button>
      {open ? <div className="surface-content">{children}</div> : null}
    </div>
  )
}

const moneyFormatter = new Intl.NumberFormat('ru-RU')
const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'short', year: '2-digit' })

function normalizeDateValue(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function formatMoney(value) {
  return `${moneyFormatter.format(Math.round(Number(value) || 0))} ₽`
}

function formatMonth(value) {
  if (!value) return ''
  return monthFormatter.format(new Date(`${normalizeDateValue(value)}T00:00:00`)).replace('.', '')
}

function formatAlgorithm(value) {
  if (value === 'random_forest_regressor') return 'Random Forest'
  if (value === 'rolling_mean_3') return 'Среднее за 3 месяца'
  return value || 'Нет данных'
}

function ExpenseForecastPanel({ forecast, loading, error }) {
  const chartData = useMemo(() => {
    if (!forecast) return []
    const history = forecast.history ?? []
    const meaningfulHistory = history.filter((point) => Number(point.amount) > 0).slice(-6)
    const visibleHistory = meaningfulHistory.length ? meaningfulHistory : history.slice(-4)

    return [
      ...visibleHistory.map((point) => ({ ...point, kind: 'history' })),
      {
        month: forecast.current_month,
        amount: forecast.current_month_amount,
        kind: 'current'
      },
      {
        month: forecast.forecast_month,
        amount: forecast.total_predicted_amount,
        kind: 'forecast'
      }
    ]
  }, [forecast])

  if (loading) {
    return (
      <div className="surface">
        <div className="forecast-title">Прогноз расходов</div>
        <p className="muted">Считаем прогноз...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="surface">
        <div className="forecast-title">Прогноз расходов</div>
        <p className="error-text">{error}</p>
      </div>
    )
  }

  if (!forecast || chartData.length <= 1) {
    return (
      <div className="surface">
        <div className="forecast-title">Прогноз расходов</div>
        <p className="muted">Добавьте расходы за несколько месяцев, чтобы увидеть прогноз.</p>
      </div>
    )
  }

  const width = 760
  const height = 260
  const left = 58
  const right = 24
  const top = 28
  const bottom = 46
  const chartWidth = width - left - right
  const chartHeight = height - top - bottom
  const maxAmount = Math.max(...chartData.map((point) => Number(point.amount) || 0), 1)
  const step = chartWidth / chartData.length
  const barWidth = Math.min(42, Math.max(18, step * 0.56))
  const yTicks = [0.25, 0.5, 0.75, 1]

  const previousAmount = forecast.previous_month_amount ?? 0
  const deltaFromPrevious = forecast.total_predicted_amount - previousAmount
  const deltaText = deltaFromPrevious >= 0 ? `+${formatMoney(deltaFromPrevious)}` : formatMoney(deltaFromPrevious)
  const trainedAt = forecast.trained_at ? new Date(forecast.trained_at).toLocaleDateString('ru-RU') : null

  return (
    <div className="surface forecast-panel">
      <div className="forecast-header">
        <div>
          <div className="forecast-title">Прогноз расходов</div>
          <div className="forecast-subtitle">{forecast.detail}</div>
        </div>
        <div className="forecast-badges">
          <div className="chip chip-active">{formatAlgorithm(forecast.algorithm)}</div>
          {trainedAt ? <div className="chip">Обновлено: {trainedAt}</div> : null}
        </div>
      </div>

      <div className="forecast-stats">
        <div className="forecast-stat">
          <span>Последний закрытый</span>
          <b>{formatMoney(previousAmount)}</b>
        </div>
        <div className="forecast-stat">
          <span>Сейчас</span>
          <b>{formatMoney(forecast.current_month_amount)}</b>
        </div>
        <div className="forecast-stat forecast-stat-accent">
          <span>Прогноз на {formatMonth(forecast.forecast_month)}</span>
          <b>{formatMoney(forecast.total_predicted_amount)}</b>
        </div>
        <div className="forecast-stat">
          <span>К прошлому месяцу</span>
          <b className={deltaFromPrevious > 0 ? 'trend-up' : 'trend-down'}>{deltaText}</b>
        </div>
      </div>

      <div className="forecast-chart-wrap">
        <div className="forecast-chart-head">
          <b>Динамика расходов</b>
          <div className="forecast-legend">
            <span><i className="legend-history" /> факт</span>
            <span><i className="legend-current" /> сейчас</span>
            <span><i className="legend-forecast" /> прогноз</span>
          </div>
        </div>

        <svg className="forecast-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="График расходов и прогноза">
          {yTicks.map((tick) => {
            const y = top + chartHeight - chartHeight * tick
            return (
              <g key={tick}>
                <line x1={left} x2={width - right} y1={y} y2={y} className="chart-grid-line" />
                <text x={left - 10} y={y + 4} textAnchor="end" className="chart-axis-text">
                  {moneyFormatter.format(Math.round(maxAmount * tick))}
                </text>
              </g>
            )
          })}

          {chartData.map((point, index) => {
            const amount = Number(point.amount) || 0
            const barHeight = amount > 0 ? Math.max(8, (amount / maxAmount) * chartHeight) : 4
            const x = left + index * step + (step - barWidth) / 2
            const y = top + chartHeight - barHeight
            const isSpecial = point.kind === 'current' || point.kind === 'forecast'
            const barClassName = `chart-bar chart-bar-${point.kind}`
            const isSameMonth = forecast?.current_month && forecast?.forecast_month && forecast.current_month === forecast.forecast_month
            let monthLabel = formatMonth(point.month)
            if (isSameMonth && point.kind === 'current') monthLabel = `${monthLabel} (сейчас)`
            if (isSameMonth && point.kind === 'forecast') monthLabel = `${monthLabel} (прогноз)`

            return (
              <g key={`${point.month}-${point.kind}`}>
                <rect x={x} y={y} width={barWidth} height={barHeight} rx="7" className={barClassName} />
                {isSpecial ? (
                  <text x={x + barWidth / 2} y={Math.max(16, y - 10)} textAnchor="middle" className="chart-forecast-value">
                    {point.kind === 'forecast' ? 'прогноз' : 'сейчас'}
                  </text>
                ) : null}
                <text x={x + barWidth / 2} y={height - 24} textAnchor="middle" className="chart-axis-text">
                  {monthLabel}
                </text>
                <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className="chart-amount-text">
                  {formatMoney(amount)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {forecast.categories?.length ? (
        <div className="forecast-categories">
          <div className="forecast-section-title">Прогноз по категориям</div>
          {forecast.categories.slice(0, 5).map((category, index) => (
            <div key={`${category.category_id ?? 'none'}-${index}`} className="forecast-category-row">
              <div className="forecast-category-main">
                <div>
                  <b>{category.category_name}</b>
                  <span className="muted">Было: {formatMoney(category.previous_month_amount)}</span>
                </div>
                <div className="forecast-category-track">
                  <span style={{ width: `${Math.min(100, (category.predicted_amount / Math.max(forecast.total_predicted_amount, 1)) * 100)}%` }} />
                </div>
              </div>
              <strong>{formatMoney(category.predicted_amount)}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {forecast.report ? (
        <div className="forecast-report">
          <b>{forecast.report.summary}</b>
          {(forecast.report.risks ?? []).map((risk) => (
            <span key={risk}>{risk}</span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function mapOverviewToForecast(overview) {
  const history = (overview.history ?? []).map((point) => ({
    month: point.month,
    amount: point.expenses
  }))
  const previousMonth = history.length ? history[history.length - 1].amount : null

  return {
    forecast_month: overview.forecast.month,
    current_month: overview.current_month.month,
    history,
    categories: overview.categories ?? [],
    total_predicted_amount: overview.forecast.predicted_expenses,
    current_month_amount: overview.current_month.expenses,
    previous_month_amount: previousMonth,
    algorithm: overview.forecast.algorithm,
    trained_at: overview.forecast.trained_at,
    detail: overview.forecast.detail,
    report: overview.report
  }
}

function OperationRow({ op, categories, categoriesById, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [editDate, setEditDate] = useState(normalizeDateValue(op.date))
  const [editAmount, setEditAmount] = useState(String(op.amount ?? ''))
  const [editType, setEditType] = useState(op.type ?? 'expense')
  const [editDescription, setEditDescription] = useState(op.description ?? '')
  const [editCategoryId, setEditCategoryId] = useState(op.category_id ?? '')

  function resetEditState() {
    setEditDate(normalizeDateValue(op.date))
    setEditAmount(String(op.amount ?? ''))
    setEditType(op.type ?? 'expense')
    setEditDescription(op.description ?? '')
    setEditCategoryId(op.category_id ?? '')
  }

  useEffect(() => {
    if (!isEditing) {
      resetEditState()
    }
  }, [op.id, op.date, op.amount, op.type, op.description, op.category_id, isEditing])

  async function onSubmit(e) {
    e.preventDefault()
    const patch = {}

    const originalDate = normalizeDateValue(op.date)
    if (editDate && editDate !== originalDate) patch.date = editDate

    const nextAmount = Number(editAmount)
    const originalAmount = Number(op.amount ?? 0)
    if (!Number.isNaN(nextAmount) && nextAmount !== originalAmount) patch.amount = nextAmount

    const originalType = op.type ?? 'expense'
    if (editType !== originalType) patch.type = editType

    const nextDescription = editDescription.trim() ? editDescription.trim() : null
    const originalDescription = op.description ?? null
    if (nextDescription !== originalDescription) patch.description = nextDescription

    const originalCategoryId = op.category_id ?? ''
    if (editCategoryId !== originalCategoryId) patch.category_id = editCategoryId || null

    if (Object.keys(patch).length === 0) {
      setIsEditing(false)
      return
    }

    setSaveLoading(true)
    try {
      await onUpdate(op.id, patch)
      setIsEditing(false)
    } finally {
      setSaveLoading(false)
    }
  }

  const title = `${op.type === 'income' ? 'Доход' : 'Расход'}: ${op.amount}`
  const categoryName = op.category_id ? categoriesById[op.category_id]?.name ?? op.category_id : '—'
  const subtitle = op.description ? op.description : 'Без описания'

  return (
    <div className="op-card">
      <div className="op-row">
        <div className="op-row-main">
          <div className="op-row-title">{title}</div>
          <div className="op-row-subtitle muted">{subtitle}</div>
          <div className="op-row-meta muted">
            <span>{normalizeDateValue(op.date)}</span>
            <span>Категория: {categoryName}</span>
          </div>
        </div>

        <div className="op-row-actions">
          <button type="button" className="icon-btn icon-btn-primary" onClick={() => setIsEditing(true)} aria-label="Редактировать">
            ✎
          </button>
          <button type="button" className="icon-btn icon-btn-danger" onClick={onDelete} aria-label="Удалить">
            🗑
          </button>
        </div>
      </div>

      <Modal
        open={isEditing}
        title="Редактирование операции"
        onClose={() => {
          setIsEditing(false)
          resetEditState()
        }}
      >
        <form onSubmit={onSubmit} className="grid-3">
          <label className="field">
            Дата
            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
          </label>
          <label className="field">
            Сумма
            <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required />
          </label>
          <label className="field">
            Тип
            <select value={editType} onChange={(e) => setEditType(e.target.value)}>
              <option value="expense">Расход</option>
              <option value="income">Доход</option>
            </select>
          </label>
          <label className="field">
            Категория
            <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)}>
              <option value="">Без категории</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            Описание
            <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, gridColumn: '1 / -1' }}>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                resetEditState()
              }}
              className="btn btn-secondary"
            >
              Отмена
            </button>
            <button type="submit" disabled={saveLoading} className="btn btn-primary">
              {saveLoading ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default function OperationsPage() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [forecast, setForecast] = useState(null)
  const [forecastLoading, setForecastLoading] = useState(true)
  const [forecastError, setForecastError] = useState('')
  const [me, setMe] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  const [createDate, setCreateDate] = useState('')
  const [createAmount, setCreateAmount] = useState('')
  const [createType, setCreateType] = useState('expense')
  const [createDescription, setCreateDescription] = useState('')
  const [createCategoryId, setCreateCategoryId] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [createCategoryLoading, setCreateCategoryLoading] = useState(false)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [type, setType] = useState('')
  const [categoryFilterId, setCategoryFilterId] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  const categoriesById = useMemo(() => Object.fromEntries(categories.map((category) => [category.id, category])), [categories])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (dateFrom) count += 1
    if (dateTo) count += 1
    if (type) count += 1
    if (categoryFilterId) count += 1
    if (minAmount !== '') count += 1
    if (maxAmount !== '') count += 1
    return count
  }, [dateFrom, dateTo, type, categoryFilterId, minAmount, maxAmount])

  const params = useMemo(() => {
    const p = {}
    if (dateFrom) p.date_from = dateFrom
    if (dateTo) p.date_to = dateTo
    if (type) p.type = type
    if (categoryFilterId) p.category_id = categoryFilterId
    if (minAmount !== '') p.min_amount = Number(minAmount)
    if (maxAmount !== '') p.max_amount = Number(maxAmount)
    return p
  }, [dateFrom, dateTo, type, categoryFilterId, minAmount, maxAmount])

  async function load() {
    setError('')
    setLoading(true)
    try {
      const data = await listOperations(params)
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  async function loadForecast() {
    setForecastError('')
    setForecastLoading(true)
    try {
      const data = await getAnalyticsOverview({ history_months: 12 })
      setForecast(mapOverviewToForecast(data))
    } catch (err) {
      setForecast(null)
      setForecastError(formatApiError(err))
    } finally {
      setForecastLoading(false)
    }
  }

  async function loadCategories() {
    try {
      const data = await listCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch {
      setCategories([])
    }
  }

  async function loadMe() {
    try {
      const data = await getMe()
      setMe(data)
    } catch {
      setMe(null)
    }
  }

  useEffect(() => {
    load()
    loadForecast()
    loadMe()
    loadCategories()
  }, [])

  async function onCreate(e) {
    e.preventDefault()
    setError('')
    setCreateLoading(true)
    try {
      await createOperation({
        date: createDate,
        amount: Number(createAmount),
        type: createType,
        description: createDescription ? createDescription : null,
        category_id: createCategoryId || null
      })
      setCreateDate('')
      setCreateAmount('')
      setCreateType('expense')
      setCreateDescription('')
      setCreateCategoryId('')
      setShowCreateForm(false)
      await load()
      await loadForecast()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setCreateLoading(false)
    }
  }

  async function onCreateCategory(e) {
    e.preventDefault()
    setError('')
    setCreateCategoryLoading(true)
    try {
      await createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() ? newCategoryDescription.trim() : null
      })
      setNewCategoryName('')
      setNewCategoryDescription('')
      setShowCategoryForm(false)
      await loadCategories()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setCreateCategoryLoading(false)
    }
  }

  async function onUpdateOperation(id, payload) {
    setError('')
    try {
      await updateOperation(id, payload)
      await load()
      await loadForecast()
    } catch (err) {
      setError(formatApiError(err))
      throw err
    }
  }

  async function onDeleteOperation(id) {
    setError('')
    try {
      await deleteOperation(id)
      await load()
      await loadForecast()
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  function clearFilters() {
    setDateFrom('')
    setDateTo('')
    setType('')
    setCategoryFilterId('')
    setMinAmount('')
    setMaxAmount('')
  }

  function logout() {
    clearAccessToken()
    navigate('/login', { replace: true })
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Операции</h1>
      </div>

      <div className="ops-layout">
        <CollapsibleSurface title="Прогноз" defaultOpen={true}>
          <ExpenseForecastPanel forecast={forecast} loading={forecastLoading} error={forecastError} />
        </CollapsibleSurface>

        <aside className="ops-sidebar">
          <div className="ops-sidebar-create surface">
          <button onClick={() => setShowCreateForm((prev) => !prev)} className="btn btn-primary">
            {showCreateForm ? 'Скрыть форму' : 'Добавить операцию'}
          </button>

          {showCreateForm ? (
            <form onSubmit={onCreate} className="grid-3" style={{ marginTop: 12 }}>
              <label className="field">
                Дата
                <input type="date" value={createDate} onChange={(e) => setCreateDate(e.target.value)} required />
              </label>
              <label className="field">
                Сумма
                <input type="number" value={createAmount} onChange={(e) => setCreateAmount(e.target.value)} required />
              </label>
              <label className="field">
                Тип
                <select value={createType} onChange={(e) => setCreateType(e.target.value)}>
                  <option value="expense">Расход</option>
                  <option value="income">Доход</option>
                </select>
              </label>
              <label className="field">
                Категория
                <select value={createCategoryId} onChange={(e) => setCreateCategoryId(e.target.value)}>
                  <option value="">Без категории</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field" style={{ gridColumn: '1 / -1' }}>
                Описание
                <input type="text" value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, gridColumn: '1 / -1' }}>
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
                  Отмена
                </button>
                <button type="submit" disabled={createLoading} className="btn btn-primary">
                  {createLoading ? 'Сохраняем...' : 'Сохранить'}
                </button>
              </div>
            </form>
          ) : null}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
            <button type="button" onClick={() => setShowCategoryForm((prev) => !prev)} className="btn btn-secondary">
              {showCategoryForm ? 'Скрыть форму категорий' : 'Добавить категорию'}
            </button>

            {showCategoryForm ? (
              <form onSubmit={onCreateCategory} style={{ marginTop: 12 }}>
                <div className="category-create-grid">
                  <input
                    type="text"
                    placeholder="Название категории"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Описание (необязательно)"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                  />
                  <button type="submit" disabled={createCategoryLoading} className="btn btn-primary">
                    {createCategoryLoading ? 'Добавляем...' : 'Добавить'}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
          </div>

          <div className={`ops-sidebar-filters ${activeFiltersCount > 0 ? 'surface-highlight' : ''}`}>
            <CollapsibleSurface
              title="Фильтры"
              defaultOpen={true}
              right={<span className={`chip ${activeFiltersCount > 0 ? 'chip-active' : ''}`}>{activeFiltersCount > 0 ? `Активно: ${activeFiltersCount}` : 'Нет активных фильтров'}</span>}
            >
              <div className="grid-3">
                <label className="field">
                  Дата от
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </label>
                <label className="field">
                  Дата до
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </label>
                <label className="field">
                  Тип
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="">Все</option>
                    <option value="income">Доход</option>
                    <option value="expense">Расход</option>
                  </select>
                </label>
                <label className="field">
                  Категория
                  <select value={categoryFilterId} onChange={(e) => setCategoryFilterId(e.target.value)}>
                    <option value="">Все категории</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Сумма от
                  <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
                </label>
                <label className="field">
                  Сумма до
                  <input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
                </label>
                <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
                  <button onClick={load} className="btn btn-primary">
                    Применить
                  </button>
                  <button type="button" onClick={clearFilters} className="btn btn-secondary">
                    Сбросить
                  </button>
                </div>
              </div>
            </CollapsibleSurface>
          </div>
        </aside>

        <main className="ops-main">

          {loading ? <p className="muted">Загрузка...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
          {!loading && !error && items.length === 0 ? <p className="muted">Операций нет</p> : null}

          <div className="operations-list">
            {items.map((op) => (
              <OperationRow
                key={op.id}
                op={op}
                categories={categories}
                categoriesById={categoriesById}
                onDelete={() => onDeleteOperation(op.id)}
                onUpdate={onUpdateOperation}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
