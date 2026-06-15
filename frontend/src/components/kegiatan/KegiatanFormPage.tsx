import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { createKegiatan, getKegiatan, updateKegiatan } from '../../services/kegiatanService'

export function KegiatanFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [nama, setNama] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [kuota, setKuota] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      getKegiatan(id!).then((k) => {
        setNama(k.nama)
        setDeskripsi(k.deskripsi ?? '')
        // Format ISO datetime ke datetime-local input
        setTanggal(k.tanggal.slice(0, 16))
        setLokasi(k.lokasi ?? '')
        setKuota(k.kuotaPeserta ?? '')
      }).catch(() => setError('Gagal memuat data kegiatan.'))
    }
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim()) { setError('Nama kegiatan wajib diisi.'); return }
    if (!tanggal) { setError('Tanggal kegiatan wajib diisi.'); return }

    setLoading(true)
    setError('')
    try {
      const payload = {
        nama,
        deskripsi: deskripsi || undefined,
        tanggal: new Date(tanggal).toISOString(),
        lokasi: lokasi || undefined,
        kuota_peserta: kuota !== '' ? Number(kuota) : null,
      }
      if (isEdit) {
        await updateKegiatan(id!, payload)
      } else {
        await createKegiatan(payload)
      }
      navigate('/kegiatan')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
      const detail = axiosErr.response?.data?.errors
      if (detail) {
        const msgs = Object.values(detail).flat()
        setError(msgs.join(' '))
      } else {
        setError(axiosErr.response?.data?.message ?? 'Gagal menyimpan kegiatan.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 lg:px-8">
      <div className="mb-6">
        <button onClick={() => navigate('/kegiatan')} className="text-sm text-gray-500 hover:text-gray-700">
          ← Kembali
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mt-3">
          {isEdit ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nama Kegiatan <span className="text-red-500">*</span>
          </label>
          <input
            id="nama-kegiatan"
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
            maxLength={255}
            placeholder="Contoh: Kerja Bakti Bulanan"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tanggal & Waktu <span className="text-red-500">*</span>
          </label>
          <input
            id="tanggal-kegiatan"
            type="datetime-local"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Lokasi</label>
          <input
            id="lokasi-kegiatan"
            type="text"
            value={lokasi}
            onChange={(e) => setLokasi(e.target.value)}
            maxLength={255}
            placeholder="Contoh: Balai RT Blok B"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Deskripsi <span className="text-gray-400 font-normal">(opsional)</span>
          </label>
          <textarea
            id="deskripsi-kegiatan"
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            rows={4}
            placeholder="Jelaskan detail kegiatan..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Kuota Peserta <span className="text-gray-400 font-normal">(opsional, kosongkan = tanpa batas)</span>
          </label>
          <input
            id="kuota-kegiatan"
            type="number"
            value={kuota}
            onChange={(e) => setKuota(e.target.value === '' ? '' : Number(e.target.value))}
            min={1}
            placeholder="Contoh: 50"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/kegiatan')}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            id="submit-kegiatan"
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Kegiatan'}
          </button>
        </div>
      </form>
    </div>
  )
}
