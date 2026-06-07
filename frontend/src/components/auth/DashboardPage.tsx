import axios from 'axios'

import { logout as logoutRequest } from '../../services/authService'
import { useAuthStore } from '../../stores/authStore'

/**
 * Placeholder halaman setelah login — membuktikan ProtectedRoute + authStore
 * bekerja. Fitur dashboard sesungguhnya akan dibangun pada phase terkait
 * (lihat docs/02-SRS.md).
 */
export function DashboardPage() {
  const { user, logout } = useAuthStore()

  async function handleLogout() {
    try {
      await logoutRequest()
    } catch (err) {
      if (!axios.isAxiosError(err)) {
        throw err
      }
    } finally {
      logout()
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center text-slate-900 dark:bg-slate-900 dark:text-white">
      <h1 className="text-2xl font-bold">Selamat datang, {user?.email}</h1>
      <p className="text-slate-500 dark:text-slate-400">
        Peran Anda: <span className="font-medium">{user?.role}</span> · Status:{' '}
        <span className="font-medium">{user?.status}</span>
      </p>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        Keluar
      </button>
    </main>
  )
}
