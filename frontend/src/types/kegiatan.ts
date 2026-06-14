export interface PenanggungJawab {
  namaLengkap: string
}

export interface RSVPItem {
  id: string
  user: { namaLengkap: string }
  status: RSVPStatus
  createdAt: string
}

export type RSVPStatus = 'hadir' | 'tidak_hadir' | 'masih_ragu'

export interface Kegiatan {
  id: string
  nama: string
  deskripsi: string | null
  tanggal: string
  lokasi: string | null
  penanggungJawab: PenanggungJawab | null
  rsvpCount: number
}

export interface KegiatanDetail extends Kegiatan {
  kuotaPeserta: number | null
  rsvpList: RSVPItem[]
  myRsvp: RSVPStatus | null
  createdAt: string
  updatedAt: string
}

export interface KegiatanListResponse {
  status: string
  data: Kegiatan[]
}

export interface KegiatanDetailResponse {
  status: string
  data: KegiatanDetail
}
