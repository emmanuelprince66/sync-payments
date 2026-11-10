/** Sync360 user roles (same set as sink-inventory's lib/store/types.ts). */
export type UserRole =
  | 'OWNER'
  | 'ADMIN-ATTENDANT'
  | 'ATTENDANT'
  | 'PHARMACIST'
  | 'PRODUCTION-MANAGER'
  | 'ACCOUNTANT'
  | 'INVENTORY-MANAGER'

/** Only owners can create businesses (sink shows "Add Business" to OWNER only). */
export const canCreateBusiness = (role: UserRole | undefined) => !role || role === 'OWNER'
