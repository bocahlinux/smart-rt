export interface IuranBulanIni {
  status: 'lunas' | 'pending' | 'ditolak' | 'belum_bayar'
  jumlah?: number
  bulan: number
  tahun: number
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

export interface DashboardPengurus {
  totalWarga: number
  wargaAktif: number
  saldoKas: number
  pengaduanAktif: number
  pengaduanSelesai: number
  kegiatanMendatang: number
  iuranBulanIni: IuranBulanIniPengurus
}

export interface DashboardWarga {
  iuranBulanIni: IuranBulanIni
  pengumumanTerbaru: PengumumanRingkas[]
  pengaduanSaya: PengaduanRingkas[]
  kegiatanMendatang: KegiatanRingkas[]
}
