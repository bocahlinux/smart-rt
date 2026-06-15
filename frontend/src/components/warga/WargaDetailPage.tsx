import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { cn } from '@/lib/utils'
import { getWarga } from '@/services/wargaService'
import type { WargaFull } from '@/types/warga'

const JK_LABELS: Record<string, string> = { L: 'Laki-laki', P: 'Perempuan' }
const STATUS_LABELS: Record<string, string> = {
  aktif: 'Aktif', tidak_aktif: 'Tidak Aktif', pindah: 'Pindah', meninggal: 'Meninggal',
}
const SP_LABELS: Record<string, string> = {
  belum_kawin: 'Belum Kawin', kawin: 'Kawin', cerai_hidup: 'Cerai Hidup', cerai_mati: 'Cerai Mati',
}
const STATUS_CLS: Record<string, string> = {
  aktif: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  tidak_aktif: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  pindah: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  meninggal: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900 sm:col-span-2 sm:mt-0 dark:text-slate-100">{value || '—'}</dd>
    </div>
  )
}

// ── Shared content ─────────────────────────────────────────────────────────────

export function WargaDetailContent({
  id,
  isModal = false,
  onBack,
}: {
  id: string
  isModal?: boolean
  onBack?: () => void
  onDeleteSuccess?: () => void
}) {
  const [warga, setWarga] = useState<WargaFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    setWarga(null)
    getWarga(id)
      .then(setWarga)
      .catch(() => setError('Data warga tidak ditemukan atau tidak bisa diakses.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !warga) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error || 'Data tidak ditemukan.'}</p>
        {onBack && (
          <button onClick={onBack} className="text-sm text-primary-600 hover:underline">← Kembali</button>
        )}
      </div>
    )
  }

  return (
    <div className={cn(isModal ? 'px-5 pb-8 pt-4' : 'mx-auto max-w-3xl')}>
      {/* Back button — page context only */}
      {!isModal && onBack && (
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
      )}

      {/* Header card */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex min-w-0 items-center gap-4">
          {warga.foto ? (
            <img src={warga.foto} alt={warga.namaLengkap} className="h-14 w-14 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-600 dark:bg-primary-900 dark:text-primary-400">
              {warga.namaLengkap[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">{warga.namaLengkap}</h2>
            <p className="text-sm text-slate-500">
              Blok {warga.blok ?? '—'} / No. {warga.noRumah ?? '—'}
            </p>
            <span className={cn('mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_CLS[warga.status] ?? 'bg-slate-100 text-slate-500')}>
              {STATUS_LABELS[warga.status] ?? warga.status}
            </span>
          </div>
        </div>

        <div />
      </div>

      {/* Detail fields */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white">Informasi Pribadi</h3>
        </div>
        <dl className="divide-y divide-slate-50 px-5 dark:divide-slate-700">
          <FieldRow label="NIK" value={warga.nik} />
          <FieldRow label="Tempat Lahir" value={warga.tempatLahir} />
          <FieldRow label="Tanggal Lahir" value={warga.tanggalLahir} />
          <FieldRow label="Jenis Kelamin" value={warga.jenisKelamin ? JK_LABELS[warga.jenisKelamin] : undefined} />
          <FieldRow label="Agama" value={warga.agama} />
          <FieldRow label="Status Perkawinan" value={warga.statusPerkawinan ? SP_LABELS[warga.statusPerkawinan] : undefined} />
          <FieldRow label="Pendidikan" value={warga.pendidikan} />
          <FieldRow label="Pekerjaan" value={warga.pekerjaan} />
        </dl>

        <div className="border-b border-t border-slate-100 px-5 py-3 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white">Domisili</h3>
        </div>
        <dl className="divide-y divide-slate-50 px-5 dark:divide-slate-700">
          <FieldRow label="Alamat" value={warga.alamat} />
          <FieldRow label="Blok" value={warga.blok} />
          <FieldRow label="No. Rumah" value={warga.noRumah} />
          <FieldRow label="No. KK" value={warga.noKk} />
          <FieldRow label="Hubungan Keluarga" value={warga.hubunganKeluarga} />
        </dl>

        {(warga.phone !== undefined || warga.email !== undefined) && (
          <>
            <div className="border-b border-t border-slate-100 px-5 py-3 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-white">Kontak</h3>
            </div>
            <dl className="divide-y divide-slate-50 px-5 dark:divide-slate-700">
              <FieldRow label="Telepon" value={warga.phone} />
              <FieldRow label="Email" value={warga.email} />
            </dl>
          </>
        )}

        <div className="border-b border-t border-slate-100 px-5 py-3 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-white">Metadata</h3>
        </div>
        <dl className="divide-y divide-slate-50 px-5 dark:divide-slate-700">
          <FieldRow label="Dibuat" value={warga.createdAt} />
          <FieldRow label="Diperbarui" value={warga.updatedAt} />
        </dl>
      </div>

      <div className="mt-4">
        <Link to={`/warga/${warga.id}/kk`}
          className="text-sm text-primary-600 hover:underline dark:text-primary-400">
          Lihat Kartu Keluarga →
        </Link>
      </div>
    </div>
  )
}

// ── Page wrapper ───────────────────────────────────────────────────────────────

export function WargaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-4 dark:bg-slate-900 lg:px-8 lg:py-6">
      <WargaDetailContent
        id={id!}
        onBack={() => navigate(-1)}
        onDeleteSuccess={() => navigate('/warga')}
      />
    </div>
  )
}
