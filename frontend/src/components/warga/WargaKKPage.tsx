/**
 * Kartu Keluarga view — daftar semua warga dengan no_kk yang sama.
 * Tasks: 3.20
 */

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { getWarga, listWarga } from '../../services/wargaService'
import type { WargaAny, WargaFull } from '../../types/warga'

const STATUS_LABELS: Record<string, string> = {
  aktif: 'Aktif',
  tidak_aktif: 'Tidak Aktif',
  pindah: 'Pindah',
  meninggal: 'Meninggal',
}

const HUB_ORDER = [
  'Kepala Keluarga',
  'Istri',
  'Suami',
  'Anak',
]

function sortByHubungan(list: WargaAny[]): WargaAny[] {
  return [...list].sort((a, b) => {
    const fa = a as WargaFull
    const fb = b as WargaFull
    const ia = HUB_ORDER.indexOf(fa.hubunganKeluarga ?? '')
    const ib = HUB_ORDER.indexOf(fb.hubunganKeluarga ?? '')
    const sa = ia === -1 ? 99 : ia
    const sb = ib === -1 ? 99 : ib
    return sa - sb
  })
}

export function WargaKKPage() {
  const { id } = useParams<{ id: string }>()
  const [head, setHead] = useState<WargaFull | null>(null)
  const [members, setMembers] = useState<WargaAny[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getWarga(id)
      .then(async (w) => {
        setHead(w)
        if (!w.noKk) {
          setMembers([w])
          return
        }
        // Cari semua warga dengan noKk yang sama
        const result = await listWarga({ search: w.noKk, limit: 100 })
        const filtered = result.data.filter((m) => {
          const mf = m as WargaFull
          return mf.noKk === w.noKk
        })
        setMembers(sortByHubungan(filtered.length > 0 ? filtered : [w]))
      })
      .catch(() => setError('Gagal memuat data Kartu Keluarga.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Memuat Kartu Keluarga...</p>
      </div>
    )
  }

  if (error || !head) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error || 'Data tidak ditemukan.'}</p>
        <Link to="/warga" className="text-indigo-600 hover:underline">← Kembali</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/warga" className="hover:underline">Data Warga</Link>
          {' / '}
          <Link to={`/warga/${id}`} className="hover:underline">{head.namaLengkap}</Link>
          {' / '}
          <span className="text-slate-700 dark:text-slate-200">Kartu Keluarga</span>
        </nav>

        {/* KK Card */}
        <div className="rounded-lg border-2 border-slate-800 bg-white dark:border-slate-400 dark:bg-slate-800">
          {/* Header KK */}
          <div className="border-b-2 border-slate-800 bg-slate-800 px-6 py-4 text-center dark:border-slate-400">
            <p className="text-xs uppercase tracking-widest text-slate-300">Kartu Keluarga</p>
            <p className="mt-1 font-mono text-lg font-bold text-white">
              {head.noKk ?? '— No. KK belum diisi —'}
            </p>
          </div>

          {/* Info rumah */}
          <div className="grid grid-cols-2 gap-0 border-b border-slate-200 px-6 py-4 text-sm dark:border-slate-700">
            <div>
              <span className="text-slate-500">Alamat: </span>
              <span className="font-medium text-slate-900 dark:text-white">{head.alamat ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500">Blok / No. Rumah: </span>
              <span className="font-medium text-slate-900 dark:text-white">
                {head.blok ?? '—'} / {head.noRumah ?? '—'}
              </span>
            </div>
          </div>

          {/* Daftar anggota */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">#</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Nama</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">NIK</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Hubungan</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {members.map((m, i) => {
                  const mf = m as WargaFull
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/warga/${m.id}`}
                          className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {m.namaLengkap}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                        {mf.nik ?? mf.nikMasked ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {mf.hubunganKeluarga ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.status === 'aktif' ? 'bg-green-100 text-green-700' :
                          m.status === 'tidak_aktif' ? 'bg-slate-100 text-slate-600' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {STATUS_LABELS[m.status] ?? m.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 text-right text-xs text-slate-400">
            Jumlah anggota: {members.length}
          </div>
        </div>
      </div>
    </div>
  )
}
