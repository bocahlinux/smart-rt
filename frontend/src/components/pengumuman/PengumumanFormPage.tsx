import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ImageIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import {
  createPengumuman,
  getPengumuman,
  updatePengumuman,
} from '../../services/pengumumanService'
import type { PengumumanKategori } from '../../types/pengumuman'

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp']
const MAX_SIZE = 5 * 1024 * 1024

const KATEGORI_OPTIONS: { value: PengumumanKategori; label: string }[] = [
  { value: 'info', label: 'Informasi' },
  { value: 'penting', label: 'Penting' },
  { value: 'acara', label: 'Acara' },
  { value: 'keamanan', label: 'Keamanan' },
  { value: 'lainnya', label: 'Lainnya' },
]

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

export function PengumumanFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [judul, setJudul] = useState('')
  const [isi, setIsi] = useState('')
  const [kategori, setKategori] = useState<PengumumanKategori>('info')
  const [scheduledAt, setScheduledAt] = useState('')
  const [gambarFile, setGambarFile] = useState<File | null>(null)
  const [gambarPreview, setGambarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canWrite = hasPerm(user, 'kelola_pengumuman')

  useEffect(() => {
    if (isEdit && id) {
      getPengumuman(id).then((p) => {
        setJudul(p.judul)
        setIsi(p.isi)
        setKategori(p.kategori)
        if (p.scheduledAt) setScheduledAt(p.scheduledAt.slice(0, 16))
        if (p.gambar) setGambarPreview(p.gambar)
      })
    }
  }, [id, isEdit])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXT.includes(ext)) {
      setError(`Format gambar tidak didukung. Gunakan: ${ALLOWED_EXT.join(', ')}.`)
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Ukuran gambar maksimal 5 MB.')
      return
    }
    setError('')
    setGambarFile(file)
    setGambarPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!judul.trim() || !isi.trim()) {
      setError('Judul dan isi wajib diisi.')
      return
    }
    setLoading(true)
    setError('')
    const fd = new FormData()
    fd.append('judul', judul.trim())
    fd.append('isi', isi.trim())
    fd.append('kategori', kategori)
    if (scheduledAt) fd.append('scheduledAt', new Date(scheduledAt).toISOString())
    if (gambarFile) fd.append('gambar', gambarFile)
    try {
      if (isEdit && id) {
        await updatePengumuman(id, fd)
      } else {
        await createPengumuman(fd)
      }
      navigate('/pengumuman')
    } catch {
      setError('Gagal menyimpan pengumuman. Periksa kembali data yang diisi.')
    } finally {
      setLoading(false)
    }
  }

  if (!canWrite) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Akses ditolak.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 lg:px-8 lg:py-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      <h1 className="mb-5 text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">
        {isEdit ? 'Edit Pengumuman' : 'Buat Pengumuman'}
      </h1>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Judul<span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Judul pengumuman..."
            className={INPUT}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Kategori<span className="ml-0.5 text-red-500">*</span>
          </label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value as PengumumanKategori)}
            className={INPUT}
          >
            {KATEGORI_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Isi Pengumuman<span className="ml-0.5 text-red-500">*</span>
          </label>
          <textarea
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            rows={6}
            placeholder="Tuliskan isi pengumuman di sini..."
            className={cn(INPUT, 'resize-y')}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Jadwal Tayang{' '}
            <span className="font-normal text-slate-400">(kosongkan = segera)</span>
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={INPUT}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Gambar{' '}
            <span className="font-normal text-slate-400">(JPEG/PNG/WebP, maks. 5 MB)</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className="hidden"
          />
          {gambarPreview ? (
            <div className="relative mt-1 inline-block">
              <img
                src={gambarPreview}
                alt="Preview"
                className="h-32 w-auto rounded-xl border border-slate-200 object-cover dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => {
                  setGambarFile(null)
                  setGambarPreview(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs text-white"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-7 text-sm text-slate-400 transition-colors hover:border-primary-400 hover:text-primary-500 dark:border-slate-700 dark:hover:border-primary-500 dark:hover:text-primary-400"
            >
              <ImageIcon className="h-4 w-4" />
              Klik untuk memilih gambar
            </button>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Pengumuman'}
          </button>
          <Link
            to="/pengumuman"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
