import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createPengaduan } from '../../services/pengaduanService'
import type { PengaduanKategori } from '../../types/pengaduan'

const KATEGORI_OPTIONS: { value: PengaduanKategori; label: string; desc: string }[] = [
  { value: 'infrastruktur', label: '🏗️ Infrastruktur', desc: 'Jalan, lampu, saluran air' },
  { value: 'keamanan', label: '🔒 Keamanan', desc: 'Pencurian, gangguan keamanan' },
  { value: 'kebersihan', label: '🧹 Kebersihan', desc: 'Sampah, kebersihan lingkungan' },
  { value: 'sosial', label: '🤝 Sosial', desc: 'Masalah sosial warga' },
  { value: 'lainnya', label: '📋 Lainnya', desc: 'Selain kategori di atas' },
]

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
    if (!file) {
      setFoto(null)
      setPreview(null)
      return
    }
    // Validasi sisi client (ukuran & ekstensi) — backend tetap validasi ulang
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
        const msgs = Object.values(detail).flat()
        setError(msgs.join(' '))
      } else {
        setError(axiosErr.response?.data?.message ?? 'Gagal mengajukan pengaduan.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/pengaduan')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Kembali
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mt-3">Buat Pengaduan</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Sampaikan masalah atau keluhan Anda kepada pengurus RT
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* Judul */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Judul Pengaduan <span className="text-red-500">*</span>
          </label>
          <input
            id="judul"
            type="text"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            placeholder="Contoh: Lampu jalan di Blok A mati"
            maxLength={255}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategori <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {KATEGORI_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setKategori(opt.value)}
                className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  kategori === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Deskripsi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Deskripsi <span className="text-red-500">*</span>
          </label>
          <textarea
            id="deskripsi"
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Jelaskan masalah secara detail: lokasi, waktu kejadian, dampak, dll."
            rows={5}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Foto (opsional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Foto Bukti{' '}
            <span className="text-gray-400 font-normal">(opsional, maks 5 MB — JPG/PNG/WebP)</span>
          </label>
          <input
            id="foto"
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
                className="w-full max-h-60 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => {
                  setFoto(null)
                  setPreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="absolute top-2 right-2 bg-white text-red-500 border border-gray-300 text-xs px-2 py-1 rounded shadow hover:bg-red-50"
              >
                Hapus Foto
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg py-8 text-center text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors text-sm"
            >
              📷 Klik untuk memilih foto
            </button>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/pengaduan')}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            id="submit-pengaduan"
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Mengirim...' : 'Ajukan Pengaduan'}
          </button>
        </div>
      </form>
    </div>
  )
}
