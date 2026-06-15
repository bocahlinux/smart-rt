import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import apiClient from '../../services/apiClient'
import { getCurrentUser } from '../../services/authService'
import { useAuthStore } from '../../stores/authStore'
import type { UserRole } from '../../types/auth'

interface ProtectedRouteProps {
  /** Jika diisi, hanya role yang terdaftar di sini yang boleh mengakses (RBAC). */
  allowedRoles?: UserRole[]
}

// Singleton promise agar React StrictMode (double-invoke) tidak mengirim dua
// request token/refresh secara bersamaan — yang akan menyebabkan refresh token
// pertama di-blacklist sebelum request kedua selesai, memicu _revoke_all_sessions.
let _refreshInFlight: Promise<void> | null = null

/**
 * Guard route — lihat docs/08-CODING-STANDART.md §4.2-4.3 dan
 * docs/11-SECURITY.md §4 (Auth Policy).
 *
 * Saat Zustand state kosong (mis. setelah page refresh), coba pulihkan sesi
 * lewat refresh token (httpOnly cookie) via POST /auth/token/refresh.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, login, logout } = useAuthStore()
  const [isChecking, setIsChecking] = useState(!isAuthenticated)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      setIsChecking(false)
      return
    }

    // Jika sudah ada request refresh yang berjalan (mis. StrictMode double-invoke),
    // tunggu promise yang sama tanpa membuat request baru.
    if (_refreshInFlight) {
      _refreshInFlight.finally(() => {
        if (mountedRef.current) setIsChecking(false)
      })
      return
    }

    _refreshInFlight = (async () => {
      try {
        const { data } = await apiClient.post<{ data: { accessToken: string } }>(
          '/auth/token/refresh'
        )
        useAuthStore.getState().setAccessToken(data.data.accessToken)
        const me = await getCurrentUser()
        login(me, data.data.accessToken)
      } catch {
        logout()
      } finally {
        _refreshInFlight = null
        if (mountedRef.current) setIsChecking(false)
      }
    })()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">Memuat…</p>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
