import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCategory, listCategories } from '../api/categories.js'
import { formatApiError } from '../api/error.js'
import { createOperation, deleteOperation, listOperations, updateOperation } from '../api/operations.js'
import { getMe } from '../api/users.js'
import { clearAccessToken } from '../auth/token.js'
import UserMenu from '../components/UserMenu.jsx'

function normalizeDateValue(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function OperationRow({ op, categories, categoriesById, isOpen, onToggle, onDelete, onUpdate }) {
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
      <button
        onClick={onToggle}
        className="btn btn-secondary"
        style={{ width: '100%', justifyContent: 'space-between', border: 'none', borderRadius: 0, padding: 12, textAlign: 'left' }}
      >
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <div className="muted" style={{ fontWeight: 500 }}>
            {subtitle}
          </div>
        </div>
        <div className="muted">{normalizeDateValue(op.date)}</div>
      </button>

      {isOpen ? (
        <div style={{ padding: 12, borderTop: '1px solid var(--line)', background: '#fafcff' }}>
          {isEditing ? (
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
          ) : (
            <>
              <div className="stack" style={{ gap: 6 }}>
                <div>
                  <b>ID</b>: {op.id}
                </div>
                <div>
                  <b>Дата</b>: {normalizeDateValue(op.date)}
                </div>
                <div>
                  <b>Тип</b>: {op.type}
                </div>
                <div>
                  <b>Сумма</b>: {op.amount}
                </div>
                <div>
                  <b>Категория</b>: {categoryName}
                </div>
                <div>
                  <b>Описание</b>: {op.description || '—'}
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={() => setIsEditing(true)} className="btn btn-secondary">
                  Редактировать
                </button>
                <button onClick={onDelete} className="btn btn-danger">
                  Удалить
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default function OperationsPage() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)
  const [me, setMe] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

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
    } catch (err) {
      setError(formatApiError(err))
      throw err
    }
  }

  async function onDeleteOperation(id) {
    setError('')
    try {
      await deleteOperation(id)
      setOpenId(null)
      await load()
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
        <UserMenu username={me?.username} onLogout={logout} showProfileLink />
      </div>

      <div className="surface">
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

        <form onSubmit={onCreateCategory} style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Категории</div>
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
      </div>

      <div className={`surface ${activeFiltersCount > 0 ? 'surface-highlight' : ''}`}>
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>Фильтры</div>
          <div className={`chip ${activeFiltersCount > 0 ? 'chip-active' : ''}`}>
            {activeFiltersCount > 0 ? `Активно: ${activeFiltersCount}` : 'Нет активных фильтров'}
          </div>
        </div>

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
      </div>

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
            isOpen={openId === op.id}
            onToggle={() => setOpenId((prev) => (prev === op.id ? null : op.id))}
            onDelete={() => onDeleteOperation(op.id)}
            onUpdate={onUpdateOperation}
          />
        ))}
      </div>
    </div>
  )
}
