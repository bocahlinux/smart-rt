import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Plus, Save, Settings2, Trash2, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import {
  getPengaturanIuran,
  updatePengaturanIuran,
  listJenisIuran,
  createJenisIuran,
  updateJenisIuran,
  deleteJenisIuran,
} from '../../services/keuanganService'
import type { JenisIuran, JenisIuranFormPayload, JenisIuranTipe, JenisIuranUnit } from '../../types/keuangan'

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

function formatRupiah(val: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val))
}

const TIPE_LABEL: Record<string, string> = { wajib: 'Wajib', opsional: 'Opsional' }
const UNIT_LABEL: Record<string, string> = { per_kk: 'Per KK', per_warga: 'Per Orang' }

// ─── Modal tambah/edit jenis iuran ────────────────────────────────────────────

const EMPTY_FORM: JenisIuranFormPayload = {
  nama: '', tipe: 'wajib', unit: 'per_kk', nominal: 0, keterangan: '', isActive: true, urutan: 0,
}

function JenisModal({
  initial, onSave, onClose,
}: {
  initial?: JenisIuran | null
  onSave: (data: JenisIuranFormPayload) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<JenisIuranFormPayload>(
    initial
      ? { nama: initial.nama, tipe: initial.tipe, unit: initial.unit, nominal: Number(initial.nominal), keterangan: initial.keterangan, isActive: initial.isActive, urutan: initial.urutan }
      : EMPTY_FORM,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof JenisIuranFormPayload>(key: K, val: JenisIuranFormPayload[K]) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama.trim()) { setError('Nama jenis iuran wajib diisi.'); return }
    if (form.nominal < 0) { setError('Nominal tidak boleh negatif.'); return }
    setSaving(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menyimpan jenis iuran.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!initial

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">{isEdit ? 'Edit Jenis Iuran' : 'Tambah Jenis Iuran'}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-5">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Nama <span className="text-red-500">*</span></label>
            <input type="text" value={form.nama} onChange={(e) => set('nama', e.target.value)} placeholder="Iuran Wajib, Kebersihan, ..." required className={INPUT} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Tipe</label>
              <select value={form.tipe} onChange={(e) => set('tipe', e.target.value as JenisIuranTipe)} className={INPUT}>
                <option value="wajib">Wajib</option>
                <option value="opsional">Opsional</option>
              </select>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Opsional = warga bisa memilih ikut atau tidak</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Unit Perhitungan</label>
              <select value={form.unit} onChange={(e) => set('unit', e.target.value as JenisIuranUnit)} className={INPUT}>
                <option value="per_kk">Per KK</option>
                <option value="per_warga">Per Orang/Warga</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Nominal (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.nominal ? new Intl.NumberFormat('id-ID').format(form.nominal) : ''}
                onChange={(e) => set('nominal', Number(e.target.value.replace(/[^0-9]/g, '')))}
                placeholder="0"
                className={INPUT}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Urutan Tampil</label>
              <input
                type="number"
                value={form.urutan}
                onChange={(e) => set('urutan', Number(e.target.value))}
                min={0}
                className={INPUT}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Keterangan <span className="text-slate-400 font-normal">(opsional)</span></label>
            <textarea
              value={form.keterangan}
              onChange={(e) => set('keterangan', e.target.value)}
              rows={2}
              placeholder="Deskripsi singkat jenis iuran ini..."
              className={cn(INPUT, 'resize-none')}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.isActive}
              onClick={() => set('isActive', !form.isActive)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                form.isActive ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700',
              )}
            >
              <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', form.isActive ? 'translate-x-5' : 'translate-x-0')} />
            </button>
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {form.isActive ? 'Aktif — tampil di form upload' : 'Nonaktif — disembunyikan'}
            </span>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Jenis'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Halaman utama ─────────────────────────────────────────────────────────────

export function IuranSettingPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [jenisList, setJenisList] = useState<JenisIuran[]>([])
  const [modalTarget, setModalTarget] = useState<JenisIuran | null | 'new'>(null)
  const [deleteTarget, setDeleteTarget] = useState<JenisIuran | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [saldoAwal, setSaldoAwal] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [saldoSaving, setSaldoSaving] = useState(false)
  const [saldoError, setSaldoError] = useState('')
  const [saldoSuccess, setSaldoSuccess] = useState('')
  const [loadingSaldo, setLoadingSaldo] = useState(true)

  const canAccess = hasPerm(user, 'kelola_keuangan')

  useEffect(() => {
    if (!canAccess) return
    void loadJenis()
    getPengaturanIuran()
      .then((s) => { setSaldoAwal(String(Math.round(s.saldoAwal ?? 0))); setKeterangan(s.keterangan) })
      .catch(() => setSaldoError('Gagal memuat pengaturan.'))
      .finally(() => setLoadingSaldo(false))
  }, [canAccess])

  async function loadJenis() {
    try { setJenisList(await listJenisIuran()) } catch { /* ignore */ }
  }

  async function handleSaveSaldo(e: React.FormEvent) {
    e.preventDefault()
    setSaldoSaving(true); setSaldoError(''); setSaldoSuccess('')
    try {
      await updatePengaturanIuran({ nominalDefault: 50000, saldoAwal: parseFloat(saldoAwal) || 0, keterangan })
      setSaldoSuccess('Pengaturan saldo awal berhasil disimpan.')
    } catch {
      setSaldoError('Gagal menyimpan pengaturan.')
    } finally {
      setSaldoSaving(false)
    }
  }

  async function handleSaveJenis(data: JenisIuranFormPayload) {
    if (modalTarget === 'new') {
      await createJenisIuran(data)
    } else if (modalTarget) {
      await updateJenisIuran(modalTarget.id, data)
    }
    await loadJenis()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteJenisIuran(deleteTarget.id)
      setDeleteTarget(null)
      await loadJenis()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal menghapus.'
      setSaldoError(msg)
    } finally {
      setDeleting(false)
    }
  }

  if (!canAccess) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">Akses ditolak. Hanya bendahara dan admin.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 lg:px-8 lg:py-6">
      <button type="button" onClick={() => navigate('/keuangan')} className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100">
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
          <Settings2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Pengaturan Iuran</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Kelola jenis iuran dan saldo awal kas RT</p>
        </div>
      </div>

      {/* ── Jenis Iuran ─────────────────────────────────────────── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Jenis Iuran</h2>
          <button
            type="button"
            onClick={() => setModalTarget('new')}
            className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" /> Tambah Jenis
          </button>
        </div>

        {jenisList.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
            Belum ada jenis iuran. Klik "Tambah Jenis" untuk mulai.
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {jenisList.map((j) => (
              <div key={j.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800 dark:text-slate-100">{j.nama}</span>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      j.tipe === 'wajib'
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                    )}>
                      {TIPE_LABEL[j.tipe]}
                    </span>
                    {!j.isActive && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400 dark:bg-slate-800">Nonaktif</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                    {UNIT_LABEL[j.unit]} · {formatRupiah(j.nominal)}/bulan
                    {j.keterangan && <> · {j.keterangan}</>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setModalTarget(j)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(j)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
                    title="Hapus"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Saldo Awal ──────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Saldo Awal Kas</h2>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Saldo saat pertama kali sistem digunakan</p>
        </div>

        {saldoError && (
          <div className="mx-5 mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{saldoError}</div>
        )}
        {saldoSuccess && (
          <div className="mx-5 mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">{saldoSuccess}</div>
        )}

        {loadingSaldo ? (
          <div className="flex justify-center py-10"><div className="h-7 w-7 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>
        ) : (
          <form onSubmit={(e) => void handleSaveSaldo(e)} className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Saldo Awal (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={saldoAwal ? new Intl.NumberFormat('id-ID').format(Number(saldoAwal)) : ''}
                onChange={(e) => setSaldoAwal(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                className={INPUT}
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Akan dijumlahkan ke saldo kas di Buku Kas.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Keterangan Umum <span className="font-normal text-slate-400">(opsional)</span></label>
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                rows={2}
                placeholder="Catatan umum tentang kas RT..."
                className={cn(INPUT, 'resize-none')}
              />
            </div>
            <button
              type="submit"
              disabled={saldoSaving}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {saldoSaving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              {saldoSaving ? 'Menyimpan...' : 'Simpan Saldo Awal'}
            </button>
          </form>
        )}
      </div>

      {/* Modal tambah/edit */}
      {modalTarget !== null && (
        <JenisModal
          initial={modalTarget === 'new' ? null : modalTarget}
          onSave={handleSaveJenis}
          onClose={() => setModalTarget(null)}
        />
      )}

      {/* Konfirmasi hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="mb-2 font-bold text-slate-900 dark:text-white">Hapus Jenis Iuran?</h3>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              Jenis iuran <strong>{deleteTarget.nama}</strong> akan dihapus permanen. Tidak bisa dibatalkan jika sudah ada data iuran yang terkait.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Trash2 className="h-4 w-4" />}
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
