import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  createThread,
  getThread,
  updateThread,
} from '../../services/forumService'
import type { ThreadKategori } from '../../types/forum'

const KATEGORI_OPTIONS: { value: ThreadKategori; label: string }[] = [
  { value: 'keamanan', label: 'Keamanan' },
  { value: 'kebersihan', label: 'Kebersihan' },
  { value: 'acara', label: 'Acara' },
  { value: 'usul', label: 'Usul/Saran' },
  { value: 'lainnya', label: 'Lainnya' },
]

interface FormData {
  judul: string
  isi: string
  kategori: ThreadKategori
}

const EMPTY_FORM: FormData = {
  judul: '',
  isi: '',
  kategori: 'lainnya',
}

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

export function ThreadFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit || !id) return
    getThread(id)
      .then((thread) => {
        setForm({ judul: thread.judul, isi: thread.isi, kategori: thread.kategori })
      })
      .catch(() => setError('Thread tidak ditemukan.'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.judul.trim()) { setError('Judul thread wajib diisi.'); return }
    if (!form.isi.trim()) { setError('Isi thread wajib diisi.'); return }

    setSubmitting(true)
    setError('')
    try {
      if (isEdit && id) {
        await updateThread(id, form)
        navigate(`/forum/${id}`)
      } else {
        const thread = await createThread(form)
        navigate(`/forum/${thread.id}`)
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr?.response?.data?.message ?? 'Gagal menyimpan thread. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 lg:px-8 lg:py-6">
      <button
        type="button"
        onClick={() => navigate(isEdit && id ? `/forum/${id}` : '/forum')}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">
          {isEdit ? 'Edit Thread' : 'Buat Thread Baru'}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {isEdit
            ? 'Perbarui judul, isi, atau kategori thread.'
            : 'Mulai diskusi baru dengan warga RT lainnya.'}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        noValidate
      >
        <div>
          <label htmlFor="thread-judul" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Judul Thread<span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            id="thread-judul"
            name="judul"
            type="text"
            value={form.judul}
            onChange={handleChange}
            placeholder="Tulis judul yang jelas dan singkat..."
            maxLength={255}
            required
            className={INPUT}
          />
          <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">{form.judul.length}/255</p>
        </div>

        <div>
          <label htmlFor="thread-kategori" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Kategori<span className="ml-0.5 text-red-500">*</span>
          </label>
          <select
            id="thread-kategori"
            name="kategori"
            value={form.kategori}
            onChange={handleChange}
            required
            className={INPUT}
          >
            {KATEGORI_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="thread-isi" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Isi Thread<span className="ml-0.5 text-red-500">*</span>
          </label>
          <textarea
            id="thread-isi"
            name="isi"
            value={form.isi}
            onChange={handleChange}
            placeholder="Tuliskan diskusi Anda dengan jelas..."
            rows={8}
            required
            className={cn(INPUT, 'resize-y')}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting || !form.judul.trim() || !form.isi.trim()}
            className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting
              ? isEdit ? 'Menyimpan...' : 'Membuat...'
              : isEdit ? 'Simpan Perubahan' : 'Buat Thread'}
          </button>
          <button
            type="button"
            onClick={() => navigate(isEdit && id ? `/forum/${id}` : '/forum')}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
