import type { AccessRule } from './sink-permissions'

/**
 * Sync360 Payments screens and actions → sink-inventory's permission keys.
 * Same structure in SyncShip, CLIQBOOK and Payments (lib/access-map.ts); the logic is lib/sink-permissions.ts.
 *
 * How a rule is read (sink's order): the owner can do everything → the login's checklist
 * (`permissions_matrix`, "module:action", any one pair enough) → sink's on/off flag when the login has
 * flags but no checklist → the role rule (`adminLike` = OWNER / ADMIN-ATTENDANT / MANAGER).
 *
 * Payments has no stated attendant defaults, so role rules are sink's own (its links.ts / middleware roles
 * and useCan fallbacks).
 */
export const ACCESS = {
  // ─── Wallet (sink: Transactions) ────────────────────────────────────────
  /** Transactions page. sink /transactions → banking:view or sales:view (link flag view_transactions). */
  transactions: { matrix: ['banking:view', 'sales:view'], flag: 'view_transactions', roles: 'everyone' },
  /** Balances, Accounts page, Payouts page, payout banks, sub-accounts, Payroll. sink Transactions → manage_bank_details (banking:manage). */
  manageWallet: { flag: 'manage_bank_details', roles: 'adminLike' },
  /** Start a transfer. sink Transactions → can_initiate_expense_transfer (expenses:transfer), shown inside the balance banner. */
  transfer: { flag: 'can_initiate_expense_transfer', roles: 'adminLike' },

  // ─── Expenses (sink: useExpensePermissions, links.ts Expenses) ──────────
  /** Expenses page with a checklist. sink /expenses → expenses:view. Without one: any expense flag, accountants always. */
  expenses: { matrix: ['expenses:view'], roles: 'adminLike' },
  logExpenses: { flag: 'can_log_expenses', roles: 'adminLike' },
  expenseTransfer: { flag: 'can_initiate_expense_transfer', roles: 'adminLike' },
  /** Accountants approve by role (sink), whatever the checklist says. */
  approveExpenses: { flag: 'can_approve_expenses', roles: 'adminLike', alwaysForRoles: ['ACCOUNTANT'] },
  /** Expense rules, budgets' settings tab and the team's approval rights. sink Staff → staff:manage_roles (fallback isAdminLike). */
  expenseRules: { matrix: ['staff:manage_roles'], roles: 'adminLike' },

  // ─── Invoices (backend's new `invoices` module) ─────────────────────────
  invoices: { matrix: ['invoices:view'], roles: 'everyone' },
  createInvoices: { matrix: ['invoices:create'], roles: 'everyone' },
  editInvoices: { matrix: ['invoices:edit'], roles: 'everyone' },
  deleteInvoices: { matrix: ['invoices:delete'], roles: 'adminLike' },
  sendInvoices: { matrix: ['invoices:send'], roles: 'everyone' },

  // ─── Customers (sink: Customers / Contact) ──────────────────────────────
  /** sink /customers → customers:view; role rule OWNER / ADMIN-ATTENDANT / ACCOUNTANT. */
  customers: { matrix: ['customers:view'], roles: ['OWNER', 'ADMIN-ATTENDANT', 'ACCOUNTANT'] },
  addCustomers: { matrix: ['customers:create'], roles: 'everyone' },
  editCustomers: { matrix: ['customers:edit'], roles: 'everyone' },
  deleteCustomers: { matrix: ['customers:delete'], roles: 'adminLike' },

  // ─── Terminals (sink: Payment Terminal) ─────────────────────────────────
  /** sink /payment-terminal → sales:create (flag process_sales); roles OWNER / ADMIN-ATTENDANT / ATTENDANT. */
  terminals: { matrix: ['sales:create'], flag: 'process_sales', roles: ['OWNER', 'ADMIN-ATTENDANT', 'ATTENDANT'] },

  // ─── Payroll (no sink screen; pays salaries out of the wallet) ──────────
  payroll: { flag: 'manage_bank_details', roles: 'adminLike' },

  // ─── Setup (sink: Store / Operations / Settings) ────────────────────────
  /** Compliance, KYC (and branches / storefront when switched back on). sink /store-info, … → settings:view. */
  setup: { matrix: ['settings:view'], roles: 'adminLike' },
} as const satisfies Record<string, AccessRule>

export type AccessArea = keyof typeof ACCESS

/**
 * Routes → the area that opens them. Most specific first: the first prefix that matches decides.
 * `expenses` and `payments` are worked out in usePermissions (any expense right / any transfer right).
 */
export const PAGE_AREAS: readonly (readonly [string, AccessArea | 'expensesPage' | 'paymentsPage'])[] = [
  ['/transactions', 'transactions'],
  ['/payments', 'paymentsPage'],
  ['/payouts', 'manageWallet'],
  ['/accounts', 'manageWallet'],
  ['/expenses', 'expensesPage'],
  ['/approvals', 'expensesPage'],
  ['/invoices/new', 'createInvoices'],
  ['/invoices', 'invoices'],
  ['/customers', 'customers'],
  ['/terminals', 'terminals'],
  ['/payroll', 'payroll'],
  ['/compliance', 'setup'],
  ['/kyc', 'setup'],
  ['/branches', 'setup'],
  ['/storefront', 'setup'],
]
