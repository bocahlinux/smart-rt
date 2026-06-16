import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Vote, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { createPoll } from '../../services/pollingService'

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

function nowPlusMinutes(mins: number) {
  const d = new Date(Date.now() + mins * 60 * 1000)
  return d.toISOString().slice(0, 16)
}

export function PollingFormPage() {
  const navigate = useNavigate()
  const [pertanyaan, setPertanyaan] = useState('')
  const [opsi, setOpsi] = useState<string[]>(['', ''])
  const [startsAt, setStartsAt] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addOpsi() {
    if (opsi.length >= 10) return
    setOpsi([...opsi, ''])
  }

  function removeOpsi(idx: number) {
    if (opsi.length <= 2) return
    setOpsi(opsi.filter((_, i) => i !== idx))
  }

  function updateOpsi(idx: number, value: string) {
    setOpsi(opsi.map((o, i) => (i === idx ? value : o)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const filledOpsi = opsi.filter((o) => o.trim())
    if (!pertanyaan.trim()) { setError('Pertanyaan wajib diisi.'); return }
    if (filledOpsi.length < 2) { setError('Minimal 2 opsi jawaban.'); return }
    if (!deadline) { setError('Jam selesai (deadline) wajib diisi.'); return }
    if (new Date(deadline) <= new Date()) { setError('Deadline harus di masa depan.'); return }
    if (startsAt && new Date(startsAt) >= new Date(deadline)) {
      setError('Jam mulai harus sebelum jam selesai.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await createPoll({
        pertanyaan,
        opsi: filledOpsi,
        deadline: new Date(deadline).toISOString(),
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      })
      navigate(`/polling/${result.id}`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
      const detail = axiosErr.response?.data?.errors
      if (detail) {
        setError(Object.values(detail).flat().join(' '))
      } else {
        setError(axiosErr.response?.data?.message ?? 'Gagal membuat polling.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-4 lg:px-8 lg:py-6">

      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <Link
          to="/polling"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <Vote className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Buat Polling</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Kumpulkan suara warga untuk keputusan bersama</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Pertanyaan<span className="ml-0.5 text-red-500">*</span>
          </label>
          <textarea
            value={pertanyaan}
            onChange={(e) => setPertanyaan(e.target.value)}
            required
            maxLength={500}
            rows={3}
            placeholder="Contoh: Kapan waktu yang paling cocok untuk kerja bakti?"
            className={cn(INPUT, 'resize-none')}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Opsi Jawaban<span className="ml-0.5 text-red-500">*</span>{' '}
            <span className="font-normal text-slate-400">(min 2, maks 10)</span>
          </label>
          <div className="space-y-2">
            {opsi.map((o, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-right text-xs text-slate-400">{idx + 1}.</span>
                <input
                  type="text"
                  value={o}
                  onChange={(e) => updateOpsi(idx, e.target.value)}
                  placeholder={`Opsi ${idx + 1}`}
                  maxLength={255}
                  className={cn(INPUT, 'flex-1')}
                />
                {opsi.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOpsi(idx)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    title="Hapus opsi"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {opsi.length < 10 && (
            <button
              type="button"
              onClick={addOpsi}
              className="mt-2 flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Opsi
            </button>
          )}
        </div>

        {/* Periode voting: jam mulai dan jam selesai */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Jam Mulai Voting{' '}
              <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              min={nowPlusMinutes(1)}
              className={INPUT}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Jam Selesai (Deadline)<span className="ml-0.5 text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              min={nowPlusMinutes(5)}
              className={INPUT}
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Kosongkan jam mulai agar voting langsung aktif. Setelah deadline, hasil ditampilkan ke semua warga.
        </p>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Membuat...' : 'Buat Polling'}
          </button>
          <Link
            to="/polling"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
