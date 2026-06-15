import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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

/**
 * ThreadFormPage — digunakan untuk create dan edit thread.
 * - Create: navigasi ke /forum/baru
 * - Edit:   navigasi ke /forum/:id/edit
 */
export function ThreadFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  /* Pre-fill form saat mode edit — loading sudah diinisialisasi true via useState(isEdit) */
  useEffect(() => {
    if (!isEdit || !id) return
    getThread(id)
      .then((thread) => {
        setForm({
          judul: thread.judul,
          isi: thread.isi,
          kategori: thread.kategori,
        })
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
    if (!form.judul.trim()) {
      setError('Judul thread wajib diisi.')
      return
    }
    if (!form.isi.trim()) {
      setError('Isi thread wajib diisi.')
      return
    }

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
      setError(
        axiosErr?.response?.data?.message ?? 'Gagal menyimpan thread. Coba lagi.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Memuat...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(isEdit && id ? `/forum/${id}` : '/forum')}
          className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 mb-4"
        >
          ← Kembali
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? 'Edit Thread' : 'Buat Thread Baru'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit
            ? 'Perbarui judul, isi, atau kategori thread.'
            : 'Mulai diskusi baru dengan warga RT lainnya.'}
        </p>
      </div>

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <form
        id="thread-form"
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5"
        noValidate
      >
        {/* Judul */}
        <div>
          <label
            htmlFor="thread-judul"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Judul Thread <span className="text-red-500">*</span>
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{form.judul.length}/255</p>
        </div>

        {/* Kategori */}
        <div>
          <label
            htmlFor="thread-kategori"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Kategori <span className="text-red-500">*</span>
          </label>
          <select
            id="thread-kategori"
            name="kategori"
            value={form.kategori}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
          >
            {KATEGORI_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Isi */}
        <div>
          <label
            htmlFor="thread-isi"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Isi Thread <span className="text-red-500">*</span>
          </label>
          <textarea
            id="thread-isi"
            name="isi"
            value={form.isi}
            onChange={handleChange}
            placeholder="Tuliskan diskusi Anda dengan jelas..."
            rows={8}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            id="thread-form-submit"
            disabled={submitting || !form.judul.trim() || !form.isi.trim()}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40 transition-colors"
          >
            {submitting
              ? isEdit
                ? 'Menyimpan...'
                : 'Membuat...'
              : isEdit
                ? 'Simpan Perubahan'
                : 'Buat Thread'}
          </button>
          <button
            type="button"
            onClick={() => navigate(isEdit && id ? `/forum/${id}` : '/forum')}
            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
