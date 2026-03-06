import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { createOperation, deleteOperation, listOperations } from '../api/operations.js'
import { formatApiError } from '../api/error.js'

function OperationRow({ op, isOpen, onToggle, onDelete }) {
  const title = `${op.type === 'income' ? 'Доход' : 'Расход'}: ${op.amount}`
  const subtitle = op.description ? op.description : 'Без описания'

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: 12,
          border: 'none',
          background: '#fff',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontWeight: 600 }}>{title}</div>
          <div style={{ color: '#666' }}>{op.date}</div>
        </div>
        <div style={{ color: '#666', marginTop: 4 }}>{subtitle}</div>
      </button>

      {isOpen ? (
        <div style={{ padding: 12, background: '#fafafa', borderTop: '1px solid #eee' }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <div>
              <b>ID</b>: {op.id}
            </div>
            <div>
              <b>Дата</b>: {op.date}
            </div>
            <div>
              <b>Тип</b>: {op.type}
            </div>
            <div>
              <b>Сумма</b>: {op.amount}
            </div>
            <div>
              <b>Категория</b>: {op.category_id ? op.category_id : '—'}
            </div>
            <div>
              <b>Описание</b>: {op.description ? op.description : '—'}
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onDelete}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #c00', background: '#fff', color: '#c00' }}
            >
              Удалить
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function OperationsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState(null)

  const [createDate, setCreateDate] = useState('')
  const [createAmount, setCreateAmount] = useState('')
  const [createType, setCreateType] = useState('expense')
  const [createDescription, setCreateDescription] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [type, setType] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')

  const params = useMemo(() => {
    const p = {}
    if (dateFrom) p.date_from = dateFrom
    if (dateTo) p.date_to = dateTo
    if (type) p.type = type
    if (minAmount !== '') p.min_amount = Number(minAmount)
    if (maxAmount !== '') p.max_amount = Number(maxAmount)
    return p
  }, [dateFrom, dateTo, type, minAmount, maxAmount])

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

  useEffect(() => {
    load()
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
        category_id: null
      })

      setCreateAmount('')
      setCreateDescription('')

      await load()
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setCreateLoading(false)
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

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Операции</h1>
        <Link to="/profile">Профиль</Link>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          border: '1px solid #ddd',
          borderRadius: 10,
          background: '#fff'
        }}
      >
        <h2 style={{ margin: '0 0 12px 0', fontSize: 18 }}>Добавить операцию</h2>
        <form onSubmit={onCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            Дата
            <input
              type="date"
              value={createDate}
              onChange={(e) => setCreateDate(e.target.value)}
              required
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            Сумма
            <input
              type="number"
              value={createAmount}
              onChange={(e) => setCreateAmount(e.target.value)}
              required
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            Тип
            <select
              value={createType}
              onChange={(e) => setCreateType(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            >
              <option value="expense">Расход</option>
              <option value="income">Доход</option>
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6, gridColumn: '1 / -1' }}>
            Описание
            <input
              type="text"
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gridColumn: '1 / -1' }}>
            <button
              type="submit"
              disabled={createLoading}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #111', background: '#111', color: '#fff' }}
            >
              {createLoading ? 'Сохраняем...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          border: '1px solid #ddd',
          borderRadius: 10,
          background: '#fff'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            Дата от
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            Дата до
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            Тип
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            >
              <option value="">Все</option>
              <option value="income">Доход</option>
              <option value="expense">Расход</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            Сумма от
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            Сумма до
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            />
          </label>
          <div style={{ display: 'grid', alignContent: 'end' }}>
            <button
              onClick={load}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #111', background: '#111', color: '#fff' }}
            >
              Применить
            </button>
          </div>
        </div>
      </div>

      {loading ? <p>Загрузка...</p> : null}
      {error ? <p style={{ color: 'crimson', whiteSpace: 'pre-wrap' }}>{error}</p> : null}

      {!loading && !error && items.length === 0 ? <p>Операций нет</p> : null}

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {items.map((op) => (
          <OperationRow
            key={op.id}
            op={op}
            isOpen={openId === op.id}
            onToggle={() => setOpenId((prev) => (prev === op.id ? null : op.id))}
            onDelete={() => onDeleteOperation(op.id)}
          />
        ))}
      </div>
    </div>
  )
}
