import apiClient from './apiClient'
import type {
  ThreadDetail,
  ThreadDetailResponse,
  ThreadKategori,
  ThreadListResponse,
  VoteResponse,
} from '../types/forum'

export interface ListThreadParams {
  page?: number
  limit?: number
  kategori?: ThreadKategori
  sort?: 'terbaru' | 'terlama'
}

export async function listThreads(params: ListThreadParams = {}): Promise<ThreadListResponse> {
  const res = await apiClient.get<ThreadListResponse>('/forum/', { params })
  return res.data
}

export async function getThread(id: string): Promise<ThreadDetail> {
  const res = await apiClient.get<ThreadDetailResponse>(`/forum/${id}/`)
  return res.data.data
}

export async function createThread(data: {
  judul: string
  isi: string
  kategori: ThreadKategori
}): Promise<ThreadDetail> {
  const res = await apiClient.post<ThreadDetailResponse>('/forum/', data)
  return res.data.data
}

export async function updateThread(
  id: string,
  data: Partial<{ judul: string; isi: string; kategori: ThreadKategori }>,
): Promise<ThreadDetail> {
  const res = await apiClient.put<ThreadDetailResponse>(`/forum/${id}/`, data)
  return res.data.data
}

export async function deleteThread(id: string): Promise<void> {
  await apiClient.delete(`/forum/${id}/`)
}

export async function pinThread(id: string): Promise<void> {
  await apiClient.put(`/forum/${id}/pin/`)
}

export async function lockThread(id: string): Promise<void> {
  await apiClient.put(`/forum/${id}/lock/`)
}

export async function addComment(
  threadId: string,
  data: { isi: string; parentId?: string },
): Promise<void> {
  await apiClient.post(`/forum/${threadId}/comments/`, data)
}

export async function updateComment(id: string, isi: string): Promise<void> {
  await apiClient.put(`/forum/comments/${id}/`, { isi })
}

export async function deleteComment(id: string): Promise<void> {
  await apiClient.delete(`/forum/comments/${id}/`)
}

export async function toggleVote(threadId: string): Promise<VoteResponse['data']> {
  const res = await apiClient.post<VoteResponse>(`/forum/${threadId}/vote/`)
  return res.data.data
}
