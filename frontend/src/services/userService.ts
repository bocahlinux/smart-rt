import type { UserRole, UserStatus } from '@/types/auth'
import apiClient from './apiClient'

export interface ManagedUser {
  id: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  createdAt: string
}

export interface UserListResponse {
  count: number
  results: ManagedUser[]
}

export interface UserListParams {
  role?: UserRole | ''
  status?: UserStatus | ''
  search?: string
}

export interface UpdateUserPayload {
  role?: UserRole
  status?: UserStatus
}

export interface CreateUserPayload {
  email: string
  phone: string
  password: string
  role: UserRole
  status: UserStatus
}

export async function listUsers(params: UserListParams = {}): Promise<UserListResponse> {
  const query = new URLSearchParams()
  if (params.role) query.set('role', params.role)
  if (params.status) query.set('status', params.status)
  if (params.search) query.set('search', params.search)
  const qs = query.toString()
  const res = await apiClient.get<{ data: UserListResponse }>(`/users/${qs ? `?${qs}` : ''}`)
  return res.data.data
}

export async function createUser(payload: CreateUserPayload): Promise<ManagedUser> {
  const res = await apiClient.post<{ data: ManagedUser }>('/users/', payload)
  return res.data.data
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<ManagedUser> {
  const res = await apiClient.patch<{ data: ManagedUser }>(`/users/${id}/`, payload)
  return res.data.data
}
