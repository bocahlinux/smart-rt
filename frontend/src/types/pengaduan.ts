export type PengaduanKategori =
  | 'infrastruktur'
  | 'keamanan'
  | 'kebersihan'
  | 'sosial'
  | 'lainnya'

export type PengaduanStatus = 'diajukan' | 'diproses' | 'selesai' | 'ditolak'

export interface PengaduanWarga {
  namaLengkap: string
}

export interface PengaduanStatusHistory {
  status: PengaduanStatus
  keterangan: string
  updatedBy: string
  updatedAt: string
}

export interface Pengaduan {
  id: string
  judul: string
  kategori: PengaduanKategori
  status: PengaduanStatus
  foto: string | null
  warga: PengaduanWarga
  createdAt: string
}

export interface PengaduanDetail extends Pengaduan {
  deskripsi: string
  statusHistory: PengaduanStatusHistory[]
  updatedAt: string
}

export interface PengaduanListResponse {
  status: string
  data: Pengaduan[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PengaduanDetailResponse {
  status: string
  data: PengaduanDetail
}
