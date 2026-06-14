import apiClient from './apiClient'
import type {
  NotificationListResponse,
  Pengumuman,
  PengumumanDetailResponse,
  PengumumanKategori,
  PengumumanListResponse,
} from '../types/pengumuman'

// ─── Pengumuman ───────────────────────────────────────────────────

export interface ListPengumumanParams {
  page?: number
  limit?: number
  kategori?: PengumumanKategori
  is_published?: boolean
}

export async function listPengumuman(params: ListPengumumanParams = {}): Promise<PengumumanListResponse> {
  const res = await apiClient.get<PengumumanListResponse>('/pengumuman/', { params })
  return res.data
}

export async function getPengumuman(id: string): Promise<Pengumuman> {
  const res = await apiClient.get<PengumumanDetailResponse>(`/pengumuman/${id}/`)
  return res.data.data
}

export async function createPengumuman(formData: FormData): Promise<Pengumuman> {
  const res = await apiClient.post<{ status: string; data: Pengumuman }>('/pengumuman/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export async function updatePengumuman(id: string, formData: FormData): Promise<Pengumuman> {
  const res = await apiClient.put<{ status: string; data: Pengumuman }>(`/pengumuman/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

export async function deletePengumuman(id: string): Promise<void> {
  await apiClient.delete(`/pengumuman/${id}/`)
}

// ─── Notifications ────────────────────────────────────────────────

export async function listNotifications(params?: {
  page?: number
  limit?: number
  isRead?: boolean
}): Promise<NotificationListResponse> {
  const res = await apiClient.get<NotificationListResponse>('/notifications/', { params })
  return res.data
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.put(`/notifications/${id}/read/`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.put('/notifications/read-all/')
}

export async function getVapidPublicKey(): Promise<string> {
  const res = await apiClient.get<{ status: string; data: { vapidPublicKey: string } }>(
    '/notifications/push/vapid-public-key/'
  )
  return res.data.data.vapidPublicKey
}

export async function subscribePush(subscription: {
  endpoint: string
  p256dh: string
  auth: string
}): Promise<void> {
  await apiClient.post('/notifications/push/subscribe/', subscription)
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  await apiClient.delete('/notifications/push/unsubscribe/', { data: { endpoint } })
}

// ─── Helper: base64url → Uint8Array (untuk VAPID applicationServerKey) ──────

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
