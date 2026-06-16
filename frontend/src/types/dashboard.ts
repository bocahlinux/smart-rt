export interface IuranBulanIni {
  status: 'lunas' | 'pending' | 'ditolak' | 'belum_bayar'
  jumlah?: number
  bulan: number
  tahun: number
}

export interface IuranRiwayat {
  bulan: number
  tahun: number
  status: 'lunas' | 'pending' | 'ditolak' | 'belum_bayar'
}

export interface ProfileInfoWarga {
  namaLengkap: string
  noKk: string | null
  jumlahAnggotaKK: number
  kartuKeluargaId: string | null
}

export interface PengumumanRingkas {
  id: string
  judul: string
  kategori: string
  createdAt: string
}

export interface PengaduanRingkas {
  id: string
  judul: string
  status: 'diajukan' | 'diproses' | 'selesai' | 'ditolak'
  createdAt: string
}

export interface KegiatanRingkas {
  id: string
  nama: string
  tanggal: string
  lokasi: string | null
}

export interface IuranBulanIniPengurus {
  bulan: number
  tahun: number
  lunas: number
  pending: number
}

export interface WargaBelumLunas {
  id: string
  namaLengkap: string
  blok: string
  noRumah: string
  noKk: string | null
}

export interface TransaksiRingkas {
  id: string
  tipe: 'pemasukan' | 'pengeluaran'
  jumlah: number
  keterangan: string
  tanggal: string
  kategori: string
}

export interface IuranPendingItem {
  id: string
  wargaNama: string
  jumlah: number
  bulan: number
  tahun: number
  jenisNama: string
}

export interface ArusKasBulan {
  label: string
  bulan: number
  tahun: number
  pemasukan: number
  pengeluaran: number
}

export interface DashboardPengurus {
  role: string
  totalWarga: number
  wargaAktif: number
  totalKk: number
  wargaBaruBulanIni: number
  saldoKas: number
  pengaduanAktif: number
  pengaduanSelesai: number
  kegiatanMendatang: number
  iuranBulanIni: IuranBulanIniPengurus
  iuranPending: number
  wargaBelumLunas: WargaBelumLunas[]
  pengajuanKkPending: number
  pollingAktif: number
  kegiatanMendatangList: KegiatanRingkas[]
  pengumumanTerbaru: PengumumanRingkas[]
  pengaduanTerbaru: PengaduanRingkas[]
  // Bendahara-specific fields
  pemasukanBulanIni?: number
  pengeluaranBulanIni?: number
  arusKas6Bulan?: ArusKasBulan[]
  transaksiTerbaru?: TransaksiRingkas[]
  iuranPendingList?: IuranPendingItem[]
}

export interface DashboardWarga {
  profileInfo: ProfileInfoWarga | null
  iuranBulanIni: IuranBulanIni
  riwayatIuran: IuranRiwayat[]
  pengumumanTerbaru: PengumumanRingkas[]
  pengaduanSaya: PengaduanRingkas[]
  kegiatanMendatang: KegiatanRingkas[]
}
