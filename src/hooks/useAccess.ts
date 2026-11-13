import { useCallback, useMemo } from 'react'
import { allows, hasPermission, isOwnerLogin, matrixFromPermissions, type AccessRule, type Permission } from '@/lib/sink-permissions'
import { useAuthStore } from '@/stores/auth-store'

/**
 * The signed-in user's role and permissions, with sink's three checks (same in all three apps):
 *  - allows(rule)                 one app area or action from lib/access-map.ts
 *  - can(flag)                    sink's useUserRole().can: owner bypass, the checklist decides when present
 *  - canDo(module, action, fb)    sink's useCan().can: owner bypass, the checklist, else the role fallback
 */
export function useAccess() {
  const role = useAuthStore(state => state.user?.role)
  const id = useAuthStore(state => state.user?.id)
  const permissions = useAuthStore(state => state.user?.permissions)
  const matrix = useMemo(() => matrixFromPermissions(permissions), [permissions])
  const isOwner = isOwnerLogin(role)

  const allowsRule = useCallback((rule: AccessRule) => allows(rule, { role, permissions }), [role, permissions])
  const can = useCallback((flag: Permission) => hasPermission(permissions, flag, isOwner), [permissions, isOwner])
  const canDo = useCallback((module: string, action: string, fallback: boolean) => {
    if (isOwner) return true
    if (!matrix) return fallback
    return matrix[module]?.includes(action) ?? false
  }, [isOwner, matrix])

  return { role, id, permissions, matrix, isOwner, allows: allowsRule, can, canDo }
}
