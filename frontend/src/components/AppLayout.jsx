import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { getMe } from '../api/users.js'
import AppHeader from './AppHeader.jsx'

export default function AppLayout() {
  const [me, setMe] = useState(null)

  useEffect(() => {
    async function loadMe() {
      try {
        const data = await getMe()
        setMe(data)
      } catch {
        setMe(null)
      }
    }
    loadMe()
  }, [])

  return (
    <>
      <AppHeader username={me?.username} />
      <Outlet />
    </>
  )
}
