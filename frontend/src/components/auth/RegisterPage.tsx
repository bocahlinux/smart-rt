import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

import { register as registerRequest } from '../../services/authService'

interface ApiErrorBody {
  status: 'error'
  code?: string
  message: string
  errors?: Array<{ field: string; message: string }>
}

/** Halaman registrasi — lihat docs/06-API-CONTRACT.md §2.1 dan task 2.16. */
export function RegisterPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await registerRequest({ email, phone, password, passwordConfirmation })
      navigate('/login', {
        replace: true,
        state: { registered: true },
      })
    } catch (err) {
      if (axios.isAxiosError<ApiErrorBody>(err) && err.response?.data) {
        const body = err.response.data
        setError(body.message)
        if (body.errors) {
          const mapped: Record<string, string> = {}
          for (const fieldError of body.errors) {
            mapped[fieldError.field] = fieldError.message
          }
          setFieldErrors(mapped)
        }
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 text-slate-900 dark:bg-slate-900 dark:text-white">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold">Daftar Akun Smart-RT</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Akun Anda akan menunggu verifikasi pengurus sebelum dapat digunakan.
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
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium">
              Nomor HP
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.phone}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Kata Sandi
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.
            </p>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="passwordConfirmation" className="block text-sm font-medium">
              Konfirmasi Kata Sandi
            </label>
            <input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              required
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            />
            {fieldErrors.passwordConfirmation && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {fieldErrors.passwordConfirmation}
              </p>
            )}
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
            {isSubmitting ? 'Memproses…' : 'Daftar'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-medium text-slate-900 underline dark:text-white">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  )
}
