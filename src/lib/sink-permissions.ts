/**
 * Staff permissions, copied from sink-inventory so the three apps decide exactly as sink does.
 * Identical in SyncShip, CLIQBOOK and Sync360 Payments; each app's own screens are mapped onto
 * these keys in `lib/access-map.ts`.
 *
 * Sources (sink/src):
 *  - lib/store/types.ts           Permission, Permissions (flags + expense ceilings)
 *  - utils/permissionsMatrix.ts   PermissionsMatrix, isMatrix, readRoleDefaults
 *  - utils/permissions.ts         FLAG_TO_MATRIX, hasPermission (owner bypass; the checklist decides when there is one)
 *  - utils/pageAccess.ts          ruleForPath, matrixAllows, pageAllowed, isAdminLike, matrixFromPermissions
 *  - hooks/useCan.ts              can(module, action, fallback)
 *  - hooks/useExpensePermissions  canLog / canTransfer / canApprove (+ accountants approve by role), ceilings
 *  - components/app/PermissionsSync.tsx  GET user/me/permissions/ every 2 minutes and on focus
 *
 * One addition, asked for by the owner: a login that carries no `permissions` at all (a session saved
 * before this change, or a backend that doesn't send them) falls back to sink's role rules instead of
 * being refused everything. Sink's own `hasPermission` answers false there.
 */

// ─── Types (sink: lib/store/types.ts, utils/permissionsMatrix.ts) ───────────

/** Every on/off permission a staff member can have (sink's `Permission`). */
export type Permission =
  | 'manage_inventory_across_branches'
  | 'restock_products'
  | 'move_items_to_production'
  | 'apply_discounts'
  | 'damage_items'
  | 'dispense_drugs'
  | 'make_presale'
  | 'manage_bank_details'
  | 'manage_suppliers'
  | 'process_sales'
  | 'return_items'
  | 'sell_watchlist'
  | 'transfer_items'
  | 'view_orders'
  | 'view_prescriptions'
  | 'view_transactions'
  | 'can_log_expenses'
  | 'can_initiate_expense_transfer'
  | 'can_approve_expenses'

/** What a staff member can do: module → the actions switched on. Anything not listed is off. */
export type PermissionsMatrix = Record<string, string[]>

/** The `permissions` object on the login response and on `user/me/permissions/`. */
export type Permissions = Partial<Record<Permission, boolean>> & {
  /** The staff permissions checklist. When present it decides, and the flags are only read for older logins. */
  permissions_matrix?: PermissionsMatrix
  /** Spending and approval ceilings: decimal strings, never read as on/off. null = no personal ceiling. */
  max_expense_transfer_amount?: string | null
  daily_expense_transfer_limit?: string | null
  daily_expense_transaction_limit?: number | null
  max_expense_approval_amount?: string | null
}

/** business/role_permission_defaults/: every module with its actions, and what each role starts with. */
export interface RolePermissionDefaults {
  modules: PermissionsMatrix
  role_defaults: Record<string, PermissionsMatrix>
}

export const isMatrix = (value: unknown): value is PermissionsMatrix =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Object.values(value as object).every(Array.isArray)

/** The checklist from a login response's permissions, if it has one (sink: matrixFromPermissions). */
export const matrixFromPermissions = (permissions: unknown): PermissionsMatrix | null => {
  const matrix = (permissions as { permissions_matrix?: unknown } | null | undefined)?.permissions_matrix
  return isMatrix(matrix) ? matrix : null
}

/** Reads role_permission_defaults through however many { data } wrappers (sink: readRoleDefaults). */
export const readRoleDefaults = (body: unknown): RolePermissionDefaults | null => {
  const record = body as { modules?: unknown; data?: { data?: unknown; modules?: unknown } } | null
  const payload = (record?.modules ? record : (record?.data?.data ?? record?.data)) as Partial<RolePermissionDefaults> | undefined
  return isMatrix(payload?.modules) && payload?.role_defaults ? (payload as RolePermissionDefaults) : null
}

// ─── Flags (sink: utils/permissions.ts) ─────────────────────────────────────

/** The old on/off flags and where each lives in the checklist. With a checklist, it decides. */
export const FLAG_TO_MATRIX: Record<string, [string, string]> = {
  manage_inventory_across_branches: ['inventory', 'manage_branches'],
  restock_products: ['inventory', 'restock'],
  move_items_to_production: ['inventory', 'production'],
  transfer_items: ['inventory', 'transfer'],
  return_items: ['inventory', 'return'],
  damage_items: ['inventory', 'damage'],
  raw_material: ['inventory', 'raw_material'],
  view_inventory: ['inventory', 'view'],
  process_sales: ['sales', 'create'],
  apply_discounts: ['sales', 'discount'],
  make_presale: ['sales', 'presale'],
  dispense_drugs: ['sales', 'dispense'],
  view_prescriptions: ['sales', 'view_prescriptions'],
  view_transactions: ['sales', 'view'],
  sell_watchlist: ['products', 'sell_watchlist'],
  view_orders: ['orders', 'view'],
  manage_suppliers: ['suppliers', 'manage'],
  manage_bank_details: ['banking', 'manage'],
  can_log_expenses: ['expenses', 'create'],
  can_initiate_expense_transfer: ['expenses', 'transfer'],
  can_approve_expenses: ['expenses', 'approve'],
}

/** sink's hasPermission: owners have everything; the checklist decides when there is one; else the flag. */
export const hasPermission = (permissions: Permissions | null | undefined, permission: Permission, isOwner = false): boolean => {
  if (isOwner) return true
  if (!permissions) return false
  const matrix = matrixFromPermissions(permissions)
  const mapped = FLAG_TO_MATRIX[permission]
  if (matrix && mapped) return matrix[mapped[0]]?.includes(mapped[1]) ?? false
  return permissions[permission] === true
}

// ─── Pages (sink: utils/pageAccess.ts) ──────────────────────────────────────

/** "module:action" pairs; any one of them is enough. */
export type Rule = readonly string[]

/** Most specific first: the first prefix that matches decides. */
export const ruleForPath = <T>(path: string, rules: readonly (readonly [string, T])[]): T | null => {
  const match = rules.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))
  return match ? match[1] : null
}

export const matrixAllows = (matrix: PermissionsMatrix, rule: Rule) =>
  rule.some(pair => {
    const [module, action] = pair.split(':')
    return matrix[module]?.includes(action) ?? false
  })

/** Whether this login may open the page, or null when the checklist doesn't decide (then use role rules). */
export const pageAllowed = (path: string, role: string | undefined, matrix: PermissionsMatrix | null, rules: readonly (readonly [string, Rule])[]): boolean | null => {
  if (role === 'OWNER') return true
  if (!matrix) return null
  const rule = ruleForPath(path, rules)
  return rule ? matrixAllows(matrix, rule) : null
}

/** Roles that, without a checklist, get the Admin Attendant's access (sink: isAdminLike). */
export const isAdminLike = (role: string | undefined) => role === 'OWNER' || role === 'ADMIN-ATTENDANT' || role === 'MANAGER'

// ─── One decision for any screen or action ──────────────────────────────────

/** sink's role rules, used when the checklist and the flags don't decide. */
export type RoleFallback = 'everyone' | 'adminLike' | 'owner' | readonly string[]

/** How one app area or action is decided (see lib/access-map.ts). */
export type AccessRule = {
  /** Checklist pairs, any one enough (sink's PAGE_RULES / useCan). Decides when the login has a checklist. */
  matrix?: Rule
  /** sink's on/off flag (useUserRole().can). With a checklist, sink reads it through FLAG_TO_MATRIX. */
  flag?: Permission
  /** sink's role rule when neither decides. */
  roles: RoleFallback
  /** Roles that always get it whatever the checklist says (sink: accountants approve expenses by role). */
  alwaysForRoles?: readonly string[]
}

export type AccessSubject = { role?: string | null; permissions?: Permissions | null }

/** Sync360 sign-ups and older owner sessions carry no role; the apps have always treated them as the owner. */
export const isOwnerLogin = (role: string | null | undefined) => !role || role === 'OWNER'

const roleAllows = (fallback: RoleFallback, role: string | undefined) => {
  if (fallback === 'everyone') return true
  if (fallback === 'adminLike') return isAdminLike(role)
  if (fallback === 'owner') return role === 'OWNER'
  // sink: Managers get what Admin Attendants get.
  return fallback.includes(role === 'MANAGER' ? 'ADMIN-ATTENDANT' : role ?? '')
}

/** Does any permission come with this login? (Older saved sessions have none.) */
const hasAnyPermissions = (permissions: Permissions | null | undefined): permissions is Permissions =>
  Boolean(permissions) && typeof permissions === 'object' && Object.keys(permissions as object).length > 0

/**
 * The owner can do everything. Otherwise, as sink decides:
 *  1. a checklist on the login → the rule's checklist pairs (or its flag read through the checklist);
 *  2. flags but no checklist → the flag, when the rule names one;
 *  3. otherwise (no permissions on the login, or a rule with no flag) → sink's role rule.
 */
export const allows = (rule: AccessRule, { role, permissions }: AccessSubject): boolean => {
  const userRole = role ?? undefined
  if (isOwnerLogin(userRole)) return true
  if (rule.alwaysForRoles?.includes(userRole ?? '')) return true
  const matrix = matrixFromPermissions(permissions)
  if (matrix) {
    if (rule.matrix) return matrixAllows(matrix, rule.matrix)
    if (rule.flag) return hasPermission(permissions, rule.flag)
    return roleAllows(rule.roles, userRole)
  }
  if (rule.flag && hasAnyPermissions(permissions)) return hasPermission(permissions, rule.flag)
  return roleAllows(rule.roles, userRole)
}

/** A permissions payload from user/me/permissions/ (or the login), unwrapped; `role` comes back separately. */
export const readMyPermissions = (body: unknown): { role?: string; permissions: Permissions } | null => {
  const record = body as { data?: { data?: unknown } } | null
  const payload = (record?.data?.data ?? record?.data ?? body) as (Permissions & { role?: unknown; permissions?: unknown }) | null
  if (!payload || typeof payload !== 'object') return null
  // Either { role, ...permissions } (sink) or { role, permissions: { ... } }.
  const { role, permissions: nested, ...rest } = payload
  const permissions = (nested && typeof nested === 'object' ? nested : rest) as Permissions
  return { role: typeof role === 'string' ? role : undefined, permissions }
}

// ─── Sample-data logins (mock mode) ─────────────────────────────────────────

/**
 * The shape of business/role_permission_defaults/, filled with sample data for mock mode only.
 * Sink reads the real table from the backend; these role sets are a stand-in so gating can be tested.
 */
export const MOCK_ROLE_DEFAULTS: RolePermissionDefaults = {
  modules: {
    dashboard: ['view'],
    reports: ['view'],
    inventory: ['view', 'restock', 'transfer', 'return', 'damage', 'production', 'raw_material', 'manage_branches'],
    products: ['view', 'create', 'edit', 'delete', 'sell_watchlist'],
    sales: ['view', 'create', 'discount', 'reverse', 'presale', 'dispense', 'view_prescriptions'],
    orders: ['view', 'manage'],
    bookings: ['view', 'create', 'edit', 'cancel'],
    suppliers: ['view', 'manage'],
    expenses: ['view', 'create', 'transfer', 'approve'],
    customers: ['view', 'create', 'edit', 'delete'],
    banking: ['view', 'manage'],
    invoices: ['view', 'create', 'edit', 'delete', 'send'],
    campaigns: ['view'],
    loyalty: ['view'],
    staff: ['view', 'invite', 'manage_roles'],
    attendance: ['view'],
    settings: ['view', 'edit'],
  },
  role_defaults: {
    'ADMIN-ATTENDANT': {
      dashboard: ['view'],
      reports: ['view'],
      inventory: ['view', 'restock', 'transfer', 'return', 'damage'],
      products: ['view', 'create', 'edit', 'delete'],
      sales: ['view', 'create', 'discount', 'reverse'],
      orders: ['view', 'manage'],
      bookings: ['view', 'create', 'edit', 'cancel'],
      expenses: ['view', 'create', 'transfer'],
      customers: ['view', 'create', 'edit', 'delete'],
      banking: ['view', 'manage'],
      invoices: ['view', 'create', 'edit', 'delete', 'send'],
      staff: ['view', 'invite', 'manage_roles'],
      settings: ['view', 'edit'],
    },
    ATTENDANT: {
      dashboard: ['view'],
      inventory: ['view'],
      products: ['view'],
      sales: ['view', 'create'],
      orders: ['view'],
      bookings: ['view', 'create'],
      customers: ['view', 'create'],
      invoices: ['view'],
    },
  },
}

/** The old flags that match a checklist (so a sample login carries both, like a real one). */
const flagsFor = (matrix: PermissionsMatrix): Partial<Record<Permission, boolean>> =>
  Object.fromEntries(Object.entries(FLAG_TO_MATRIX).map(([flag, [module, action]]) => [flag, matrix[module]?.includes(action) ?? false]))

/** A realistic `permissions` object for a sample login: the role's defaults, plus any extra actions ticked. */
export const mockPermissionsFor = (role: string, extra: PermissionsMatrix = {}): Permissions => {
  const base = MOCK_ROLE_DEFAULTS.role_defaults[role] ?? {}
  const matrix: PermissionsMatrix = { ...base }
  for (const [module, actions] of Object.entries(extra)) matrix[module] = Array.from(new Set([...(matrix[module] ?? []), ...actions]))
  return {
    ...flagsFor(matrix),
    max_expense_transfer_amount: null,
    daily_expense_transfer_limit: null,
    daily_expense_transaction_limit: null,
    max_expense_approval_amount: null,
    permissions_matrix: matrix,
  }
}
