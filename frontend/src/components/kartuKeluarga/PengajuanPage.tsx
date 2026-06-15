import { useEffect, useState } from 'react'
import { CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  listPengajuanTambah, reviewPengajuanTambah,
  listPengajuanHapus, reviewPengajuanHapus,
  listPengajuanUbah, reviewPengajuanUbah,
} from '@/services/kartuKeluargaService'
import type { PengajuanAnggotaBaru, PengajuanPenghapusan, PengajuanPerubahan, StatusPengajuan } from '@/types/kartuKeluarga'
import { useAuthStore } from '@/stores/authStore'

type Tab = 'tambah' | 'hapus' | 'ubah'

const STATUS_CLS: Record<StatusPengajuan, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  disetujui: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ditolak: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}
const STATUS_ICON: Record<StatusPengajuan, React.ElementType> = {
  pending: Clock,
  disetujui: CheckCircle2,
  ditolak: XCircle,
}

function StatusBadge({ status }: { status: StatusPengajuan }) {
  const Icon = STATUS_ICON[status]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_CLS[status])}>
      <Icon className="h-3 w-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function ReviewModal({
  onClose, onReview,
}: {
  onClose: () => void
  onReview: (aksi: 'setujui' | 'tolak', catatan: string) => Promise<void>
}) {
  const [aksi, setAksi] = useState<'setujui' | 'tolak'>('setujui')
  const [catatan, setCatatan] = useState('')
  const [saving, setSaving] = useState(false)

  async function handle() {
    setSaving(true)
    try { await onReview(aksi, catatan); onClose() }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">Tinjau Pengajuan</h3>
        <div className="mb-3 flex gap-2">
          {(['setujui', 'tolak'] as const).map((a) => (
            <button key={a} type="button" onClick={() => setAksi(a)}
              className={cn('flex-1 rounded-xl py-2 text-sm font-semibold transition',
                aksi === a
                  ? a === 'setujui' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
              )}>
              {a === 'setujui' ? 'Setujui' : 'Tolak'}
            </button>
          ))}
        </div>
        <textarea rows={3} value={catatan} onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan untuk pemohon (opsional)"
          className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        <div className="flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
            Batal
          </button>
          <button type="button" disabled={saving} onClick={() => void handle()}
            className={cn('flex-1 rounded-xl py-2 text-sm font-semibold text-white disabled:opacity-60',
              aksi === 'setujui' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700')}>
            {saving ? 'Menyimpan…' : aksi === 'setujui' ? 'Setujui' : 'Tolak'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PengajuanPage() {
  const user = useAuthStore((s) => s.user)
  const isApprover = user?.role && ['admin', 'sekretaris', 'pengurus'].includes(user.role)

  const [tab, setTab] = useState<Tab>('tambah')
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [tambahList, setTambahList] = useState<PengajuanAnggotaBaru[]>([])
  const [hapusList, setHapusList] = useState<PengajuanPenghapusan[]>([])
  const [ubahList, setUbahList] = useState<PengajuanPerubahan[]>([])
  const [loading, setLoading] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<{ id: string; tipe: Tab } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, statusFilter])

  async function load() {
    setLoading(true)
    try {
      const f = statusFilter || undefined
      if (tab === 'tambah') setTambahList(await listPengajuanTambah(f))
      if (tab === 'hapus') setHapusList(await listPengajuanHapus(f))
      if (tab === 'ubah') setUbahList(await listPengajuanUbah(f))
    } finally {
      setLoading(false)
    }
  }

  async function doReview(aksi: 'setujui' | 'tolak', catatan: string) {
    if (!reviewTarget) return
    if (reviewTarget.tipe === 'tambah') await reviewPengajuanTambah(reviewTarget.id, aksi, catatan)
    if (reviewTarget.tipe === 'hapus') await reviewPengajuanHapus(reviewTarget.id, aksi, catatan)
    if (reviewTarget.tipe === 'ubah') await reviewPengajuanUbah(reviewTarget.id, aksi, catatan)
    await load()
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'tambah', label: 'Tambah Anggota' },
    { key: 'hapus', label: 'Penghapusan' },
    { key: 'ubah', label: 'Perubahan Data' },
  ]

  const currentList = tab === 'tambah' ? tambahList : tab === 'hapus' ? hapusList : ubahList

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
      <h1 className="mb-6 text-xl font-bold text-slate-900 dark:text-white">Pengajuan KK</h1>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-medium transition',
              tab === t.key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white',
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter status */}
      <div className="mb-4 flex gap-2">
        {['', 'pending', 'disetujui', 'ditolak'].map((s) => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition',
              statusFilter === s
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300',
            )}>
            {s === '' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && (
          <div className="py-10 text-center text-sm text-slate-400">Memuat…</div>
        )}
        {!loading && currentList.length === 0 && (
          <div className="py-10 text-center text-sm text-slate-400">Tidak ada pengajuan.</div>
        )}
        {!loading && currentList.map((item) => {
          const isOpen = expanded === item.id
          const status = item.status as StatusPengajuan
          return (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status} />
                    {'noKk' in item && item.noKk && (
                      <span className="font-mono text-xs text-slate-500">KK {item.noKk}</span>
                    )}
                    {'wargaTargetNama' in item && item.wargaTargetNama && (
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.wargaTargetNama}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    dari {item.pengajuEmail} · {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isApprover && status === 'pending' && (
                    <button type="button"
                      onClick={() => setReviewTarget({ id: item.id, tipe: tab })}
                      className="rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700">
                      Tinjau
                    </button>
                  )}
                  <button type="button" onClick={() => setExpanded(isOpen ? null : item.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                  {'alasan' in item && item.alasan && (
                    <div className="mb-3">
                      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Alasan</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{item.alasan}</p>
                    </div>
                  )}
                  {'dataAnggota' in item && item.dataAnggota && (
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Data Anggota</p>
                      <pre className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300 overflow-auto">
                        {JSON.stringify(item.dataAnggota, null, 2)}
                      </pre>
                    </div>
                  )}
                  {'fieldChanges' in item && item.fieldChanges && (
                    <div className="mb-3">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Perubahan yang Diusulkan</p>
                      <pre className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300 overflow-auto">
                        {JSON.stringify(item.fieldChanges, null, 2)}
                      </pre>
                    </div>
                  )}
                  {item.catatan_admin && (
                    <div>
                      <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Catatan Admin</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{item.catatan_admin}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {reviewTarget && (
        <ReviewModal
          onClose={() => setReviewTarget(null)}
          onReview={doReview}
        />
      )}
    </div>
  )
}
