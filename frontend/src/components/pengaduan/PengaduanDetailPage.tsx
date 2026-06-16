import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MessageCircleWarning } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { deletePengaduan, getPengaduan, updateStatusPengaduan } from '../../services/pengaduanService'
import type { PengaduanDetail, PengaduanStatus } from '../../types/pengaduan'

const STATUS_LABEL: Record<string, string> = {
  diajukan: 'Diajukan',
  diproses: 'Sedang Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

const STATUS_COLOR: Record<string, string> = {
  diajukan: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  diproses: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  selesai: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ditolak: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const TIMELINE_DOT: Record<string, string> = {
  diajukan: 'bg-blue-400',
  diproses: 'bg-amber-400',
  selesai: 'bg-emerald-400',
  ditolak: 'bg-red-400',
}

const KATEGORI_LABEL: Record<string, string> = {
  infrastruktur: 'Infrastruktur',
  keamanan: 'Keamanan',
  kebersihan: 'Kebersihan',
  sosial: 'Sosial',
  lainnya: 'Lainnya',
}

const KATEGORI_COLOR: Record<string, string> = {
  infrastruktur: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  keamanan: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  kebersihan: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  sosial: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  lainnya: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_OPTIONS: PengaduanStatus[] = ['diajukan', 'diproses', 'selesai', 'ditolak']

export function PengaduanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [pengaduan, setPengaduan] = useState<PengaduanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showStatusForm, setShowStatusForm] = useState(false)
  const [newStatus, setNewStatus] = useState<PengaduanStatus>('diproses')
  const [keterangan, setKeterangan] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')

  const isModerator = hasPerm(user, 'update_pengaduan')

  useEffect(() => {
    if (!id) return
    void load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getPengaduan(id!)
      setPengaduan(data)
      const idx = STATUS_OPTIONS.indexOf(data.status)
      setNewStatus(STATUS_OPTIONS[Math.min(idx + 1, STATUS_OPTIONS.length - 1)])
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr.response?.status === 403) setError('Anda tidak memiliki akses ke pengaduan ini.')
      else if (axiosErr.response?.status === 404) setError('Pengaduan tidak ditemukan.')
      else setError('Gagal memuat pengaduan.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!pengaduan) return
    setUpdating(true)
    setUpdateMsg('')
    try {
      await updateStatusPengaduan(pengaduan.id, { status: newStatus, keterangan })
      setUpdateMsg(`Status berhasil diperbarui menjadi "${STATUS_LABEL[newStatus]}".`)
      setShowStatusForm(false)
      setKeterangan('')
      await load()
    } catch {
      setUpdateMsg('Gagal memperbarui status.')
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete() {
    if (!pengaduan || !confirm(`Hapus pengaduan "${pengaduan.judul}"?`)) return
    try { await deletePengaduan(pengaduan.id); navigate('/pengaduan') }
    catch { setError('Gagal menghapus pengaduan.') }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !pengaduan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-slate-400 dark:text-slate-500">{error || 'Pengaduan tidak ditemukan.'}</p>
        <Link to="/pengaduan" className="mt-3 inline-block text-sm text-primary-600 hover:underline">← Kembali ke Pengaduan</Link>
      </div>
    )
  }

  const isOwner = user?.email === (pengaduan.warga as { email?: string })?.email
  const canDelete = isOwner || isModerator

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 lg:px-8 lg:py-6">

      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <Link
          to="/pengaduan"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
            <MessageCircleWarning className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="line-clamp-1 text-lg font-bold text-slate-900 dark:text-white">{pengaduan.judul}</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Detail Pengaduan</p>
          </div>
        </div>
      </div>

      {updateMsg && (
        <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300">
          {updateMsg}
        </div>
      )}

      {/* Foto */}
      {pengaduan.foto && (
        <a href={pengaduan.foto} target="_blank" rel="noopener noreferrer" className="mb-4 block">
          <img
            src={pengaduan.foto}
            alt="Foto pengaduan"
            className="w-full max-h-72 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
          />
        </a>
      )}

      {/* Detail card */}
      <div className="space-y-4">
        {/* Badges + meta */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', KATEGORI_COLOR[pengaduan.kategori] ?? 'bg-slate-100 text-slate-600')}>
            {KATEGORI_LABEL[pengaduan.kategori] ?? pengaduan.kategori}
          </span>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_COLOR[pengaduan.status] ?? 'bg-slate-100 text-slate-600')}>
            {STATUS_LABEL[pengaduan.status] ?? pengaduan.status}
          </span>
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
            {formatDate(pengaduan.createdAt)} · {pengaduan.warga.namaLengkap}
          </span>
        </div>

        {/* Deskripsi */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {pengaduan.deskripsi}
        </p>

        {/* Aksi */}
        {(isModerator || canDelete) && (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            {isModerator && (
              <button
                onClick={() => setShowStatusForm((v) => !v)}
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
              >
                {showStatusForm ? 'Batal' : 'Update Status'}
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => void handleDelete()}
                className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Hapus Pengaduan
              </button>
            )}
          </div>
        )}

        {/* Form update status */}
        {showStatusForm && isModerator && (
          <form onSubmit={(e) => void handleStatusUpdate(e)} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Perbarui Status Pengaduan</h3>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Status Baru</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as PengaduanStatus)}
                className={INPUT}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Keterangan <span className="font-normal text-slate-400">(opsional)</span>
              </label>
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                rows={3}
                placeholder="Tambahkan keterangan untuk pelapor..."
                className={cn(INPUT, 'resize-none')}
              />
            </div>
            <button
              type="submit"
              disabled={updating}
              className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {updating ? 'Menyimpan...' : 'Simpan Status'}
            </button>
          </form>
        )}
      </div>

      {/* Timeline status history */}
      {pengaduan.statusHistory && pengaduan.statusHistory.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-4 text-base font-semibold text-slate-700 dark:text-slate-200">Riwayat Status</h2>
          <div className="relative pl-6">
            <div className="absolute left-2.5 top-1 bottom-4 w-px bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-4">
              {[...pengaduan.statusHistory].reverse().map((h, idx) => (
                <div key={idx} className="relative">
                  <div className={cn(
                    'absolute -left-4 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950',
                    TIMELINE_DOT[h.status] ?? 'bg-slate-400',
                  )} />
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_COLOR[h.status] ?? 'bg-slate-100 text-slate-600')}>
                        {STATUS_LABEL[h.status] ?? h.status}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(h.updatedAt)}</span>
                    </div>
                    {h.keterangan && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{h.keterangan}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">oleh {h.updatedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
