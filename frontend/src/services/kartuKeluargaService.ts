import apiClient from './apiClient'
import type {
  KartuKeluarga,
  PengajuanAnggotaBaru,
  PengajuanPenghapusan,
  PengajuanPerubahan,
  DataAnggotaPayload,
} from '../types/kartuKeluarga'

interface ApiSuccess<T> { status: 'success'; data: T; message?: string }

// ── KartuKeluarga ──────────────────────────────────────────────────────────

export async function getKKSaya(): Promise<KartuKeluarga> {
  const { data } = await apiClient.get<ApiSuccess<KartuKeluarga>>('/kk/saya/')
  return data.data
}

export async function getKK(id: string): Promise<KartuKeluarga> {
  const { data } = await apiClient.get<ApiSuccess<KartuKeluarga>>(`/kk/${id}/`)
  return data.data
}

export async function listKK(): Promise<KartuKeluarga[]> {
  const { data } = await apiClient.get<ApiSuccess<KartuKeluarga[]>>('/kk/')
  return Array.isArray(data.data) ? data.data : []
}

export async function createKK(payload: { noKk: string; alamat?: string }): Promise<KartuKeluarga> {
  const { data } = await apiClient.post<ApiSuccess<KartuKeluarga>>('/kk/', payload)
  return data.data
}

export async function updateKK(id: string, payload: { noKk?: string; alamat?: string }): Promise<KartuKeluarga> {
  const { data } = await apiClient.patch<ApiSuccess<KartuKeluarga>>(`/kk/${id}/`, payload)
  return data.data
}

export async function cariKKByNoKK(noKk: string): Promise<KartuKeluarga> {
  const { data } = await apiClient.get<ApiSuccess<KartuKeluarga>>(`/kk/cari/${noKk}/`)
  return data.data
}

export async function linkWargaKeKK(wargaId: string, kkId: string, hubungan: string): Promise<void> {
  await apiClient.patch(`/warga/${wargaId}/`, { kartuKeluargaId: kkId, hubunganKeluarga: hubungan })
}

// ── Pengajuan Tambah Anggota ───────────────────────────────────────────────

export async function listPengajuanTambah(statusFilter?: string): Promise<PengajuanAnggotaBaru[]> {
  const { data } = await apiClient.get<ApiSuccess<PengajuanAnggotaBaru[]>>('/kk/pengajuan/tambah/', {
    params: statusFilter ? { status: statusFilter } : undefined,
  })
  return Array.isArray(data.data) ? data.data : []
}

export async function createPengajuanTambah(payload: {
  kartuKeluargaId: string
  dataAnggota: DataAnggotaPayload
  alasan?: string
}): Promise<PengajuanAnggotaBaru> {
  const { data } = await apiClient.post<ApiSuccess<PengajuanAnggotaBaru>>('/kk/pengajuan/tambah/', payload)
  return data.data
}

export async function reviewPengajuanTambah(id: string, aksi: 'setujui' | 'tolak', catatan?: string): Promise<void> {
  await apiClient.post(`/kk/pengajuan/tambah/${id}/review/`, { aksi, catatan })
}

// ── Pengajuan Penghapusan ─────────────────────────────────────────────────

export async function listPengajuanHapus(statusFilter?: string): Promise<PengajuanPenghapusan[]> {
  const { data } = await apiClient.get<ApiSuccess<PengajuanPenghapusan[]>>('/kk/pengajuan/hapus/', {
    params: statusFilter ? { status: statusFilter } : undefined,
  })
  return Array.isArray(data.data) ? data.data : []
}

export async function createPengajuanHapus(payload: {
  kartuKeluargaId: string
  wargaTargetId: string
  alasan: string
}): Promise<PengajuanPenghapusan> {
  const { data } = await apiClient.post<ApiSuccess<PengajuanPenghapusan>>('/kk/pengajuan/hapus/', payload)
  return data.data
}

export async function reviewPengajuanHapus(id: string, aksi: 'setujui' | 'tolak', catatan?: string): Promise<void> {
  await apiClient.post(`/kk/pengajuan/hapus/${id}/review/`, { aksi, catatan })
}

// ── Pengajuan Perubahan Data ──────────────────────────────────────────────

export async function listPengajuanUbah(statusFilter?: string): Promise<PengajuanPerubahan[]> {
  const { data } = await apiClient.get<ApiSuccess<PengajuanPerubahan[]>>('/kk/pengajuan/ubah/', {
    params: statusFilter ? { status: statusFilter } : undefined,
  })
  return Array.isArray(data.data) ? data.data : []
}

export async function createPengajuanUbah(payload: {
  wargaTargetId: string
  fieldChanges: Record<string, unknown>
  alasan: string
}): Promise<PengajuanPerubahan> {
  const { data } = await apiClient.post<ApiSuccess<PengajuanPerubahan>>('/kk/pengajuan/ubah/', payload)
  return data.data
}

export async function reviewPengajuanUbah(id: string, aksi: 'setujui' | 'tolak', catatan?: string): Promise<void> {
  await apiClient.post(`/kk/pengajuan/ubah/${id}/review/`, { aksi, catatan })
}
