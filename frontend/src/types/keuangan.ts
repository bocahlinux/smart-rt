// TypeScript types untuk modul Keuangan RT
// Lihat docs/06-API-CONTRACT.md §4

export type TransaksiTipe = 'pemasukan' | 'pengeluaran'
export type TransaksiStatus = 'draft' | 'confirmed' | 'rejected'
export type IuranStatus = 'pending' | 'lunas' | 'ditolak'

export interface KategoriTransaksi {
  id: string
  nama: string
  tipe: TransaksiTipe
  created_at: string
}

export interface TransaksiCreatedBy {
  id: string
  namaLengkap: string
}

export interface Transaksi {
  id: string
  kategori: KategoriTransaksi
  jumlah: string
  keterangan: string
  tanggal: string
  tipe: TransaksiTipe
  status: TransaksiStatus
  created_by: TransaksiCreatedBy
  created_at: string
}

export interface TransaksiFormPayload {
  kategoriId: string
  jumlah: number
  keterangan?: string
  tanggal: string
  tipe: TransaksiTipe
}

export interface IuranWargaRef {
  id: string
  namaLengkap: string
  blok: string
  noRumah: string
}

export interface IuranWarga {
  id: string
  warga: IuranWargaRef
  bulan: number
  tahun: number
  jumlah: string
  status: IuranStatus
  buktiUrl: string | null
  keterangan: string
  confirmed_by: TransaksiCreatedBy | null
  confirmed_at: string | null
  created_at: string
}

export interface MyIuran {
  id: string
  bulan: number
  tahun: number
  jumlah: string
  status: IuranStatus
  buktiUrl: string | null
  keterangan: string
  created_at: string
}

export interface IuranUploadPayload {
  wargaId: string
  bulan: number
  tahun: number
  jumlah: number
  bukti_transfer: File
}

export interface IuranKonfirmasiPayload {
  status: 'lunas' | 'ditolak'
  keterangan?: string
}

export interface BulananData {
  bulan: number
  pemasukan: number
  pengeluaran: number
}

export interface DashboardKeuangan {
  saldo: number
  totalPemasukan: number
  totalPengeluaran: number
  bulanan: BulananData[]
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}
