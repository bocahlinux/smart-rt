import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

import { login as loginRequest } from '../../services/authService'
import { useAuthStore } from '../../stores/authStore'

interface ApiErrorBody {
  status: 'error'
  code: string
  message: string
}

/** Halaman login — lihat docs/06-API-CONTRACT.md §2.2 dan task 2.15. */
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((state) => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { user, accessToken } = await loginRequest({ email, password })
      login(user, accessToken)
      const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      if (axios.isAxiosError<ApiErrorBody>(err) && err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 text-slate-900 dark:bg-slate-900 dark:text-white">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold">Masuk ke Smart-RT</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Masukkan email dan kata sandi Anda.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Kata Sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {isSubmitting ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Belum punya akun?{' '}
          <Link to="/register" className="font-medium text-slate-900 underline dark:text-white">
            Daftar
          </Link>
        </p>
      </div>
    </main>
  )
}
