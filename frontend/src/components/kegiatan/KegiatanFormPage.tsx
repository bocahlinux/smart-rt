import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { cn } from '@/lib/utils'
import { createKegiatan, getKegiatan, updateKegiatan } from '../../services/kegiatanService'

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

function toLocalDateStr(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toLocalTimeStr(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function KegiatanFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [nama, setNama] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [tanggal, setTanggal] = useState('')      // date string YYYY-MM-DD
  const [jamMulai, setJamMulai] = useState('')    // time string HH:mm
  const [jamSelesai, setJamSelesai] = useState('') // time string HH:mm (optional)
  const [lokasi, setLokasi] = useState('')
  const [kuota, setKuota] = useState<number | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit) {
      getKegiatan(id!).then((k) => {
        setNama(k.nama)
        setDeskripsi(k.deskripsi ?? '')
        setTanggal(toLocalDateStr(k.tanggal))
        setJamMulai(toLocalTimeStr(k.tanggal))
        setJamSelesai(k.tanggalSelesai ? toLocalTimeStr(k.tanggalSelesai) : '')
        setLokasi(k.lokasi ?? '')
        setKuota(k.kuotaPeserta ?? '')
      }).catch(() => setError('Gagal memuat data kegiatan.'))
    }
  }, [id, isEdit])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim()) { setError('Nama kegiatan wajib diisi.'); return }
    if (!tanggal) { setError('Tanggal kegiatan wajib diisi.'); return }
    if (!jamMulai) { setError('Jam mulai kegiatan wajib diisi.'); return }
    setLoading(true)
    setError('')
    try {
      const tanggalMulai = new Date(`${tanggal}T${jamMulai}:00`).toISOString()
      const tanggalSelesai = jamSelesai ? new Date(`${tanggal}T${jamSelesai}:00`).toISOString() : null
      const payload = {
        nama,
        deskripsi: deskripsi || undefined,
        tanggal: tanggalMulai,
        tanggal_selesai: tanggalSelesai,
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
        setError(Object.values(detail).flat().join(' '))
      } else {
        setError(axiosErr.response?.data?.message ?? 'Gagal menyimpan kegiatan.')
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
          to="/kegiatan"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">
            {isEdit ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isEdit ? 'Perbarui detail kegiatan RT' : 'Buat jadwal kegiatan baru'}
          </p>
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
            Nama Kegiatan<span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
            maxLength={255}
            placeholder="Contoh: Kerja Bakti Bulanan"
            className={INPUT}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Tanggal<span className="ml-0.5 text-red-500">*</span>
          </label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            required
            className={INPUT}
          />
        </div>

        {/* Jam mulai & selesai side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Jam Mulai<span className="ml-0.5 text-red-500">*</span>
            </label>
            <input
              type="time"
              value={jamMulai}
              onChange={(e) => setJamMulai(e.target.value)}
              required
              className={INPUT}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Jam Selesai{' '}
              <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <input
              type="time"
              value={jamSelesai}
              onChange={(e) => setJamSelesai(e.target.value)}
              className={INPUT}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Lokasi
          </label>
          <input
            type="text"
            value={lokasi}
            onChange={(e) => setLokasi(e.target.value)}
            maxLength={255}
            placeholder="Contoh: Balai RT Blok B"
            className={INPUT}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Deskripsi{' '}
            <span className="font-normal text-slate-400">(opsional)</span>
          </label>
          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            rows={4}
            placeholder="Jelaskan detail kegiatan..."
            className={cn(INPUT, 'resize-none')}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Kuota Peserta{' '}
            <span className="font-normal text-slate-400">(opsional, kosongkan = tanpa batas)</span>
          </label>
          <input
            type="number"
            value={kuota}
            onChange={(e) => setKuota(e.target.value === '' ? '' : Number(e.target.value))}
            min={1}
            placeholder="Contoh: 50"
            className={INPUT}
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Kegiatan'}
          </button>
          <Link
            to="/kegiatan"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  )
}
