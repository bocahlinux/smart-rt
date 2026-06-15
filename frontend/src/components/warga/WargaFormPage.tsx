/**
 * Form buat/edit data warga — admin dan sekretaris.
 * Tasks: 3.18
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { createWarga, getWarga, updateWarga } from '../../services/wargaService'
import { createKK, listKK } from '../../services/kartuKeluargaService'
import type { JenisKelamin, StatusPerkawinan, WargaFormPayload, WargaStatus } from '../../types/warga'
import type { KartuKeluarga } from '../../types/kartuKeluarga'
import { HUBUNGAN_LABEL, HUBUNGAN_ORDER, type HubunganKeluarga } from '../../types/kartuKeluarga'

interface FormState {
  userId: string
  nik: string
  namaLengkap: string
  tempatLahir: string
  tanggalLahir: string
  jenisKelamin: JenisKelamin | ''
  agama: string
  statusPerkawinan: StatusPerkawinan | ''
  pendidikan: string
  pekerjaan: string
  kartuKeluargaId: string
  hubunganKeluarga: HubunganKeluarga | ''
  alamat: string
  blok: string
  noRumah: string
  status: WargaStatus
}

const INITIAL: FormState = {
  userId: '',
  nik: '',
  namaLengkap: '',
  tempatLahir: '',
  tanggalLahir: '',
  jenisKelamin: '',
  agama: '',
  statusPerkawinan: '',
  pendidikan: '',
  pekerjaan: '',
  kartuKeluargaId: '',
  hubunganKeluarga: '',
  alamat: '',
  blok: '',
  noRumah: '',
  status: 'aktif',
}

function toPayload(f: FormState, isEdit: boolean): WargaFormPayload {
  return {
    ...(isEdit ? {} : { userId: f.userId || undefined }),
    nik: f.nik || undefined,
    namaLengkap: f.namaLengkap,
    tempatLahir: f.tempatLahir || undefined,
    tanggalLahir: f.tanggalLahir || undefined,
    jenisKelamin: (f.jenisKelamin as JenisKelamin) || undefined,
    agama: f.agama || undefined,
    statusPerkawinan: (f.statusPerkawinan as StatusPerkawinan) || undefined,
    pendidikan: f.pendidikan || undefined,
    pekerjaan: f.pekerjaan || undefined,
    kartuKeluargaId: f.kartuKeluargaId || undefined,
    hubunganKeluarga: f.hubunganKeluarga || undefined,
    alamat: f.alamat || undefined,
    blok: f.blok || undefined,
    noRumah: f.noRumah || undefined,
    status: f.status || undefined,
  }
}

interface FieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
}
function Field({ label, required, children }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white'

export function WargaFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormState>(INITIAL)
  const [kkList, setKkList] = useState<KartuKeluarga[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // KK combo-search state
  const [kkSearch, setKkSearch] = useState('')
  const [kkOpen, setKkOpen] = useState(false)
  const [kkCreating, setKkCreating] = useState(false)
  const kkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listKK().then(setKkList).catch(() => {})
  }, [])

  // Tutup dropdown KK saat klik di luar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (kkRef.current && !kkRef.current.contains(e.target as Node)) {
        setKkOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!id) return
    getWarga(id)
      .then((w) => {
        setForm({
          userId: w.userId ?? '',
          nik: w.nik ?? '',
          namaLengkap: w.namaLengkap,
          tempatLahir: w.tempatLahir ?? '',
          tanggalLahir: w.tanggalLahir ?? '',
          jenisKelamin: (w.jenisKelamin as JenisKelamin) ?? '',
          agama: w.agama ?? '',
          statusPerkawinan: (w.statusPerkawinan as StatusPerkawinan) ?? '',
          pendidikan: w.pendidikan ?? '',
          pekerjaan: w.pekerjaan ?? '',
          kartuKeluargaId: w.kartuKeluargaId ?? '',
          hubunganKeluarga: (w.hubunganKeluarga as HubunganKeluarga) ?? '',
          alamat: w.alamat ?? '',
          blok: w.blok ?? '',
          noRumah: w.noRumah ?? '',
          status: w.status,
        })
        // Tampilkan nomor KK di combo input jika sudah punya KK
        if (w.noKk) setKkSearch(w.noKk)
      })
      .catch(() => setError('Gagal memuat data warga.'))
      .finally(() => setLoading(false))
  }, [id])

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const kkFiltered = kkSearch.trim()
    ? kkList.filter((kk) => kk.noKk.includes(kkSearch.trim()))
    : kkList

  const kkExactMatch = kkList.find((kk) => kk.noKk === kkSearch.trim())
  const canCreateKK = kkSearch.trim().length === 16 && !kkExactMatch

  function selectKK(kk: KartuKeluarga) {
    set('kartuKeluargaId', kk.id)
    setKkSearch(kk.noKk)
    setKkOpen(false)
  }

  async function handleBuatKK() {
    const noKk = kkSearch.trim()
    if (noKk.length !== 16) return
    setKkCreating(true)
    try {
      const newKK = await createKK({ noKk })
      setKkList((prev) => [...prev, newKK])
      selectKK(newKK)
    } catch {
      setError('Gagal membuat Kartu Keluarga baru.')
    } finally {
      setKkCreating(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.namaLengkap.trim()) {
      setError('Nama lengkap wajib diisi.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = toPayload(form, isEdit)
      if (isEdit && id) {
        const updated = await updateWarga(id, payload)
        navigate(`/warga/${updated.id}`)
      } else {
        const created = await createWarga(payload)
        navigate(`/warga/${created.id}`)
      }
    } catch {
      setError('Gagal menyimpan data warga. Periksa input dan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Memuat data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-900">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
          {isEdit ? 'Edit Data Warga' : 'Tambah Data Warga'}
        </h1>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          {/* Identitas */}
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Identitas</h2>

          <Field label="Nama Lengkap" required>
            <input
              className={INPUT}
              value={form.namaLengkap}
              onChange={(e) => set('namaLengkap', e.target.value)}
              placeholder="Nama lengkap sesuai KTP"
            />
          </Field>

          <Field label="NIK">
            <input
              className={INPUT}
              value={form.nik}
              onChange={(e) => set('nik', e.target.value)}
              placeholder="16 digit"
              maxLength={16}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tempat Lahir">
              <input
                className={INPUT}
                value={form.tempatLahir}
                onChange={(e) => set('tempatLahir', e.target.value)}
              />
            </Field>
            <Field label="Tanggal Lahir">
              <input
                type="date"
                className={INPUT}
                value={form.tanggalLahir}
                onChange={(e) => set('tanggalLahir', e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Jenis Kelamin">
              <select className={INPUT} value={form.jenisKelamin} onChange={(e) => set('jenisKelamin', e.target.value)}>
                <option value="">—</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </Field>
            <Field label="Agama">
              <input
                className={INPUT}
                value={form.agama}
                onChange={(e) => set('agama', e.target.value)}
                placeholder="Islam, Kristen, dll."
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status Perkawinan">
              <select className={INPUT} value={form.statusPerkawinan} onChange={(e) => set('statusPerkawinan', e.target.value)}>
                <option value="">—</option>
                <option value="belum_kawin">Belum Kawin</option>
                <option value="kawin">Kawin</option>
                <option value="cerai_hidup">Cerai Hidup</option>
                <option value="cerai_mati">Cerai Mati</option>
              </select>
            </Field>
            <Field label="Pendidikan">
              <input
                className={INPUT}
                value={form.pendidikan}
                onChange={(e) => set('pendidikan', e.target.value)}
                placeholder="S1, SMA, dll."
              />
            </Field>
          </div>

          <Field label="Pekerjaan">
            <input
              className={INPUT}
              value={form.pekerjaan}
              onChange={(e) => set('pekerjaan', e.target.value)}
            />
          </Field>

          {/* Domisili */}
          <h2 className="border-t border-slate-100 pt-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Domisili
          </h2>

          <Field label="Alamat">
            <textarea
              className={INPUT}
              rows={2}
              value={form.alamat}
              onChange={(e) => set('alamat', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Blok">
              <input
                className={INPUT}
                value={form.blok}
                onChange={(e) => set('blok', e.target.value)}
                placeholder="A, B, C..."
              />
            </Field>
            <Field label="No. Rumah">
              <input
                className={INPUT}
                value={form.noRumah}
                onChange={(e) => set('noRumah', e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Kartu Keluarga">
              <div ref={kkRef} className="relative">
                <input
                  className={INPUT}
                  value={kkSearch}
                  onChange={(e) => {
                    const val = e.target.value
                    setKkSearch(val)
                    // Auto-link jika nomor cocok persis dengan KK yang ada
                    const exact = kkList.find((kk) => kk.noKk === val.trim())
                    set('kartuKeluargaId', exact ? exact.id : '')
                    setKkOpen(true)
                  }}
                  onFocus={() => setKkOpen(true)}
                  placeholder="Ketik 16 digit No. KK"
                  maxLength={16}
                  autoComplete="off"
                />
                {kkOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
                    <ul className="max-h-48 overflow-y-auto py-1 text-sm">
                      {kkFiltered.length > 0
                        ? kkFiltered.map((kk) => (
                            <li
                              key={kk.id}
                              className="cursor-pointer px-3 py-2 hover:bg-indigo-50 dark:hover:bg-slate-700"
                              onMouseDown={() => selectKK(kk)}
                            >
                              <span className="font-mono">{kk.noKk}</span>
                              {kk.kepalaKeluarga && (
                                <span className="ml-2 text-xs text-slate-500">
                                  ({kk.kepalaKeluarga.namaLengkap})
                                </span>
                              )}
                            </li>
                          ))
                        : !canCreateKK && (
                            <li className="px-3 py-2 text-slate-400 dark:text-slate-500">
                              Tidak ada KK yang cocok
                            </li>
                          )}
                      {canCreateKK && (
                        <li
                          className="cursor-pointer border-t border-slate-100 px-3 py-2 font-medium text-indigo-600 hover:bg-indigo-50 dark:border-slate-700 dark:text-indigo-400 dark:hover:bg-slate-700"
                          onMouseDown={() => void handleBuatKK()}
                        >
                          {kkCreating ? 'Membuat KK...' : `+ Buat KK "${kkSearch.trim()}"`}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                {form.kartuKeluargaId && (
                  <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ KK terhubung</p>
                )}
              </div>
            </Field>
            <Field label="Hubungan Keluarga">
              <select
                className={INPUT}
                value={form.hubunganKeluarga}
                onChange={(e) => set('hubunganKeluarga', e.target.value as HubunganKeluarga)}
              >
                <option value="">— Pilih —</option>
                {HUBUNGAN_ORDER.map((h) => (
                  <option key={h} value={h}>{HUBUNGAN_LABEL[h]}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Status */}
          <h2 className="border-t border-slate-100 pt-4 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Status
          </h2>

          <Field label="Status Warga">
            <select className={INPUT} value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="aktif">Aktif</option>
              <option value="tidak_aktif">Tidak Aktif</option>
              <option value="pindah">Pindah</option>
              <option value="meninggal">Meninggal</option>
            </select>
          </Field>

          {/* User ID (opsional — untuk link ke akun) */}
          {!isEdit && (
            <Field label="User ID (UUID akun terdaftar, opsional)">
              <input
                className={INPUT}
                value={form.userId}
                onChange={(e) => set('userId', e.target.value)}
                placeholder="Kosongkan jika belum ada akun"
              />
            </Field>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={() => navigate(isEdit && id ? `/warga/${id}` : '/warga')}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Warga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
