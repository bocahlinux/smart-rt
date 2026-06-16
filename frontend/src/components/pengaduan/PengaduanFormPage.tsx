import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, MessageCircleWarning } from 'lucide-react'

import { cn } from '@/lib/utils'
import { createPengaduan } from '../../services/pengaduanService'
import type { PengaduanKategori } from '../../types/pengaduan'

const KATEGORI_OPTIONS: { value: PengaduanKategori; label: string; desc: string }[] = [
  { value: 'infrastruktur', label: 'Infrastruktur', desc: 'Jalan, lampu, saluran air' },
  { value: 'keamanan', label: 'Keamanan', desc: 'Pencurian, gangguan keamanan' },
  { value: 'kebersihan', label: 'Kebersihan', desc: 'Sampah, kebersihan lingkungan' },
  { value: 'sosial', label: 'Sosial', desc: 'Masalah sosial warga' },
  { value: 'lainnya', label: 'Lainnya', desc: 'Selain kategori di atas' },
]

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

export function PengaduanFormPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [judul, setJudul] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [kategori, setKategori] = useState<PengaduanKategori>('lainnya')
  const [foto, setFoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setFoto(null); setPreview(null); return }
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
    if (!ALLOWED.includes(file.type)) {
      setError('Format foto harus JPEG, PNG, atau WebP.')
      e.target.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto maksimal 5 MB.')
      e.target.value = ''
      return
    }
    setError('')
    setFoto(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!judul.trim()) { setError('Judul tidak boleh kosong.'); return }
    if (!deskripsi.trim()) { setError('Deskripsi tidak boleh kosong.'); return }
    setLoading(true)
    setError('')
    try {
      const result = await createPengaduan({ judul, deskripsi, kategori, foto })
      navigate(`/pengaduan/${result.id}`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
      const detail = axiosErr.response?.data?.errors
      if (detail) {
        setError(Object.values(detail).flat().join(' '))
      } else {
        setError(axiosErr.response?.data?.message ?? 'Gagal mengajukan pengaduan.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 lg:px-8 lg:py-6">
      <div className="mb-5 flex items-center gap-3">
        <Link
          to="/pengaduan"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
            <MessageCircleWarning className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Buat Pengaduan</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Sampaikan masalah kepada pengurus RT</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Judul Pengaduan<span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Contoh: Lampu jalan di Blok A mati"
            maxLength={255}
            required
            className={INPUT}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Kategori<span className="ml-0.5 text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {KATEGORI_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setKategori(opt.value)}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                  kategori === opt.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/20 dark:text-primary-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500',
                )}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="mt-0.5 text-xs opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Deskripsi<span className="ml-0.5 text-red-500">*</span>
          </label>
          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Jelaskan masalah secara detail: lokasi, waktu kejadian, dampak, dll."
            rows={5}
            required
            className={cn(INPUT, 'resize-none')}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Foto Bukti{' '}
            <span className="font-normal text-slate-400">(opsional, maks 5 MB — JPG/PNG/WebP)</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFotoChange}
            className="hidden"
          />
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview foto"
                className="max-h-60 w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => {
                  setFoto(null)
                  setPreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="absolute right-2 top-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-red-500 shadow-sm hover:bg-red-50"
              >
                Hapus Foto
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-sm text-slate-400 transition-colors hover:border-primary-400 hover:text-primary-500 dark:border-slate-700 dark:hover:border-primary-500 dark:hover:text-primary-400"
            >
              <Camera className="h-4 w-4" />
              Klik untuk memilih foto
            </button>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : 'Ajukan Pengaduan'}
          </button>
          <Link
            to="/pengaduan"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
