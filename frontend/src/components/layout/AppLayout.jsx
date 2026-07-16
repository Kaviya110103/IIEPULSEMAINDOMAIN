import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'

export default function AppLayout({ role }) {
  const { user } = useAuth()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const roleLabel = {
    admin: 'Administrator',
    employee: user?.designation || 'Employee',
    student: 'Student',
    counselor: 'Counselor'
  }
  const notificationPath = {
    admin: '/admin/notifications',
    employee: '/employee/notifications',
    counselor: '/counselor/notifications',
    student: '/student/notifications',
  }[role] || '/student/notifications'

  const refreshUnread = () => {
    let alive = true
    api.get('/notifications/')
      .then(res => {
        if (!alive) return
        setUnread((res.data || []).filter(item => !item.is_read).length)
      })
      .catch(() => {
        if (alive) setUnread(0)
      })
    return () => { alive = false }
  }

  useEffect(() => refreshUnread(), [role, location.pathname])

  useEffect(() => {
    const handleRead = () => setUnread(0)
    window.addEventListener('iie:notifications-read', handleRead)
    return () => window.removeEventListener('iie:notifications-read', handleRead)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f9' }}>
      <Sidebar role={role} />
      <div style={{ marginLeft: 250, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top navbar */}
        <nav style={{
          background: '#fff', borderBottom: '1px solid #e8ecef',
          padding: '0 24px', height: 60, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)'
        }}>
          <div style={{ fontSize: 13, color: '#8d9498' }}>
            <i className="fas fa-home" style={{ marginRight: 6 }}></i>
            {roleLabel[role]} Portal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              to={notificationPath}
              title="Notifications"
              onClick={() => setUnread(0)}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                background: '#fff',
                color: '#1f2937',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                position: 'relative',
              }}
            >
              <i className="fas fa-bell" />
              {unread > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -5,
                  right: -4,
                  minWidth: 18,
                  height: 18,
                  padding: '0 5px',
                  borderRadius: 999,
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #fff',
                }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1a2035' }}>
                {user?.name || user?.username}
              </div>
              <div style={{ fontSize: 11.5, color: '#8d9498', textTransform: 'capitalize' }}>
                {roleLabel[role]}
              </div>
            </div>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: '#1572e8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 15
            }}>
              {(user?.name || user?.username || 'U')[0].toUpperCase()}
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main style={{ padding: '24px', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
