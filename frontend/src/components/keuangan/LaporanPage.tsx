import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { downloadLaporan } from '../../services/keuanganService'

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

export function LaporanPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const [dari, setDari] = useState(`${currentYear}-01-01`)
  const [sampai, setSampai] = useState(`${currentYear}-12-31`)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canAccess = hasPerm(user, 'kelola_keuangan')

  async function handleDownload(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await downloadLaporan({ dari: dari || undefined, sampai: sampai || undefined })
      setSuccess('Laporan berhasil diunduh.')
    } catch {
      setError('Gagal mengunduh laporan keuangan.')
    } finally {
      setLoading(false)
    }
  }

  if (!canAccess) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Akses ditolak. Hanya bendahara dan admin.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-4 lg:px-8 lg:py-6">
      <button
        type="button"
        onClick={() => navigate('/keuangan')}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      <h1 className="mb-5 text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Laporan Keuangan</h1>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
          Generate laporan keuangan RT dalam format PDF berisi semua transaksi yang sudah dikonfirmasi.
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300">
            {success}
          </div>
        )}

        <form onSubmit={(e) => void handleDownload(e)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Periode Dari
            </label>
            <input
              type="date"
              value={dari}
              onChange={(e) => setDari(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Periode Sampai
            </label>
            <input
              type="date"
              value={sampai}
              onChange={(e) => setSampai(e.target.value)}
              className={INPUT}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Mengunduh...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Download Laporan PDF
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
        Laporan akan berisi semua transaksi yang berstatus <em>confirmed</em> dalam rentang periode yang dipilih.
        File akan diunduh otomatis ke perangkat Anda.
      </p>
    </div>
  )
}
