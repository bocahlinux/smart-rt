/**
 * Halaman detail warga — field visibility berbeda per role.
 * Lihat docs/06-API-CONTRACT.md §3.1 "Field Visibility per Role".
 * Tasks: 3.17
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAuthStore } from '../../stores/authStore'
import { deleteWarga, getWarga, verifyWarga } from '../../services/wargaService'
import type { WargaFull } from '../../types/warga'

const JK_LABELS: Record<string, string> = { L: 'Laki-laki', P: 'Perempuan' }
const STATUS_LABELS: Record<string, string> = {
  aktif: 'Aktif',
  tidak_aktif: 'Tidak Aktif',
  pindah: 'Pindah',
  meninggal: 'Meninggal',
}
const SP_LABELS: Record<string, string> = {
  belum_kawin: 'Belum Kawin',
  kawin: 'Kawin',
  cerai_hidup: 'Cerai Hidup',
  cerai_mati: 'Cerai Mati',
}

interface FieldRowProps {
  label: string
  value?: string | null
}
function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900 sm:col-span-2 sm:mt-0 dark:text-slate-100">
        {value || '—'}
      </dd>
    </div>
  )
}

export function WargaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [warga, setWarga] = useState<WargaFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading'>('idle')

  const isAdmin = user?.role === 'admin'
  const canWrite = isAdmin || user?.role === 'sekretaris'
  const canVerify = isAdmin || user?.role === 'sekretaris'
  const canDelete = isAdmin

  useEffect(() => {
    if (!id) return
    getWarga(id)
      .then(setWarga)
      .catch(() => setError('Data warga tidak ditemukan atau tidak bisa diakses.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!warga) return
    if (!confirm(`Hapus data "${warga.namaLengkap}"? Tindakan ini tidak bisa dibatalkan.`)) return
    try {
      await deleteWarga(warga.id)
      navigate('/warga')
    } catch {
      alert('Gagal menghapus data warga.')
    }
  }

  async function handleVerify(status: 'active' | 'rejected') {
    if (!warga) return
    setVerifyStatus('loading')
    try {
      await verifyWarga(warga.id, { status })
      const updated = await getWarga(warga.id)
      setWarga(updated)
    } catch {
      alert('Gagal memverifikasi warga.')
    } finally {
      setVerifyStatus('idle')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">Memuat data warga...</p>
      </div>
    )
  }

  if (error || !warga) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error || 'Data tidak ditemukan.'}</p>
        <Link to="/warga" className="text-indigo-600 hover:underline">← Kembali ke daftar</Link>
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
          <span className="text-slate-700 dark:text-slate-200">{warga.namaLengkap}</span>
        </nav>

        {/* Header card */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            {warga.foto ? (
              <img
                src={warga.foto}
                alt={warga.namaLengkap}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600 dark:bg-indigo-900">
                {warga.namaLengkap[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{warga.namaLengkap}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Blok {warga.blok ?? '—'} / No. {warga.noRumah ?? '—'}
              </p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                warga.status === 'aktif' ? 'bg-green-100 text-green-700' :
                warga.status === 'tidak_aktif' ? 'bg-slate-100 text-slate-600' :
                'bg-red-100 text-red-700'
              }`}>
                {STATUS_LABELS[warga.status] ?? warga.status}
              </span>
            </div>
          </div>

          {/* Aksi */}
          <div className="flex flex-wrap gap-2">
            {canVerify && (
              <>
                <button
                  type="button"
                  disabled={verifyStatus === 'loading'}
                  onClick={() => void handleVerify('active')}
                  className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Verifikasi
                </button>
                <button
                  type="button"
                  disabled={verifyStatus === 'loading'}
                  onClick={() => void handleVerify('rejected')}
                  className="rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Tolak
                </button>
              </>
            )}
            {canWrite && (
              <Link
                to={`/warga/${warga.id}/edit`}
                className="rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
              >
                Edit
              </Link>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-red-100 hover:text-red-700 dark:bg-slate-700 dark:text-slate-200"
              >
                Hapus
              </button>
            )}
          </div>
        </div>

        {/* Detail fields */}
        <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Informasi Pribadi</h2>
          </div>
          <dl className="divide-y divide-slate-100 px-6 dark:divide-slate-700">
            <FieldRow label="NIK" value={warga.nik} />
            <FieldRow label="Tempat Lahir" value={warga.tempatLahir} />
            <FieldRow label="Tanggal Lahir" value={warga.tanggalLahir} />
            <FieldRow label="Jenis Kelamin" value={warga.jenisKelamin ? JK_LABELS[warga.jenisKelamin] : undefined} />
            <FieldRow label="Agama" value={warga.agama} />
            <FieldRow label="Status Perkawinan" value={warga.statusPerkawinan ? SP_LABELS[warga.statusPerkawinan] : undefined} />
            <FieldRow label="Pendidikan" value={warga.pendidikan} />
            <FieldRow label="Pekerjaan" value={warga.pekerjaan} />
          </dl>

          <div className="border-b border-t border-slate-200 px-6 py-4 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Domisili</h2>
          </div>
          <dl className="divide-y divide-slate-100 px-6 dark:divide-slate-700">
            <FieldRow label="Alamat" value={warga.alamat} />
            <FieldRow label="Blok" value={warga.blok} />
            <FieldRow label="No. Rumah" value={warga.noRumah} />
            <FieldRow label="No. KK" value={warga.noKk} />
            <FieldRow label="Hubungan Keluarga" value={warga.hubunganKeluarga} />
          </dl>

          {/* Kontak — hanya tampil jika field tersedia (admin/sekretaris/own) */}
          {(warga.phone !== undefined || warga.email !== undefined) && (
            <>
              <div className="border-b border-t border-slate-200 px-6 py-4 dark:border-slate-700">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Kontak</h2>
              </div>
              <dl className="divide-y divide-slate-100 px-6 dark:divide-slate-700">
                <FieldRow label="Telepon" value={warga.phone} />
                <FieldRow label="Email" value={warga.email} />
              </dl>
            </>
          )}

          <div className="border-b border-t border-slate-200 px-6 py-4 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Metadata</h2>
          </div>
          <dl className="divide-y divide-slate-100 px-6 dark:divide-slate-700">
            <FieldRow label="Dibuat" value={warga.createdAt} />
            <FieldRow label="Diperbarui" value={warga.updatedAt} />
          </dl>
        </div>

        {/* Link Kartu Keluarga */}
        <div className="mt-4">
          <Link
            to={`/warga/${warga.id}/kk`}
            className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Lihat Kartu Keluarga →
          </Link>
        </div>
      </div>
    </div>
  )
}
