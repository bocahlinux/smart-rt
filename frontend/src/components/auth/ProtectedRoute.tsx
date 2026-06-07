import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import apiClient from '../../services/apiClient'
import { getCurrentUser } from '../../services/authService'
import { useAuthStore } from '../../stores/authStore'
import type { UserRole } from '../../types/auth'

interface ProtectedRouteProps {
  /** Jika diisi, hanya role yang terdaftar di sini yang boleh mengakses (RBAC). */
  allowedRoles?: UserRole[]
}

/**
 * Guard route — lihat docs/08-CODING-STANDART.md §4.2-4.3 dan
 * docs/11-SECURITY.md §4 (Auth Policy).
 *
 * Saat Zustand state kosong (mis. setelah page refresh), coba pulihkan sesi
 * lewat refresh token (httpOnly cookie) via `GET /auth/me` — request ini akan
 * memicu interceptor 401→refresh apabila access token belum ada/sudah basi.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, login, logout } = useAuthStore()
  const [isChecking, setIsChecking] = useState(!isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      return
    }

    let cancelled = false

    async function restoreSession() {
      try {
        const { data } = await apiClient.post<{ data: { accessToken: string } }>(
          '/auth/token/refresh'
        )
        useAuthStore.getState().setAccessToken(data.data.accessToken)
        const me = await getCurrentUser()
        if (!cancelled) {
          login(me, data.data.accessToken)
        }
      } catch {
        if (!cancelled) {
          logout()
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false)
        }
      }
    }

    void restoreSession()

    return () => {
      cancelled = true
    }
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
