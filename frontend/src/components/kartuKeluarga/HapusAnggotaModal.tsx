import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { createPengajuanHapus } from '@/services/kartuKeluargaService'
import type { KartuKeluarga, AnggotaKK } from '@/types/kartuKeluarga'

interface Props {
  kk: KartuKeluarga
  anggota: AnggotaKK
  onClose: () => void
  onSubmitted: () => void
}

export function HapusAnggotaModal({ kk, anggota, onClose, onSubmitted }: Props) {
  const [alasan, setAlasan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!alasan.trim()) { setError('Alasan wajib diisi.'); return }
    setSaving(true)
    setError('')
    try {
      await createPengajuanHapus({ kartuKeluargaId: kk.id, wargaTargetId: anggota.id, alasan })
      onSubmitted()
    } catch {
      setError('Gagal mengirim pengajuan. Coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Ajukan Penghapusan Anggota</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Anda akan mengajukan penghapusan <strong>{anggota.namaLengkap}</strong> dari KK {kk.noKk}.
            Pengajuan ini akan ditinjau oleh admin.
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Alasan Penghapusan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={alasan}
              onChange={(e) => { setAlasan(e.target.value); setError('') }}
              placeholder="Jelaskan alasan penghapusan (pindah, meninggal, dll.)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Batal
          </button>
          <button type="button" disabled={saving} onClick={() => void handleSubmit()}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60">
            {saving ? 'Mengirim…' : 'Kirim Pengajuan'}
          </button>
        </div>
      </div>
    </div>
  )
}
