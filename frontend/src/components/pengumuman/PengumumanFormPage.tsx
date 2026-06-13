import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

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

  const canWrite = user?.role && ['admin', 'pengurus', 'sekretaris'].includes(user.role)

  useEffect(() => {
    if (isEdit && id) {
      getPengumuman(id).then((p) => {
        setJudul(p.judul)
        setIsi(p.isi)
        setKategori(p.kategori)
        if (p.scheduledAt) {
          setScheduledAt(p.scheduledAt.slice(0, 16))
        }
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
      <div className="p-6 text-center text-gray-500">
        Akses ditolak. Hanya pengurus, sekretaris, dan admin.
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/pengumuman" className="text-gray-500 hover:text-gray-700 text-sm">
          ← Semua Pengumuman
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? 'Edit Pengumuman' : 'Buat Pengumuman'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
          <input
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Judul pengumuman..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value as PengumumanKategori)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {KATEGORI_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pengumuman</label>
          <textarea
            value={isi}
            onChange={(e) => setIsi(e.target.value)}
            rows={6}
            placeholder="Tuliskan isi pengumuman di sini..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jadwal Tayang <span className="text-gray-400 font-normal">(kosongkan = segera)</span>
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gambar <span className="text-gray-400 font-normal">(JPEG/PNG/WebP, maks. 5 MB)</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {gambarPreview && (
            <div className="mt-3 relative inline-block">
              <img
                src={gambarPreview}
                alt="Preview"
                className="h-32 w-auto rounded-lg border border-gray-200 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setGambarFile(null)
                  setGambarPreview(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Pengumuman'}
          </button>
          <Link
            to="/pengumuman"
            className="px-5 py-2.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
