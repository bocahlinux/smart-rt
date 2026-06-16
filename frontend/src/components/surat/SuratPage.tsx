import {
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  FileText,
  Heart,
  Home,
  Package,
  PartyPopper,
  Star,
  Truck,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { createPermohonan, listJenisSurat } from '@/services/suratService'
import { useAuthStore } from '@/stores/authStore'
import type { JenisSurat } from '@/types/surat'

// ── Icon map per kode surat ────────────────────────────────────

const KODE_ICON: Record<string, React.ElementType> = {
  domisili:       Home,
  tidak_mampu:    Users,
  pengantar:      FileText,
  kelahiran:      Heart,
  kematian:       BookOpen,
  pindah:         Truck,
  usaha:          Package,
  belum_menikah:  Star,
  izin_keramaian: PartyPopper,
  rekomendasi:    FileCheck,
}

const KODE_COLOR: Record<string, string> = {
  domisili:       'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  tidak_mampu:    'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
  pengantar:      'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  kelahiran:      'bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400',
  kematian:       'bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
  pindah:         'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  usaha:          'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  belum_menikah:  'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
  izin_keramaian: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  rekomendasi:    'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
}

const INPUT = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900'

// ── Surat card ─────────────────────────────────────────────────

function SuratCard({ jenis, onClick }: { jenis: JenisSurat; onClick: () => void }) {
  const Icon = KODE_ICON[jenis.kode] ?? FileText
  const colorCls = KODE_COLOR[jenis.kode] ?? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm transition hover:border-primary-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-700"
    >
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', colorCls)}>
        <Icon className="h-5.5 w-5.5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-700 dark:text-slate-100 dark:group-hover:text-primary-400">
          {jenis.nama}
        </p>
        {jenis.deskripsi && (
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{jenis.deskripsi}</p>
        )}
      </div>
    </button>
  )
}

// ── Form modal ─────────────────────────────────────────────────

function SuratFormModal({ jenis, onClose, onSuccess }: {
  jenis: JenisSurat
  onClose: () => void
  onSuccess: () => void
}) {
  const user = useAuthStore(s => s.user)
  const [keperluan, setKeperluan] = useState('')
  const [extra, setExtra] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  function setField(key: string, val: string) {
    setExtra(p => ({ ...p, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!keperluan.trim()) { setError('Keperluan wajib diisi.'); return }
    setSaving(true)
    setError('')
    try {
      await createPermohonan({ jenisId: jenis.id, dataForm: extra, keperluan })
      setDone(true)
    } catch {
      setError('Gagal mengirim permohonan. Silakan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  const Icon = KODE_ICON[jenis.kode] ?? FileText
  const colorCls = KODE_COLOR[jenis.kode] ?? 'bg-primary-50 text-primary-600'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', colorCls)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{jenis.nama}</h2>
            {jenis.deskripsi && (
              <p className="truncate text-xs text-slate-400">{jenis.deskripsi}</p>
            )}
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Permohonan Terkirim!</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Permohonan surat Anda telah dikirim ke petugas RT. Harap tunggu konfirmasi.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/surat/riwayat"
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Lihat Riwayat
              </Link>
              <button type="button" onClick={() => { onSuccess(); onClose() }}
                className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={e => void handleSubmit(e)} className="flex min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {/* Pre-filled info */}
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 dark:border-blue-800/40 dark:bg-blue-900/10">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Data dari profil Anda</p>
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-500">
                  Nama, NIK, alamat, dan data lain akan diambil otomatis dari profil warga Anda.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Extra fields from jenis.fieldTambahan */}
              {jenis.fieldTambahan.map(fieldKey => (
                <div key={fieldKey} className="mb-4">
                  <label className="mb-1.5 block text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                    {fieldKey.replace(/_/g, ' ')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={INPUT}
                    value={extra[fieldKey] ?? ''}
                    onChange={e => setField(fieldKey, e.target.value)}
                    required
                  />
                </div>
              ))}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Keperluan / Tujuan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  className={INPUT}
                  value={keperluan}
                  onChange={e => { setKeperluan(e.target.value); setError('') }}
                  placeholder="Jelaskan keperluan pembuatan surat ini..."
                />
              </div>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
              <button type="button" onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
                {saving ? 'Mengirim…' : 'Ajukan Surat'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Halaman utama surat (warga) ────────────────────────────────

export function SuratPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const canKelola = hasPerm(user, 'kelola_surat')

  const [jenisList, setJenisList] = useState<JenisSurat[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<JenisSurat | null>(null)

  useEffect(() => {
    if (canKelola) {
      navigate('/surat/kelola', { replace: true })
      return
    }
    listJenisSurat()
      .then(setJenisList)
      .catch(() => {/* silent */})
      .finally(() => setLoading(false))
  }, [canKelola, navigate])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Surat Menyurat</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pilih jenis surat yang ingin Anda ajukan ke petugas RT
          </p>
        </div>
        <Link
          to="/surat/riwayat"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ClipboardList className="h-4 w-4" />
          Riwayat Saya
        </Link>
      </div>

      {jenisList.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">Belum ada jenis surat yang tersedia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {jenisList.map(jenis => (
            <SuratCard key={jenis.id} jenis={jenis} onClick={() => setSelected(jenis)} />
          ))}
        </div>
      )}

      {selected && (
        <SuratFormModal
          jenis={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => setSelected(null)}
        />
      )}
    </div>
  )
}
