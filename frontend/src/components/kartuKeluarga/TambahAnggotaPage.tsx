import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

import { getKK, createPengajuanTambah } from '@/services/kartuKeluargaService'
import type { KartuKeluarga, DataAnggotaPayload, HubunganKeluarga } from '@/types/kartuKeluarga'
import { HUBUNGAN_LABEL, HUBUNGAN_ORDER } from '@/types/kartuKeluarga'

const INPUT = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white'

const INITIAL: DataAnggotaPayload = {
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
  blok: '',
  no_rumah: '',
  alamat: '',
}

export function TambahAnggotaPage() {
  const { kkId } = useParams<{ kkId: string }>()
  const navigate = useNavigate()

  const [kk, setKK] = useState<KartuKeluarga | null>(null)
  const [form, setForm] = useState<DataAnggotaPayload>(INITIAL)
  const [alasan, setAlasan] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!kkId) return
    getKK(kkId).then(setKK).catch(() => setError('Gagal memuat data KK.'))
  }, [kkId])

  function set<K extends keyof DataAnggotaPayload>(key: K, value: DataAnggotaPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama_lengkap.trim()) { setError('Nama lengkap wajib diisi.'); return }
    if (!kkId) return
    setSaving(true)
    setError('')
    try {
      await createPengajuanTambah({
        kartuKeluargaId: kkId,
        dataAnggota: form,
        alasan,
      })
      setSuccess(true)
    } catch {
      setError('Gagal mengirim pengajuan. Periksa data dan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Pengajuan Terkirim!</h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Pengajuan penambahan anggota keluarga sudah dikirim ke admin untuk disetujui.
        </p>
        <button
          onClick={() => navigate(`/kk/${kkId}`)}
          className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Kembali ke Kartu Keluarga
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8">
      <nav className="mb-5 flex items-center gap-1 text-sm text-slate-500">
        <button onClick={() => navigate(`/kk/${kkId}`)} className="hover:text-slate-700 dark:hover:text-slate-200">
          KK {kk?.noKk ?? '…'}
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-900 dark:text-white">Tambah Anggota</span>
      </nav>

      <h1 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Tambah Anggota Keluarga</h1>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Pengajuan ini akan dikirim ke admin untuk diverifikasi sebelum anggota ditambahkan ke KK.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input className={INPUT} value={form.nama_lengkap}
              onChange={(e) => set('nama_lengkap', e.target.value)}
              placeholder="Sesuai KTP/akta" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">NIK</label>
            <input className={INPUT} value={form.nik ?? ''} maxLength={16}
              onChange={(e) => set('nik', e.target.value)}
              placeholder="16 digit" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Hubungan Keluarga <span className="text-red-500">*</span>
            </label>
            <select className={INPUT} value={form.hubungan_keluarga}
              onChange={(e) => set('hubungan_keluarga', e.target.value as HubunganKeluarga)}>
              {HUBUNGAN_ORDER.map((h) => (
                <option key={h} value={h}>{HUBUNGAN_LABEL[h]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Jenis Kelamin</label>
            <select className={INPUT} value={form.jenis_kelamin ?? ''}
              onChange={(e) => set('jenis_kelamin', (e.target.value as 'L' | 'P') || undefined)}>
              <option value="">—</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Tanggal Lahir</label>
            <input type="date" className={INPUT} value={form.tanggal_lahir ?? ''}
              onChange={(e) => set('tanggal_lahir', e.target.value)} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Tempat Lahir</label>
            <input className={INPUT} value={form.tempat_lahir ?? ''}
              onChange={(e) => set('tempat_lahir', e.target.value)} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Agama</label>
            <input className={INPUT} value={form.agama ?? ''}
              onChange={(e) => set('agama', e.target.value)}
              placeholder="Islam, Kristen, dll." />
          </div>

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
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Pendidikan</label>
            <input className={INPUT} value={form.pendidikan ?? ''}
              onChange={(e) => set('pendidikan', e.target.value)}
              placeholder="S1, SMA, dll." />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Pekerjaan</label>
            <input className={INPUT} value={form.pekerjaan ?? ''}
              onChange={(e) => set('pekerjaan', e.target.value)} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Blok</label>
            <input className={INPUT} value={form.blok ?? ''}
              onChange={(e) => set('blok', e.target.value)} placeholder="A, B, C…" />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">No. Rumah</label>
            <input className={INPUT} value={form.no_rumah ?? ''}
              onChange={(e) => set('no_rumah', e.target.value)} />
          </div>

          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Alamat</label>
            <textarea rows={2} className={INPUT} value={form.alamat ?? ''}
              onChange={(e) => set('alamat', e.target.value)} />
          </div>

          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Alasan / Keterangan Tambahan
            </label>
            <textarea rows={2} className={INPUT} value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Opsional — jelaskan jika diperlukan" />
          </div>
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
