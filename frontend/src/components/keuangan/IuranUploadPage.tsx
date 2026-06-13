/**
 * Halaman upload bukti iuran untuk warga.
 * Lihat docs/06-API-CONTRACT.md §4.6 dan docs/07-TASK-BREAKDOWN.md §4.15.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../stores/authStore'
import { getMyIuran, uploadIuran } from '../../services/keuanganService'
import type { MyIuran } from '../../types/keuangan'

const BULAN_LABELS = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'pdf']
const MAX_SIZE_MB = 5

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700' },
  lunas: { label: 'Lunas', cls: 'bg-emerald-100 text-emerald-700' },
  ditolak: { label: 'Ditolak', cls: 'bg-rose-100 text-rose-700' },
}

function formatRupiah(val: string | number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val))
}

export function IuranUploadPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()

  const [riwayat, setRiwayat] = useState<MyIuran[]>([])
  const [tahun, setTahun] = useState(currentYear)
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [jumlah, setJumlah] = useState('50000')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const profileId = (user as unknown as { profileId?: string })?.profileId
  // Gunakan ID dari warga profile — diambil dari data user jika tersedia

  useEffect(() => {
    loadRiwayat()
  }, [tahun])

  async function loadRiwayat() {
    try {
      const data = await getMyIuran(tahun)
      setRiwayat(data)
    } catch {
      // ignore — riwayat tidak kritis
    }
  }

  function validateFile(f: File): string {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTS.includes(ext)) return `Ekstensi tidak diizinkan: .${ext}. Gunakan: ${ALLOWED_EXTS.join(', ')}`
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `Ukuran file maksimal ${MAX_SIZE_MB}MB.`
    return ''
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setFileError(f ? validateFile(f) : '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Pilih file bukti transfer terlebih dahulu.'); return }
    if (fileError) { setError(fileError); return }

    setLoading(true)
    setError('')
    setSuccess('')
    try {
      // Ambil warga profile ID dari endpoint me atau dari auth store
      // Sementara gunakan endpoint upload yang akan redirect ke profil sendiri
      const resp = await fetch('/api/v1/auth/me/', {
        headers: { Authorization: `Bearer ${(window as unknown as { __accessToken?: string }).__accessToken ?? ''}` }
      })
      const me = await resp.json()
      const wargaProfileId = me?.data?.profile?.id

      if (!wargaProfileId) throw new Error('Profil warga tidak ditemukan. Hubungi pengurus.')

      await uploadIuran({ wargaId: wargaProfileId, bulan, tahun, jumlah: parseFloat(jumlah), bukti_transfer: file })
      setSuccess('Bukti transfer berhasil diupload. Menunggu konfirmasi bendahara.')
      setFile(null)
      loadRiwayat()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
        ?? (err as { message?: string })?.message
        ?? 'Gagal mengupload bukti transfer.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload Bukti Iuran</h1>

      {/* Form upload */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Form Upload Bukti Transfer</h2>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 mb-4 text-sm">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded px-4 py-3 mb-4 text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bulan<span className="text-red-500">*</span></label>
              <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                {BULAN_LABELS.slice(1).map((b, i) => (
                  <option key={i + 1} value={i + 1}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tahun<span className="text-red-500">*</span></label>
              <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                {[currentYear - 1, currentYear].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Iuran (Rp)<span className="text-red-500">*</span></label>
            <input type="number" value={jumlah} onChange={(e) => setJumlah(e.target.value)}
              min={1} required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bukti Transfer<span className="text-red-500">*</span></label>
            <input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileChange}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:text-sm file:bg-white file:text-gray-700 hover:file:bg-gray-50" />
            {fileError && <p className="text-xs text-red-600 mt-1">{fileError}</p>}
            <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG, WebP, PDF. Maks. 5MB.</p>
          </div>

          <button type="submit" disabled={loading || !!fileError}
            className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Mengupload...' : 'Upload Bukti'}
          </button>
        </form>
      </div>

      {/* Riwayat */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">Riwayat Iuran</h2>
          <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm">
            {[currentYear - 1, currentYear].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {riwayat.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada riwayat iuran untuk tahun {tahun}.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase border-b">
              <tr>
                <th className="py-2 text-left">Periode</th>
                <th className="py-2 text-right">Jumlah</th>
                <th className="py-2 text-center">Status</th>
                <th className="py-2 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {riwayat.map((r) => {
                const st = STATUS_LABEL[r.status] ?? { label: r.status, cls: '' }
                return (
                  <tr key={r.id}>
                    <td className="py-2">{BULAN_LABELS[r.bulan]} {r.tahun}</td>
                    <td className="py-2 text-right">{formatRupiah(r.jumlah)}</td>
                    <td className="py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="py-2 text-gray-500 text-xs">{r.keterangan || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
