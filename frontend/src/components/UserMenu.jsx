import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export default function UserMenu({ username, onLogout, showProfileLink = true }) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    function onDocumentClick(e) {
      if (!rootRef.current?.contains(e.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [])

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{ padding: 10, borderRadius: 8, border: '1px solid #ccc', background: '#fff', minWidth: 180, textAlign: 'left' }}
      >
        {username || 'Пользователь'}
      </button>

      {isOpen ? (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: 6,
            width: 200,
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            zIndex: 10
          }}
        >
          {showProfileLink ? (
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              style={{ display: 'block', padding: 10, color: '#111', textDecoration: 'none', borderBottom: '1px solid #eee' }}
            >
              Открыть профиль
            </Link>
          ) : null}
          <button
            onClick={onLogout}
            style={{ display: 'block', width: '100%', padding: 10, border: 'none', background: '#fff', textAlign: 'left', cursor: 'pointer' }}
          >
            Выйти
          </button>
        </div>
      ) : null}
    </div>
  )
}
