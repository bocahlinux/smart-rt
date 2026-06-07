// Tipe domain auth — lihat docs/06-API-CONTRACT.md §2.

export type UserRole = 'admin' | 'sekretaris' | 'bendahara' | 'pengurus' | 'warga'

export type UserStatus = 'pending' | 'active' | 'rejected'

export interface UserProfile {
  namaLengkap: string | null
  foto: string | null
}

export interface User {
  id: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  profile?: UserProfile | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  phone: string
  password: string
  passwordConfirmation: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  newPasswordConfirmation: string
}

export interface LoginResponseData {
  user: User
  accessToken: string
  expiresIn: number
}

export interface RefreshResponseData {
  accessToken: string
  expiresIn: number
}
