import apiClient from './apiClient'

export interface PermissionConfig {
  key: string
  label: string
  description: string
  category: string
  allowedRoles: string[]
}

interface ApiSuccess<T> {
  status: 'success'
  data: T
  message?: string
}

export async function listPermissions(): Promise<PermissionConfig[]> {
  const { data } = await apiClient.get<ApiSuccess<PermissionConfig[]>>('/permissions/')
  return data.data
}

export async function updatePermission(key: string, allowedRoles: string[]): Promise<PermissionConfig> {
  const { data } = await apiClient.patch<ApiSuccess<PermissionConfig>>(`/permissions/${key}/`, {
    allowedRoles,
  })
  return data.data
}
