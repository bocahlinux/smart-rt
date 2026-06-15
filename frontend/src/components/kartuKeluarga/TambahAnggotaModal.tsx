import { useEffect, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { createPengajuanTambah } from '@/services/kartuKeluargaService'
import type { DataAnggotaPayload, HubunganKeluarga, KartuKeluarga } from '@/types/kartuKeluarga'
import { HUBUNGAN_LABEL, HUBUNGAN_ORDER } from '@/types/kartuKeluarga'

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-t border-slate-100 pt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:border-slate-700 dark:text-slate-500">
      {children}
    </p>
  )
}

interface Props {
  kk: KartuKeluarga
  onClose: () => void
  onSuccess: () => void
}

export function TambahAnggotaModal({ kk, onClose, onSuccess }: Props) {
  const kepala = kk.anggota.find((a) => a.hubunganKeluarga === 'kepala_keluarga') ?? kk.anggota[0]

  const [form, setForm] = useState<DataAnggotaPayload>({
    nama_lengkap: '',
    nik: '',
    hubungan_keluarga: 'anak',
    jenis_kelamin: undefined,
    tanggal_lahir: '',
    tempat_lahir: '',
    agama: '',
    status_perkawinan: '',
    pendidikan: '',
    pekerjaan: '',
    blok: kepala?.blok || '',
    no_rumah: kepala?.noRumah || '',
    alamat: kk.alamat || kepala?.alamat || '',
  })
  const [alasan, setAlasan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function set<K extends keyof DataAnggotaPayload>(key: K, value: DataAnggotaPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama_lengkap.trim()) { setError('Nama lengkap wajib diisi.'); return }
    setSaving(true)
    setError('')
    try {
      await createPengajuanTambah({ kartuKeluargaId: kk.id, dataAnggota: form, alasan })
      setDone(true)
    } catch {
      setError('Gagal mengirim pengajuan. Periksa data dan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet: bottom on mobile, centered on desktop */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center sm:inset-0 sm:items-center sm:px-4">
        <div className="relative flex w-full max-h-[92vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:max-w-2xl sm:max-h-[88vh] sm:rounded-2xl">

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Tambah Anggota Keluarga</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">KK {kk.noKk}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {done ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Pengajuan Terkirim!</h3>
                <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
                  Pengajuan penambahan anggota sudah dikirim ke admin untuk disetujui.
                </p>
                <button
                  onClick={() => { onSuccess(); onClose() }}
                  className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form id="tambah-anggota-form" onSubmit={(e) => void handleSubmit(e)}>
                <div className="space-y-4 px-5 py-4">
                  {error && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Identitas */}
                  <SectionHead>Identitas</SectionHead>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Field label="Nama Lengkap" required>
                        <input className={INPUT} value={form.nama_lengkap}
                          onChange={(e) => set('nama_lengkap', e.target.value)}
                          placeholder="Sesuai KTP / akta" />
                      </Field>
                    </div>

                    <Field label="NIK">
                      <input className={INPUT} value={form.nik ?? ''} maxLength={16}
                        onChange={(e) => set('nik', e.target.value)} placeholder="16 digit" />
                    </Field>

                    <Field label="Hubungan Keluarga" required>
                      <select className={INPUT} value={form.hubungan_keluarga}
                        onChange={(e) => set('hubungan_keluarga', e.target.value as HubunganKeluarga)}>
                        {HUBUNGAN_ORDER.map((h) => (
                          <option key={h} value={h}>{HUBUNGAN_LABEL[h]}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Jenis Kelamin">
                      <select className={INPUT} value={form.jenis_kelamin ?? ''}
                        onChange={(e) => set('jenis_kelamin', (e.target.value as 'L' | 'P') || undefined)}>
                        <option value="">—</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </Field>

                    <Field label="Tanggal Lahir">
                      <input type="date" className={INPUT} value={form.tanggal_lahir ?? ''}
                        onChange={(e) => set('tanggal_lahir', e.target.value)} />
                    </Field>

                    <Field label="Tempat Lahir">
                      <input className={INPUT} value={form.tempat_lahir ?? ''}
                        onChange={(e) => set('tempat_lahir', e.target.value)} />
                    </Field>

                    <Field label="Agama">
                      <input className={INPUT} value={form.agama ?? ''}
                        onChange={(e) => set('agama', e.target.value)}
                        placeholder="Islam, Kristen, dll." />
                    </Field>

                    <Field label="Status Perkawinan">
                      <select className={INPUT} value={form.status_perkawinan ?? ''}
                        onChange={(e) => set('status_perkawinan', e.target.value)}>
                        <option value="">—</option>
                        <option value="belum_kawin">Belum Kawin</option>
                        <option value="kawin">Kawin</option>
                        <option value="cerai_hidup">Cerai Hidup</option>
                        <option value="cerai_mati">Cerai Mati</option>
                      </select>
                    </Field>

                    <Field label="Pendidikan">
                      <input className={INPUT} value={form.pendidikan ?? ''}
                        onChange={(e) => set('pendidikan', e.target.value)} placeholder="S1, SMA, dll." />
                    </Field>

                    <Field label="Pekerjaan">
                      <input className={INPUT} value={form.pekerjaan ?? ''}
                        onChange={(e) => set('pekerjaan', e.target.value)} />
                    </Field>
                  </div>

                  {/* Domisili */}
                  <SectionHead>Domisili</SectionHead>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Terisi otomatis dari KK. Sesuaikan jika berbeda.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Blok">
                      <input className={INPUT} value={form.blok ?? ''}
                        onChange={(e) => set('blok', e.target.value)} placeholder="A, B, C…" />
                    </Field>

                    <Field label="No. Rumah">
                      <input className={INPUT} value={form.no_rumah ?? ''}
                        onChange={(e) => set('no_rumah', e.target.value)} />
                    </Field>

                    <div className="col-span-2">
                      <Field label="Alamat">
                        <textarea rows={2} className={INPUT} value={form.alamat ?? ''}
                          onChange={(e) => set('alamat', e.target.value)} />
                      </Field>
                    </div>
                  </div>

                  {/* Keterangan */}
                  <SectionHead>Keterangan</SectionHead>
                  <Field label="Alasan / Catatan">
                    <textarea rows={2} className={INPUT} value={alasan}
                      onChange={(e) => setAlasan(e.target.value)}
                      placeholder="Opsional — jelaskan jika diperlukan" />
                  </Field>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          {!done && (
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="submit"
                form="tambah-anggota-form"
                disabled={saving}
                className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {saving ? 'Mengirim…' : 'Kirim Pengajuan'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
