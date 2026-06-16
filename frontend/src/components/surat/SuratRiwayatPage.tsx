import { ArrowLeft, CheckCircle2, Clock, FileText, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { listPermohonan } from '@/services/suratService'
import type { PermohonanSurat, StatusPermohonan } from '@/types/surat'

const BULAN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

const STATUS_CFG: Record<StatusPermohonan, { label: string; cls: string; icon: React.ElementType }> = {
  diajukan:  { label: 'Diajukan',  cls: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',     icon: Clock },
  diproses:  { label: 'Diproses',  cls: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  disetujui: { label: 'Disetujui', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  ditolak:   { label: 'Ditolak',   cls: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',         icon: XCircle },
  selesai:   { label: 'Selesai',   cls: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',     icon: CheckCircle2 },
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${BULAN[d.getMonth() + 1]} ${d.getFullYear()}`
}

export function SuratRiwayatPage() {
  const [list, setList] = useState<PermohonanSurat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPermohonan()
      .then(r => setList(r.data))
      .catch(() => {/* silent */})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
      <Link
        to="/surat"
        className="mb-5 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Surat Menyurat
      </Link>

      <h1 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Riwayat Permohonan Surat</h1>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">Belum ada permohonan surat.</p>
          <Link to="/surat" className="mt-4 inline-block rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700">
            Ajukan Surat
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(p => {
            const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.diajukan
            const StatusIcon = cfg.icon
            return (
              <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
                      <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{p.jenisNama}</p>
                      <p className="text-xs text-slate-400">{formatDate(p.createdAt)}</p>
                    </div>
                  </div>
                  <span className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', cfg.cls)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </span>
                </div>

                {/* Keperluan */}
                {p.keperluan && (
                  <div className="border-t border-slate-50 px-5 py-2.5 dark:border-slate-800">
                    <p className="text-xs text-slate-400">Keperluan: <span className="text-slate-600 dark:text-slate-300">{p.keperluan}</span></p>
                  </div>
                )}

                {/* Catatan admin jika ada */}
                {p.catatanAdmin && (
                  <div className="border-t border-slate-50 px-5 py-2.5 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Catatan petugas:</p>
                    <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-300">{p.catatanAdmin}</p>
                  </div>
                )}

                {/* No surat jika sudah disetujui */}
                {p.noSurat && (
                  <div className="border-t border-emerald-50 bg-emerald-50/50 px-5 py-2.5 dark:border-emerald-900/20 dark:bg-emerald-900/10">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      No. Surat: <span className="font-mono font-semibold">{p.noSurat}</span>
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
