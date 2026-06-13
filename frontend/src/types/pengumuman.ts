export type PengumumanKategori = 'penting' | 'acara' | 'info' | 'keamanan' | 'lainnya'

export interface Pengumuman {
  id: string
  judul: string
  isi: string
  kategori: PengumumanKategori
  gambar: string | null
  scheduledAt: string | null
  isPublished: boolean
  createdBy: { namaLengkap: string }
  createdAt: string
}

export interface PengumumanListResponse {
  status: string
  data: Pengumuman[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PengumumanDetailResponse {
  status: string
  data: Pengumuman
}

export interface Notification {
  id: string
  judul: string
  isi: string
  tipe: string
  isRead: boolean
  createdAt: string
}

export interface NotificationListResponse {
  status: string
  data: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
