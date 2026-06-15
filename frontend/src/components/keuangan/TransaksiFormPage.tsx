import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { createTransaksi, listKategori } from '../../services/keuanganService'
import type { KategoriTransaksi, TransaksiTipe } from '../../types/keuangan'
import { KategoriModal } from './KategoriModal'

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

interface FormState {
  kategoriId: string
  jumlah: string
  keterangan: string
  tanggal: string
  tipe: TransaksiTipe
}

const INITIAL: FormState = {
  kategoriId: '',
  jumlah: '',
  keterangan: '',
  tanggal: new Date().toISOString().split('T')[0],
  tipe: 'pemasukan',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

export function TransaksiFormPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [kategoriAll, setKategoriAll] = useState<KategoriTransaksi[]>([])
  const [kategoriOpen, setKategoriOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canAccess = hasPerm(user, 'kelola_keuangan')

  function loadKategori() {
    listKategori().then(setKategoriAll).catch(() => {})
  }

  useEffect(() => {
    if (!canAccess) return
    loadKategori()
  }, [canAccess])

  const kategoriFiltered = kategoriAll.filter((k) => k.tipe === form.tipe)

  function set(field: keyof FormState, val: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: val }
      if (field === 'tipe') next.kategoriId = ''
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.kategoriId || !form.jumlah || !form.tanggal) {
      setError('Lengkapi semua field wajib.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await createTransaksi({
        kategoriId: form.kategoriId,
        jumlah: parseFloat(form.jumlah),
        keterangan: form.keterangan,
        tanggal: form.tanggal,
        tipe: form.tipe,
      })
      navigate('/keuangan')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Gagal menyimpan transaksi.')
    } finally {
      setLoading(false)
    }
  }

  if (!canAccess) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Akses ditolak.</p>
      </div>
    )
  }

  return (
    <>
      {kategoriOpen && (
        <KategoriModal onClose={() => setKategoriOpen(false)} onChanged={loadKategori} />
      )}

      <div className="mx-auto max-w-xl px-4 py-4 lg:px-8 lg:py-6">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <h1 className="mb-5 text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Tambah Transaksi</h1>

        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* Tipe */}
          <Field label="Tipe" required>
            <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
              {(['pemasukan', 'pengeluaran'] as TransaksiTipe[]).map((t) => (
                <label key={t} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="tipe"
                    value={t}
                    checked={form.tipe === t}
                    onChange={() => set('tipe', t)}
                    className="sr-only"
                  />
                  <span className={cn(
                    'block rounded-lg py-2 text-center text-xs font-semibold transition-colors',
                    form.tipe === t
                      ? t === 'pemasukan'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                  )}>
                    {t === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </label>
              ))}
            </div>
          </Field>

          {/* Kategori */}
          <Field label="Kategori" required>
            <div className="flex gap-2">
              <select
                value={form.kategoriId}
                onChange={(e) => set('kategoriId', e.target.value)}
                required
                className={cn(INPUT, 'flex-1')}
              >
                <option value="">Pilih kategori...</option>
                {kategoriFiltered.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setKategoriOpen(true)}
                title="Kelola kategori"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
            {kategoriFiltered.length === 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Belum ada kategori untuk tipe ini.{' '}
                <button type="button" onClick={() => setKategoriOpen(true)} className="font-medium underline">
                  Tambah kategori
                </button>
              </p>
            )}
          </Field>

          {/* Jumlah */}
          <Field label="Jumlah (Rp)" required>
            <input
              type="number"
              value={form.jumlah}
              onChange={(e) => set('jumlah', e.target.value)}
              required
              min={1}
              placeholder="50000"
              className={INPUT}
            />
          </Field>

          {/* Tanggal */}
          <Field label="Tanggal" required>
            <input
              type="date"
              value={form.tanggal}
              onChange={(e) => set('tanggal', e.target.value)}
              required
              className={INPUT}
            />
          </Field>

          {/* Keterangan */}
          <Field label="Keterangan">
            <textarea
              value={form.keterangan}
              onChange={(e) => set('keterangan', e.target.value)}
              rows={3}
              placeholder="Keterangan transaksi (opsional)..."
              className={cn(INPUT, 'resize-none')}
            />
          </Field>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/keuangan')}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
