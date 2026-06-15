import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Users, Plus, Trash2, Edit2, Home, MapPin, Hash, ArrowLeft } from 'lucide-react'

import { cn } from '@/lib/utils'
import { getKK, getKKSaya } from '@/services/kartuKeluargaService'
import type { KartuKeluarga, AnggotaKK } from '@/types/kartuKeluarga'
import { HUBUNGAN_LABEL, HUBUNGAN_ORDER } from '@/types/kartuKeluarga'
import { useAuthStore } from '@/stores/authStore'
import { HapusAnggotaModal } from './HapusAnggotaModal'
import { WargaDetailModal } from '@/components/warga/WargaDetailModal'

const STATUS_CLS: Record<string, string> = {
  aktif: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  tidak_aktif: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  pindah: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  meninggal: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  aktif: 'Aktif', tidak_aktif: 'Tdk Aktif', pindah: 'Pindah', meninggal: 'Meninggal',
}

function sortAnggota(list: AnggotaKK[]) {
  return [...list].sort((a, b) => {
    const ia = HUBUNGAN_ORDER.indexOf((a.hubunganKeluarga ?? 'lainnya') as never)
    const ib = HUBUNGAN_ORDER.indexOf((b.hubunganKeluarga ?? 'lainnya') as never)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}

export function KartuKeluargaPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role && ['admin', 'sekretaris', 'pengurus'].includes(user.role)

  const [kk, setKK] = useState<KartuKeluarga | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hapusTarget, setHapusTarget] = useState<AnggotaKK | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  function loadKK() {
    setLoading(true)
    const fetch = id ? getKK(id) : getKKSaya()
    fetch
      .then(setKK)
      .catch(() => setError('Gagal memuat data Kartu Keluarga.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadKK() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !kk) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="mb-4 text-red-600 dark:text-red-400">{error || 'Data tidak ditemukan.'}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-primary-600 hover:underline">← Kembali</button>
      </div>
    )
  }

  const anggotaSorted = sortAnggota(kk.anggota)
  // Ambil alamat/blok/noRumah dari kepala keluarga jika ada
  const kepala = anggotaSorted.find(m => m.hubunganKeluarga === 'kepala_keluarga') ?? anggotaSorted[0]

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 lg:px-8 lg:py-6">
      {detailId && (
        <WargaDetailModal
          id={detailId}
          onClose={() => setDetailId(null)}
          onDeleted={() => { setDetailId(null); loadKK() }}
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

      {/* Header KK */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="bg-slate-800 px-5 py-5 dark:bg-slate-950">
          {/* Nomor KK + jumlah anggota */}
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

          {/* Kepala keluarga */}
          {kk.kepalaKeluarga && (
            <p className="mt-3 text-sm text-slate-300">
              <span className="text-slate-400">Kepala Keluarga: </span>
              <span className="font-semibold">{kk.kepalaKeluarga.namaLengkap}</span>
            </p>
          )}

          {/* Alamat, Blok, No. Rumah */}
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

        {/* Action bar */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <p className="text-xs text-slate-400">Daftar anggota keluarga</p>
          <Link
            to={`/kk/${kk.id}/tambah-anggota`}
            className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Anggota
          </Link>
        </div>
      </div>

      {/* Daftar Anggota */}
      {anggotaSorted.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
          Belum ada anggota keluarga.
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 sm:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">#</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Nama</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">NIK</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Hubungan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {anggotaSorted.map((m, i) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 text-sm text-slate-400">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <button type="button" onClick={() => setDetailId(m.id)} className="text-left text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
                        {m.namaLengkap}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">{m.nik ?? '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                      {m.hubunganKeluargaLabel ?? (m.hubunganKeluarga ? HUBUNGAN_LABEL[m.hubunganKeluarga] : '—')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_CLS[m.status] ?? 'bg-slate-100 text-slate-500')}>
                        {STATUS_LABEL[m.status] ?? m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/kk/${kk.id}/ubah-anggota/${m.id}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                          title="Ajukan perubahan data"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                        {m.hubunganKeluarga !== 'kepala_keluarga' && (
                          <button
                            type="button"
                            onClick={() => setHapusTarget(m)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                            title="Ajukan penghapusan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="space-y-3 sm:hidden">
            {anggotaSorted.map((m, i) => (
              <div key={m.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">{i + 1}</span>
                    <div>
                      <button type="button" onClick={() => setDetailId(m.id)} className="text-left font-semibold text-primary-600 hover:underline dark:text-primary-400">
                        {m.namaLengkap}
                      </button>
                      <p className="text-xs text-slate-500">
                        {m.hubunganKeluargaLabel ?? (m.hubunganKeluarga ? HUBUNGAN_LABEL[m.hubunganKeluarga] : '—')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CLS[m.status] ?? 'bg-slate-100 text-slate-500')}>
                      {STATUS_LABEL[m.status] ?? m.status}
                    </span>
                  </div>
                </div>
                {m.nik && (
                  <div className="border-t border-slate-50 px-4 py-2 dark:border-slate-800">
                    <p className="font-mono text-xs text-slate-400">NIK: {m.nik}</p>
                  </div>
                )}
                <div className="flex justify-end gap-1 border-t border-slate-50 px-3 py-2 dark:border-slate-800">
                  <Link
                    to={`/kk/${kk.id}/ubah-anggota/${m.id}`}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="h-3 w-3" /> Ubah
                  </Link>
                  {m.hubunganKeluarga !== 'kepala_keluarga' && (
                    <button
                      type="button"
                      onClick={() => setHapusTarget(m)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3" /> Hapus
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {hapusTarget && kk && (
        <HapusAnggotaModal
          kk={kk}
          anggota={hapusTarget}
          onClose={() => setHapusTarget(null)}
          onSubmitted={() => setHapusTarget(null)}
        />
      )}
    </div>
  )
}
