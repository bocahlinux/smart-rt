// Tipe domain Warga — lihat docs/06-API-CONTRACT.md §3.

export type WargaStatus = 'aktif' | 'tidak_aktif' | 'pindah' | 'meninggal'

export type JenisKelamin = 'L' | 'P'

export type StatusPerkawinan = 'belum_kawin' | 'kawin' | 'cerai_hidup' | 'cerai_mati'

// Response full (admin/sekretaris/warga own)
export interface WargaFull {
  id: string
  userId?: string
  nik?: string | null
  namaLengkap: string
  tempatLahir?: string | null
  tanggalLahir?: string | null
  jenisKelamin?: JenisKelamin | null
  agama?: string | null
  statusPerkawinan?: StatusPerkawinan | null
  pendidikan?: string | null
  pekerjaan?: string | null
  noKk?: string | null
  hubunganKeluarga?: string | null
  alamat?: string | null
  blok?: string | null
  noRumah?: string | null
  phone?: string | null
  email?: string | null
  status: WargaStatus
  foto?: string | null
  createdAt?: string
  updatedAt?: string
}

// Response masked (bendahara/pengurus)
export interface WargaMasked {
  id: string
  nikMasked?: string | null
  noKkMasked?: string | null
  namaLengkap: string
  blok?: string | null
  noRumah?: string | null
  phoneMasked?: string | null
  pekerjaan?: string | null
  status: WargaStatus
}

// Public minimal
export interface WargaPublic {
  id: string
  namaLengkap: string
  blok?: string | null
  noRumah?: string | null
  status: WargaStatus
}

export type WargaAny = WargaFull | WargaMasked | WargaPublic

export interface WargaFormPayload {
  userId?: string
  nik?: string
  namaLengkap: string
  tempatLahir?: string
  tanggalLahir?: string
  jenisKelamin?: JenisKelamin
  agama?: string
  statusPerkawinan?: StatusPerkawinan
  pendidikan?: string
  pekerjaan?: string
  noKk?: string
  hubunganKeluarga?: string
  alamat?: string
  blok?: string
  noRumah?: string
  status?: WargaStatus
}

export interface VerifyPayload {
  status: 'active' | 'rejected'
  keterangan?: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface WargaListResponse {
  status: 'success'
  data: WargaAny[]
  pagination?: Pagination
}

export interface WargaDetailResponse {
  status: 'success'
  data: WargaFull
}

export interface ImportResult {
  imported: number
  failed: number
  errors: string[]
}
