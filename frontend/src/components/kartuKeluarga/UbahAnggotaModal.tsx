import { useState } from 'react'
import { CheckCircle2, Edit2, X } from 'lucide-react'

import { createPengajuanUbah } from '@/services/kartuKeluargaService'
import type { AnggotaKK } from '@/types/kartuKeluarga'
import { HUBUNGAN_LABEL, HUBUNGAN_ORDER } from '@/types/kartuKeluarga'

const INPUT = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900'

interface Props {
  anggota: AnggotaKK
  onClose: () => void
  onSuccess: () => void
}

const FIELDS: [string, string, 'text' | 'date' | 'textarea'][] = [
  ['nama_lengkap', 'Nama Lengkap', 'text'],
  ['nik', 'NIK', 'text'],
  ['tempat_lahir', 'Tempat Lahir', 'text'],
  ['tanggal_lahir', 'Tanggal Lahir', 'date'],
  ['agama', 'Agama', 'text'],
  ['pendidikan', 'Pendidikan', 'text'],
  ['pekerjaan', 'Pekerjaan', 'text'],
  ['blok', 'Blok', 'text'],
  ['no_rumah', 'No. Rumah', 'text'],
  ['alamat', 'Alamat', 'textarea'],
]

function toOriginal(a: AnggotaKK): Record<string, string> {
  return {
    nama_lengkap: a.namaLengkap ?? '',
    nik: a.nik ?? '',
    tempat_lahir: a.tempatLahir ?? '',
    tanggal_lahir: a.tanggalLahir ?? '',
    agama: a.agama ?? '',
    status_perkawinan: a.statusPerkawinan ?? '',
    hubungan_keluarga: a.hubunganKeluarga ?? '',
    pendidikan: a.pendidikan ?? '',
    pekerjaan: a.pekerjaan ?? '',
    blok: a.blok ?? '',
    no_rumah: a.noRumah ?? '',
    alamat: a.alamat ?? '',
  }
}

export function UbahAnggotaModal({ anggota, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<Record<string, string>>(toOriginal(anggota))
  const [alasan, setAlasan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function computeChanges(): Record<string, string> {
    const original = toOriginal(anggota)
    const changes: Record<string, string> = {}
    for (const [k, v] of Object.entries(form)) {
      if (v !== original[k]) changes[k] = v
    }
    return changes
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!alasan.trim()) { setError('Alasan perubahan wajib diisi.'); return }
    const changes = computeChanges()
    if (Object.keys(changes).length === 0) { setError('Tidak ada perubahan yang dibuat.'); return }
    setSaving(true)
    setError('')
    try {
      await createPengajuanUbah({ wargaTargetId: anggota.id, fieldChanges: changes, alasan })
      setSuccess(true)
    } catch {
      setError('Gagal mengirim pengajuan. Silakan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  function set(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }))
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Ajukan Perubahan Data</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pengajuan Terkirim!</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Perubahan data akan diterapkan setelah admin menyetujui.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { onSuccess(); onClose() }}
              className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Tutup
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-col">
            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <p className="mb-4 text-xs text-slate-400 dark:text-slate-500">
                Ubah data <strong className="text-slate-600 dark:text-slate-300">{anggota.namaLengkap}</strong> yang perlu diperbaiki.
                Hanya field yang berubah yang akan dikirim ke admin.
              </p>

              {error && (
                <div className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {FIELDS.map(([key, label, type]) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
                    {type === 'textarea' ? (
                      <textarea rows={2} className={INPUT} value={form[key] ?? ''}
                        onChange={(e) => set(key, e.target.value)} />
                    ) : (
                      <input type={type} className={INPUT} value={form[key] ?? ''}
                        onChange={(e) => set(key, e.target.value)} />
                    )}
                  </div>
                ))}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Status Perkawinan</label>
                  <select className={INPUT} value={form.status_perkawinan ?? ''}
                    onChange={(e) => set('status_perkawinan', e.target.value)}>
                    <option value="">—</option>
                    <option value="belum_kawin">Belum Kawin</option>
                    <option value="kawin">Kawin</option>
                    <option value="cerai_hidup">Cerai Hidup</option>
                    <option value="cerai_mati">Cerai Mati</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Hubungan Keluarga</label>
                  <select className={INPUT} value={form.hubungan_keluarga ?? ''}
                    onChange={(e) => set('hubungan_keluarga', e.target.value)}>
                    <option value="">—</option>
                    {HUBUNGAN_ORDER.map((h) => (
                      <option key={h} value={h}>{HUBUNGAN_LABEL[h]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Alasan Perubahan <span className="text-red-500">*</span>
                  </label>
                  <textarea rows={2} className={INPUT} value={alasan}
                    onChange={(e) => { setAlasan(e.target.value); setError('') }}
                    placeholder="Jelaskan mengapa data perlu diubah" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
                {saving ? 'Mengirim…' : 'Kirim Pengajuan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
