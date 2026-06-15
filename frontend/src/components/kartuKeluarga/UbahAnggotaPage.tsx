import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

import { getWarga } from '@/services/wargaService'
import { createPengajuanUbah } from '@/services/kartuKeluargaService'
import type { WargaFull } from '@/types/warga'

const INPUT = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white'

export function UbahAnggotaPage() {
  const { kkId, wargaId } = useParams<{ kkId: string; wargaId: string }>()
  const navigate = useNavigate()

  const [warga, setWarga] = useState<WargaFull | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [alasan, setAlasan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!wargaId) return
    getWarga(wargaId).then((w) => {
      setWarga(w)
      setForm({
        nama_lengkap: w.namaLengkap ?? '',
        nik: w.nik ?? '',
        tempat_lahir: w.tempatLahir ?? '',
        tanggal_lahir: w.tanggalLahir ?? '',
        agama: w.agama ?? '',
        pendidikan: w.pendidikan ?? '',
        pekerjaan: w.pekerjaan ?? '',
        blok: w.blok ?? '',
        no_rumah: w.noRumah ?? '',
        alamat: w.alamat ?? '',
      })
    }).catch(() => setError('Gagal memuat data warga.'))
  }, [wargaId])

  function computeChanges(): Record<string, string> {
    if (!warga) return {}
    const original: Record<string, string> = {
      nama_lengkap: warga.namaLengkap ?? '',
      nik: warga.nik ?? '',
      tempat_lahir: warga.tempatLahir ?? '',
      tanggal_lahir: warga.tanggalLahir ?? '',
      agama: warga.agama ?? '',
      pendidikan: warga.pendidikan ?? '',
      pekerjaan: warga.pekerjaan ?? '',
      blok: warga.blok ?? '',
      no_rumah: warga.noRumah ?? '',
      alamat: warga.alamat ?? '',
    }
    const changes: Record<string, string> = {}
    for (const [k, v] of Object.entries(form)) {
      if (v !== original[k]) changes[k] = v
    }
    return changes
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!alasan.trim()) { setError('Alasan wajib diisi.'); return }
    const changes = computeChanges()
    if (Object.keys(changes).length === 0) { setError('Tidak ada perubahan yang dibuat.'); return }
    if (!wargaId) return
    setSaving(true)
    setError('')
    try {
      await createPengajuanUbah({ wargaTargetId: wargaId, fieldChanges: changes, alasan })
      setSuccess(true)
    } catch {
      setError('Gagal mengirim pengajuan.')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Pengajuan Terkirim!</h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Perubahan data akan diterapkan setelah admin menyetujui.</p>
        <button onClick={() => navigate(`/kk/${kkId}`)}
          className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
          Kembali ke Kartu Keluarga
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8">
      <nav className="mb-5 flex items-center gap-1 text-sm text-slate-500">
        <button onClick={() => navigate(`/kk/${kkId}`)} className="hover:text-slate-700 dark:hover:text-slate-200">
          Kartu Keluarga
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-900 dark:text-white">Ajukan Perubahan Data</span>
      </nav>

      <h1 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Ajukan Perubahan Data</h1>
      {warga && <p className="mb-6 text-sm text-slate-500">{warga.namaLengkap}</p>}

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Ubah data yang perlu diperbaiki. Perubahan akan dikirim ke admin untuk disetujui.
        </p>

        {([
          ['nama_lengkap', 'Nama Lengkap'],
          ['nik', 'NIK'],
          ['tempat_lahir', 'Tempat Lahir'],
          ['tanggal_lahir', 'Tanggal Lahir'],
          ['agama', 'Agama'],
          ['pendidikan', 'Pendidikan'],
          ['pekerjaan', 'Pekerjaan'],
          ['blok', 'Blok'],
          ['no_rumah', 'No. Rumah'],
          ['alamat', 'Alamat'],
        ] as [string, string][]).map(([key, label]) => (
          <div key={key}>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
            {key === 'tanggal_lahir' ? (
              <input type="date" className={INPUT} value={form[key] ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} />
            ) : key === 'alamat' ? (
              <textarea rows={2} className={INPUT} value={form[key] ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} />
            ) : (
              <input className={INPUT} value={form[key] ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} />
            )}
          </div>
        ))}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Alasan Perubahan <span className="text-red-500">*</span>
          </label>
          <textarea rows={2} className={INPUT} value={alasan}
            onChange={(e) => { setAlasan(e.target.value); setError('') }}
            placeholder="Jelaskan mengapa data perlu diubah" />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button type="button" onClick={() => navigate(`/kk/${kkId}`)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Batal
          </button>
          <button type="submit" disabled={saving}
            className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
            {saving ? 'Mengirim…' : 'Kirim Pengajuan'}
          </button>
        </div>
      </form>
    </div>
  )
}
