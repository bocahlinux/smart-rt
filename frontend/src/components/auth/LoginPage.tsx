import axios from 'axios'
import { Building2, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'
import apiClient from '@/services/apiClient'
import { getCurrentUser, login as loginRequest } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

interface ApiErrorBody {
  status: 'error'
  code: string
  message: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login, logout } = useAuthStore()

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/'

  // Cek sesi aktif saat halaman login dibuka
  const [checking, setChecking] = useState(!isAuthenticated)
  const checkedRef = useRef(false)

  useEffect(() => {
    // Jika Zustand sudah authenticated (dalam sesi yang sama) → langsung redirect
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true })
      return
    }

    // Hindari double-invoke (React StrictMode)
    if (checkedRef.current) return
    checkedRef.current = true

    // Coba pulihkan sesi dari refresh token cookie (setelah page refresh)
    void (async () => {
      try {
        const { data } = await apiClient.post<{ data: { accessToken: string } }>('/auth/token/refresh')
        useAuthStore.getState().setAccessToken(data.data.accessToken)
        const me = await getCurrentUser()
        login(me, data.data.accessToken)
        navigate(redirectTo, { replace: true })
      } catch {
        // Tidak ada sesi valid → tampilkan form login
        logout()
        setChecking(false)
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    setError(null)
    setIsSubmitting(true)
    try {
      const { user, accessToken } = await loginRequest({ email, password })
      login(user, accessToken)
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

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary-600 via-primary-700 to-primary-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-br from-primary-600 via-primary-700 to-primary-900 lg:flex-row">
      {/* Left panel — branding */}
      <div className="flex flex-col items-center justify-center px-8 py-12 text-white lg:flex-1 lg:items-start lg:px-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
          <Building2 className="h-7 w-7 text-white" />
        </div>
        <h1 className="mt-6 text-3xl font-bold lg:text-4xl">Smart-RT</h1>
        <p className="mt-2 max-w-xs text-center text-primary-200 lg:text-left lg:text-base">
          Platform digital pengelolaan Rukun Tetangga — cepat, transparan, dan terpercaya.
        </p>
        <ul className="mt-8 hidden space-y-3 lg:block">
          {['Manajemen data warga terintegrasi', 'Laporan keuangan real-time', 'Pengumuman & forum diskusi'].map(
            (f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-primary-100">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
                {f}
              </li>
            ),
          )}
        </ul>
      </div>

      {/* Right panel — form */}
      <div className="flex items-center justify-center bg-white px-6 py-10 lg:w-110 dark:bg-slate-900">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Selamat datang</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Masuk ke akun Smart-RT Anda</p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleSubmit()
            }}
            className="mt-8 space-y-4"
            noValidate
          >
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className={cn(
                    'w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none transition',
                    'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400',
                    'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
                    'dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm outline-none transition',
                    'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400',
                    'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
                    'dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'mt-2 w-full rounded-xl py-3 text-sm font-semibold text-white transition',
                'bg-primary-600 hover:bg-primary-700 active:bg-primary-800',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
                'disabled:cursor-not-allowed disabled:opacity-60',
              )}
            >
              {isSubmitting ? 'Memproses…' : 'Masuk'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Belum punya akun?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
