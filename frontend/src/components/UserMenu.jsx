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
    <div ref={rootRef} className="user-menu-root">
      <button onClick={() => setIsOpen((prev) => !prev)} className="btn btn-secondary user-menu-trigger">
        {username || 'Пользователь'}
      </button>

      {isOpen ? (
        <div className="user-menu-popover">
          {showProfileLink ? (
            <Link to="/profile" onClick={() => setIsOpen(false)} className="user-menu-item">
              Открыть профиль
            </Link>
          ) : null}
          <button onClick={onLogout} className="user-menu-item">
            Выйти
          </button>
        </div>
      ) : null}
    </div>
  )
}
