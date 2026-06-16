// TypeScript types untuk modul Keuangan RT
// Lihat docs/06-API-CONTRACT.md §4

export type TransaksiTipe = 'pemasukan' | 'pengeluaran'
export type TransaksiStatus = 'draft' | 'confirmed' | 'rejected'
export type IuranStatus = 'pending' | 'lunas' | 'ditolak'
export type JenisIuranTipe = 'wajib' | 'opsional'
export type JenisIuranUnit = 'per_warga' | 'per_kk'

export interface JenisIuran {
  id: string
  nama: string
  slug: string
  tipe: JenisIuranTipe
  unit: JenisIuranUnit
  nominal: string
  keterangan: string
  isActive: boolean
  urutan: number
  updatedAt: string
}

export interface JenisIuranFormPayload {
  nama: string
  tipe: JenisIuranTipe
  unit: JenisIuranUnit
  nominal: number
  keterangan?: string
  isActive?: boolean
  urutan?: number
}

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
  jenis: JenisIuran | null
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
  jenis: JenisIuran | null
  bulan: number
  tahun: number
  jumlah: string
  status: IuranStatus
  buktiUrl: string | null
  keterangan: string
  created_at: string
}

export interface IuranUploadPayload {
  jenisId: string
  bulan: number
  tahun: number
  jumlah: number
  bukti_transfer: File
}

export interface PengaturanIuran {
  nominalDefault: number
  saldoAwal: number
  keterangan: string
  updatedAt: string
}

export interface IuranKonfirmasiPayload {
  status: 'lunas' | 'ditolak'
  keterangan?: string
}

export interface BukuKasEntry {
  no: number
  id: string
  tanggal: string
  keterangan: string
  kategori: string
  tipe: 'pemasukan' | 'pengeluaran'
  jumlah: string
  saldo: string
  sumber: 'manual' | 'iuran'
}

export interface BukuKasData {
  saldo_awal: string
  entries: BukuKasEntry[]
  total_masuk: string
  total_keluar: string
  saldo_akhir: string
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
