import type { User } from '@/types/auth'

/**
 * Cek apakah user memiliki permission key tertentu.
 * Admin selalu true. User lain dicek dari user.permissions (dari /auth/me).
 */
export function hasPerm(user: User | null | undefined, key: string): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.permissions?.[key] === true
}
