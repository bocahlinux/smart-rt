export type HubunganKeluarga =
  | 'kepala_keluarga'
  | 'istri'
  | 'anak'
  | 'orang_tua'
  | 'menantu'
  | 'cucu'
  | 'saudara'
  | 'lainnya'

export const HUBUNGAN_LABEL: Record<HubunganKeluarga, string> = {
  kepala_keluarga: 'Kepala Keluarga',
  istri: 'Istri',
  anak: 'Anak',
  orang_tua: 'Orang Tua',
  menantu: 'Menantu',
  cucu: 'Cucu',
  saudara: 'Saudara/i',
  lainnya: 'Lainnya',
}

export const HUBUNGAN_ORDER: HubunganKeluarga[] = [
  'kepala_keluarga', 'istri', 'anak', 'orang_tua', 'menantu', 'cucu', 'saudara', 'lainnya',
]

export interface AnggotaKK {
  id: string
  namaLengkap: string
  nik?: string | null
  hubunganKeluarga?: HubunganKeluarga | null
  hubunganKeluargaLabel?: string | null
  jenisKelamin?: string | null
  tanggalLahir?: string | null
  pekerjaan?: string | null
  status: string
  alamat?: string | null
  blok?: string | null
  noRumah?: string | null
}

export interface KepalaKeluarga {
  id: string
  namaLengkap: string
}

export interface KartuKeluarga {
  id: string
  noKk: string
  alamat: string
  kepalaKeluarga: KepalaKeluarga | null
  jumlahAnggota: number
  anggota: AnggotaKK[]
  createdAt: string
}

export type StatusPengajuan = 'pending' | 'disetujui' | 'ditolak'

export interface PengajuanAnggotaBaru {
  id: string
  kartuKeluargaId?: string
  noKk?: string
  pengajuEmail?: string
  dataAnggota: Record<string, unknown>
  alasan: string
  status: StatusPengajuan
  catatan_admin?: string | null
  reviewedBy?: string | null
  createdAt: string
  reviewedAt?: string | null
}

export interface PengajuanPenghapusan {
  id: string
  kartuKeluargaId?: string
  wargaTargetId?: string
  noKk?: string
  wargaTargetNama?: string
  pengajuEmail?: string
  alasan: string
  status: StatusPengajuan
  catatan_admin?: string | null
  reviewedBy?: string | null
  createdAt: string
  reviewedAt?: string | null
}

export interface PengajuanPerubahan {
  id: string
  wargaTargetId?: string
  wargaTargetNama?: string
  pengajuEmail?: string
  fieldChanges: Record<string, unknown>
  alasan: string
  status: StatusPengajuan
  catatan_admin?: string | null
  reviewedBy?: string | null
  createdAt: string
  reviewedAt?: string | null
}

export interface DataAnggotaPayload {
  nama_lengkap: string
  nik?: string
  hubungan_keluarga: HubunganKeluarga
  jenis_kelamin?: 'L' | 'P'
  tanggal_lahir?: string
  tempat_lahir?: string
  agama?: string
  status_perkawinan?: string
  pendidikan?: string
  pekerjaan?: string
  blok?: string
  no_rumah?: string
  alamat?: string
}
