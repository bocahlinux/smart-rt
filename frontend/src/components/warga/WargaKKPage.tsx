import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Home, Users, ArrowLeft, Hash, MapPin } from 'lucide-react'

import { cn } from '@/lib/utils'
import { getWarga } from '@/services/wargaService'
import { getKK } from '@/services/kartuKeluargaService'
import type { WargaFull } from '@/types/warga'
import type { KartuKeluarga } from '@/types/kartuKeluarga'
import { HUBUNGAN_LABEL, HUBUNGAN_ORDER } from '@/types/kartuKeluarga'
import { WargaDetailModal } from './WargaDetailModal'

const STATUS_LABEL: Record<string, string> = {
  aktif: 'Aktif', tidak_aktif: 'Tdk Aktif', pindah: 'Pindah', meninggal: 'Meninggal',
}

const STATUS_CLS: Record<string, string> = {
  aktif: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  tidak_aktif: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  pindah: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  meninggal: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

export function WargaKKPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [warga, setWarga] = useState<WargaFull | null>(null)
  const [kk, setKK] = useState<KartuKeluarga | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailId, setDetailId] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getWarga(id)
      .then(async (w) => {
        setWarga(w)
        if (w.kartuKeluargaId) {
          const kkData = await getKK(w.kartuKeluargaId)
          setKK(kkData)
        }
      })
      .catch(() => setError('Gagal memuat data Kartu Keluarga.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !warga) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="mb-4 text-red-600 dark:text-red-400">{error || 'Data tidak ditemukan.'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-primary-600 hover:underline">← Kembali</button>
      </div>
    )
  }

  const anggotaSorted = kk
    ? [...kk.anggota].sort((a, b) => {
        const ia = HUBUNGAN_ORDER.indexOf((a.hubunganKeluarga ?? 'lainnya') as never)
        const ib = HUBUNGAN_ORDER.indexOf((b.hubunganKeluarga ?? 'lainnya') as never)
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
      })
    : []

  // Alamat/blok/noRumah dari kepala keluarga
  const kepala = anggotaSorted.find(m => m.hubunganKeluarga === 'kepala_keluarga') ?? anggotaSorted[0]

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 lg:px-8 lg:py-6">
      {detailId && (
        <WargaDetailModal
          id={detailId}
          onClose={() => setDetailId(null)}
        />
      )}

      {/* Tombol kembali */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      {!kk ? (
        /* Warga belum terhubung ke KK */
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <Home className="mx-auto mb-3 h-10 w-10 text-slate-200 dark:text-slate-700" />
          <p className="text-slate-500 dark:text-slate-400">Warga ini belum terhubung ke Kartu Keluarga.</p>
          <Link to={`/warga/${id}/edit`} className="mt-2 inline-block text-xs text-primary-600 hover:underline dark:text-primary-400">
            Edit profil untuk mengatur KK →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* Header KK */}
          <div className="bg-slate-800 px-5 py-5 dark:bg-slate-950">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">No. Kartu Keluarga</p>
                <p className="mt-0.5 font-mono text-2xl font-bold tracking-wider text-white">{kk.noKk}</p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                <Users className="h-4 w-4 text-white/70" />
                <span className="text-sm font-semibold text-white">{kk.jumlahAnggota} anggota</span>
              </div>
            </div>

            {kk.kepalaKeluarga && (
              <p className="mt-3 text-sm text-slate-300">
                <span className="text-slate-400">Kepala Keluarga: </span>
                <span className="font-semibold">{kk.kepalaKeluarga.namaLengkap}</span>
              </p>
            )}

            {/* Alamat, Blok, No. Rumah di header */}
            <div className="mt-3 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-4">
              {(kepala?.alamat ?? kk.alamat) && (
                <div className="flex items-start gap-1.5 text-sm text-slate-300">
                  <Home className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>{kepala?.alamat ?? kk.alamat}</span>
                </div>
              )}
              {kepala?.blok && (
                <div className="flex items-center gap-1.5 text-sm text-slate-300">
                  <Hash className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>Blok {kepala.blok}</span>
                </div>
              )}
              {kepala?.noRumah && (
                <div className="flex items-center gap-1.5 text-sm text-slate-300">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>No. {kepala.noRumah}</span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop: table */}
          <div className="hidden sm:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Nama</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">NIK</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Hubungan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {anggotaSorted.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                      Belum ada anggota terdaftar.
                    </td>
                  </tr>
                ) : (
                  anggotaSorted.map((m, i) => (
                    <tr
                      key={m.id}
                      className={cn(
                        'hover:bg-slate-50 dark:hover:bg-slate-800/40',
                        m.id === id && 'bg-indigo-50/60 dark:bg-indigo-900/20',
                      )}
                    >
                      <td className="px-5 py-3.5 text-sm text-slate-400">{i + 1}</td>
                      <td className="px-5 py-3.5">
                        <button type="button" onClick={() => setDetailId(m.id)} className="text-left text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
                          {m.namaLengkap}
                        </button>
                        {m.id === id && (
                          <span className="ml-2 rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                            Anda
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">{m.nik ?? '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                        {m.hubunganKeluarga ? (HUBUNGAN_LABEL[m.hubunganKeluarga] ?? m.hubunganKeluarga) : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_CLS[m.status] ?? 'bg-slate-100 text-slate-500')}>
                          {STATUS_LABEL[m.status] ?? m.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="divide-y divide-slate-50 dark:divide-slate-800 sm:hidden">
            {anggotaSorted.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Belum ada anggota terdaftar.</p>
            ) : (
              anggotaSorted.map((m, i) => (
                <div
                  key={m.id}
                  className={cn(
                    'flex items-start justify-between px-4 py-3',
                    m.id === id && 'bg-indigo-50/60 dark:bg-indigo-900/20',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">
                      {i + 1}
                    </span>
                    <div>
                      <button type="button" onClick={() => setDetailId(m.id)} className="text-left font-semibold text-primary-600 hover:underline dark:text-primary-400">
                        {m.namaLengkap}
                      </button>
                      {m.id === id && (
                        <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                          Anda
                        </span>
                      )}
                      <p className="mt-0.5 text-xs text-slate-500">
                        {m.hubunganKeluarga ? (HUBUNGAN_LABEL[m.hubunganKeluarga] ?? m.hubunganKeluarga) : '—'}
                        {m.nik && <span className="ml-1.5 font-mono">· {m.nik}</span>}
                      </p>
                    </div>
                  </div>
                  <span className={cn('ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CLS[m.status] ?? 'bg-slate-100 text-slate-500')}>
                    {STATUS_LABEL[m.status] ?? m.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
