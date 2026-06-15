import { useEffect, useRef, useState } from 'react'
import { X, UserCheck, UserX } from 'lucide-react'

import { cn } from '@/lib/utils'
import { createKK, listKK } from '@/services/kartuKeluargaService'
import { createWarga, getWarga, linkUser, unlinkUser, updateWarga } from '@/services/wargaService'
import { listUsers, type ManagedUser } from '@/services/userService'
import type { JenisKelamin, StatusPerkawinan, WargaFormPayload, WargaStatus } from '@/types/warga'
import type { KartuKeluarga } from '@/types/kartuKeluarga'
import { HUBUNGAN_LABEL, HUBUNGAN_ORDER, type HubunganKeluarga } from '@/types/kartuKeluarga'

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

interface LinkedUserInfo {
  email: string
  phone: string
  userStatus?: string
}

const INITIAL: FormState = {
  userId: '', nik: '', namaLengkap: '', tempatLahir: '', tanggalLahir: '',
  jenisKelamin: '', agama: '', statusPerkawinan: '', pendidikan: '', pekerjaan: '',
  kartuKeluargaId: '', hubunganKeluarga: '', alamat: '', blok: '', noRumah: '', status: 'aktif',
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

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:border-slate-700 dark:text-slate-500">
      {children}
    </p>
  )
}

const USER_STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu', active: 'Aktif', rejected: 'Ditolak',
}
const USER_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

interface Props {
  id?: string
  onClose: () => void
  onSuccess: (id: string, nama: string) => void
}

export function WargaFormModal({ id, onClose, onSuccess }: Props) {
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormState>(INITIAL)
  const [kkList, setKkList] = useState<KartuKeluarga[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [kkSearch, setKkSearch] = useState('')
  const [kkOpen, setKkOpen] = useState(false)
  const [kkCreating, setKkCreating] = useState(false)
  const kkRef = useRef<HTMLDivElement>(null)

  // Link/unlink state
  const [linkedInfo, setLinkedInfo] = useState<LinkedUserInfo | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<ManagedUser[]>([])
  const [userSearching, setUserSearching] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [linking, setLinking] = useState(false)
  const [linkError, setLinkError] = useState('')
  const userRef = useRef<HTMLDivElement>(null)

  // Body scroll lock + ESC
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    listKK().then(setKkList).catch(() => {})
  }, [])

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (kkRef.current && !kkRef.current.contains(e.target as Node)) setKkOpen(false)
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

  useEffect(() => {
    if (!id) return
    setLoading(true)
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
        if (w.noKk) setKkSearch(w.noKk)
        if (w.userId && (w.email || w.phone)) {
          setLinkedInfo({
            email: w.email ?? '',
            phone: w.phone ?? '',
            userStatus: w.userStatus,
          })
        }
      })
      .catch(() => setError('Gagal memuat data warga.'))
      .finally(() => setLoading(false))
  }, [id])

  // Debounce user search
  useEffect(() => {
    const q = userSearch.trim()
    if (q.length < 2) { setUserResults([]); return }
    const timer = setTimeout(async () => {
      setUserSearching(true)
      try {
        const res = await listUsers({ search: q })
        // only show users that are not linked to another warga
        setUserResults(res.results.filter((u) => !u.warga))
      } catch {
        setUserResults([])
      } finally {
        setUserSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearch])

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const kkFiltered = kkSearch.trim() ? kkList.filter((kk) => kk.noKk.includes(kkSearch.trim())) : kkList
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

  async function handleUnlink() {
    if (!id) return
    setUnlinking(true)
    setLinkError('')
    try {
      await unlinkUser(id)
      setForm((prev) => ({ ...prev, userId: '' }))
      setLinkedInfo(null)
    } catch {
      setLinkError('Gagal melepas link akun pengguna.')
    } finally {
      setUnlinking(false)
    }
  }

  async function handleLink(user: ManagedUser) {
    if (!id) return
    setLinking(true)
    setLinkError('')
    try {
      await linkUser(id, user.id)
      setForm((prev) => ({ ...prev, userId: user.id }))
      setLinkedInfo({ email: user.email, phone: user.phone, userStatus: user.status })
      setUserSearch('')
      setUserResults([])
      setUserOpen(false)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setLinkError(msg ?? 'Gagal menghubungkan akun. Pastikan akun belum terhubung ke warga lain.')
    } finally {
      setLinking(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.namaLengkap.trim()) { setError('Nama lengkap wajib diisi.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = toPayload(form, isEdit)
      if (isEdit && id) {
        const updated = await updateWarga(id, payload)
        onSuccess(updated.id, updated.namaLengkap)
      } else {
        const created = await createWarga(payload)
        onSuccess(created.id, created.namaLengkap)
      }
    } catch {
      setError('Gagal menyimpan data. Periksa input dan coba lagi.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />

      {/* Modal shell */}
      <div className={cn(
        'relative z-10 flex max-h-[92dvh] w-full flex-col bg-white dark:bg-slate-900',
        'rounded-t-3xl sm:max-w-2xl sm:rounded-2xl',
      )}>
        {/* Drag handle (mobile) */}
        <div className="flex shrink-0 justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {isEdit ? 'Edit Data Warga' : 'Tambah Data Warga'}
          </h2>
          <button type="button" onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                  {error}
                </p>
              )}

              {/* Identitas */}
              <SectionHead>Identitas</SectionHead>

              <Field label="Nama Lengkap" required>
                <input className={INPUT} value={form.namaLengkap}
                  onChange={(e) => set('namaLengkap', e.target.value)}
                  placeholder="Nama lengkap sesuai KTP" />
              </Field>

              <Field label="NIK">
                <input className={INPUT} value={form.nik}
                  onChange={(e) => set('nik', e.target.value)}
                  placeholder="16 digit" maxLength={16} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Tempat Lahir">
                  <input className={INPUT} value={form.tempatLahir}
                    onChange={(e) => set('tempatLahir', e.target.value)} />
                </Field>
                <Field label="Tanggal Lahir">
                  <input type="date" className={INPUT} value={form.tanggalLahir}
                    onChange={(e) => set('tanggalLahir', e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Jenis Kelamin">
                  <select className={INPUT} value={form.jenisKelamin}
                    onChange={(e) => set('jenisKelamin', e.target.value)}>
                    <option value="">—</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </Field>
                <Field label="Agama">
                  <input className={INPUT} value={form.agama}
                    onChange={(e) => set('agama', e.target.value)}
                    placeholder="Islam, Kristen, dll." />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Status Perkawinan">
                  <select className={INPUT} value={form.statusPerkawinan}
                    onChange={(e) => set('statusPerkawinan', e.target.value)}>
                    <option value="">—</option>
                    <option value="belum_kawin">Belum Kawin</option>
                    <option value="kawin">Kawin</option>
                    <option value="cerai_hidup">Cerai Hidup</option>
                    <option value="cerai_mati">Cerai Mati</option>
                  </select>
                </Field>
                <Field label="Pendidikan">
                  <input className={INPUT} value={form.pendidikan}
                    onChange={(e) => set('pendidikan', e.target.value)}
                    placeholder="S1, SMA, dll." />
                </Field>
              </div>

              <Field label="Pekerjaan">
                <input className={INPUT} value={form.pekerjaan}
                  onChange={(e) => set('pekerjaan', e.target.value)} />
              </Field>

              {/* Domisili */}
              <SectionHead>Domisili</SectionHead>

              <Field label="Alamat">
                <textarea className={INPUT} rows={2} value={form.alamat}
                  onChange={(e) => set('alamat', e.target.value)} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Blok">
                  <input className={INPUT} value={form.blok}
                    onChange={(e) => set('blok', e.target.value)}
                    placeholder="A, B, C..." />
                </Field>
                <Field label="No. Rumah">
                  <input className={INPUT} value={form.noRumah}
                    onChange={(e) => set('noRumah', e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Kartu Keluarga">
                  <div ref={kkRef} className="relative">
                    <input className={INPUT} value={kkSearch}
                      onChange={(e) => {
                        const val = e.target.value
                        setKkSearch(val)
                        const exact = kkList.find((kk) => kk.noKk === val.trim())
                        set('kartuKeluargaId', exact ? exact.id : '')
                        setKkOpen(true)
                      }}
                      onFocus={() => setKkOpen(true)}
                      placeholder="Ketik 16 digit No. KK"
                      maxLength={16} autoComplete="off" />
                    {kkOpen && (
                      <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
                        <ul className="max-h-44 overflow-y-auto py-1 text-sm">
                          {kkFiltered.length > 0
                            ? kkFiltered.map((kk) => (
                                <li key={kk.id}
                                  className="cursor-pointer px-3 py-2 hover:bg-primary-50 dark:hover:bg-slate-700"
                                  onMouseDown={() => selectKK(kk)}>
                                  <span className="font-mono">{kk.noKk}</span>
                                  {kk.kepalaKeluarga && (
                                    <span className="ml-2 text-xs text-slate-500">({kk.kepalaKeluarga.namaLengkap})</span>
                                  )}
                                </li>
                              ))
                            : !canCreateKK && (
                                <li className="px-3 py-2 text-slate-400">Tidak ada KK yang cocok</li>
                              )}
                          {canCreateKK && (
                            <li className="cursor-pointer border-t border-slate-100 px-3 py-2 font-medium text-primary-600 hover:bg-primary-50 dark:border-slate-700 dark:text-primary-400 dark:hover:bg-slate-700"
                              onMouseDown={() => void handleBuatKK()}>
                              {kkCreating ? 'Membuat KK...' : `+ Buat KK "${kkSearch.trim()}"`}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                    {form.kartuKeluargaId && (
                      <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">✓ KK terhubung</p>
                    )}
                  </div>
                </Field>
                <Field label="Hubungan Keluarga">
                  <select className={INPUT} value={form.hubunganKeluarga}
                    onChange={(e) => set('hubunganKeluarga', e.target.value as HubunganKeluarga)}>
                    <option value="">— Pilih —</option>
                    {HUBUNGAN_ORDER.map((h) => (
                      <option key={h} value={h}>{HUBUNGAN_LABEL[h]}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Status */}
              <SectionHead>Status</SectionHead>

              <Field label="Status Warga">
                <select className={INPUT} value={form.status}
                  onChange={(e) => set('status', e.target.value)}>
                  <option value="aktif">Aktif</option>
                  <option value="tidak_aktif">Tidak Aktif</option>
                  <option value="pindah">Pindah</option>
                  <option value="meninggal">Meninggal</option>
                </select>
              </Field>

              {/* Akun Pengguna — hanya saat edit */}
              {isEdit && (
                <>
                  <SectionHead>Akun Pengguna</SectionHead>

                  {linkError && (
                    <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                      {linkError}
                    </p>
                  )}

                  {form.userId ? (
                    /* Sudah terlink */
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-800">
                          <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                            {linkedInfo?.email || '—'}
                          </p>
                          {linkedInfo?.phone && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{linkedInfo.phone}</p>
                          )}
                          {linkedInfo?.userStatus && (
                            <span className={cn(
                              'mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                              USER_STATUS_COLOR[linkedInfo.userStatus] ?? 'bg-slate-100 text-slate-600',
                            )}>
                              {USER_STATUS_LABEL[linkedInfo.userStatus] ?? linkedInfo.userStatus}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleUnlink()}
                        disabled={unlinking}
                        className="shrink-0 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                      >
                        {unlinking ? 'Melepas...' : 'Lepas'}
                      </button>
                    </div>
                  ) : (
                    /* Belum terlink — cari dan hubungkan */
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                        <UserX className="h-4 w-4 shrink-0 text-slate-400" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Belum terhubung ke akun pengguna
                        </p>
                      </div>
                      <div ref={userRef} className="relative">
                        <input
                          className={INPUT}
                          placeholder="Cari akun: email atau no. HP..."
                          value={userSearch}
                          onChange={(e) => { setUserSearch(e.target.value); setUserOpen(true) }}
                          onFocus={() => setUserOpen(true)}
                          autoComplete="off"
                        />
                        {userOpen && (userSearching || userSearch.trim().length >= 2) && (
                          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
                            {userSearching ? (
                              <p className="px-3 py-3 text-center text-sm text-slate-400">Mencari...</p>
                            ) : userResults.length > 0 ? (
                              <ul className="max-h-48 overflow-y-auto py-1">
                                {userResults.map((u) => (
                                  <li
                                    key={u.id}
                                    className="cursor-pointer px-3 py-2.5 hover:bg-primary-50 dark:hover:bg-slate-700"
                                    onMouseDown={() => void handleLink(u)}
                                  >
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                      {u.email}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {u.phone}
                                      <span className={cn(
                                        'ml-2 rounded-full px-1.5 py-0.5 text-xs',
                                        USER_STATUS_COLOR[u.status] ?? 'bg-slate-100 text-slate-600',
                                      )}>
                                        {USER_STATUS_LABEL[u.status] ?? u.status}
                                      </span>
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="px-3 py-3 text-center text-sm text-slate-400">
                                Tidak ada akun yang ditemukan
                              </p>
                            )}
                          </div>
                        )}
                        {linking && (
                          <p className="mt-1 text-xs text-primary-600 dark:text-primary-400">
                            Menghubungkan...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* User ID — hanya saat tambah baru */}
              {!isEdit && (
                <Field label="User ID (UUID akun terdaftar, opsional)">
                  <input className={INPUT} value={form.userId}
                    onChange={(e) => set('userId', e.target.value)}
                    placeholder="Kosongkan jika belum ada akun" />
                </Field>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 px-5 py-4 dark:border-slate-700">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Warga'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
