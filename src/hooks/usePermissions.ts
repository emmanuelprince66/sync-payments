import { useMemo } from 'react'
import { ACCESS, PAGE_AREAS, type AccessArea } from '@/lib/access-map'
import { allows, isAdminLike, isOwnerLogin, matrixAllows, matrixFromPermissions, ruleForPath, type AccessSubject } from '@/lib/sink-permissions'
import { useAuthStore } from '@/stores/auth-store'

/** What this login may do in Payments: sink's checks (owner bypass → checklist → flag → role rule) per area. */
export const permissionsFor = (subject: AccessSubject) => {
  const can = (area: AccessArea) => allows(ACCESS[area], subject)
  const isOwner = isOwnerLogin(subject.role)
  const matrix = matrixFromPermissions(subject.permissions)

  const canLogExpenses = can('logExpenses')
  const canTransferExpenses = can('expenseTransfer')
  const canApproveExpenses = can('approveExpenses')
  const canManageWallet = can('manageWallet')
  /** Wallet transfers sit inside sink's manage_bank_details banner and need can_initiate_expense_transfer too. */
  const canWalletTransfer = canManageWallet && can('transfer')
  /**
   * sink: the checklist decides the Expenses page (expenses:view); without one the link shows for any of
   * the three expense rights, and always for accountants.
   */
  const canOpenExpenses = isOwner || (matrix
    ? matrixAllows(matrix, ACCESS.expenses.matrix)
    : canLogExpenses || canTransferExpenses || canApproveExpenses || subject.role === 'ACCOUNTANT')
  /** Payments (transfer, bulk): a wallet transfer, or a payout from an expense account. */
  const canOpenPayments = canWalletTransfer || canTransferExpenses

  const pageAllowed = (path: string) => {
    const area = ruleForPath(path, PAGE_AREAS)
    if (!area) return true
    if (area === 'expensesPage') return canOpenExpenses
    if (area === 'paymentsPage') return canOpenPayments
    return can(area)
  }

  return {
    isOwner,
    /** sink isAdminLike: may change expense rules and approval rights when there is no checklist. */
    isAdminLike: isAdminLike(subject.role ?? undefined) || isOwner,
    /** Whether a route may be opened (PAGE_AREAS; Overview has no area). */
    canOpen: pageAllowed,
    canViewTransactions: can('transactions'),
    canManageWallet,
    canWalletTransfer,
    canOpenPayments,
    canOpenExpenses,
    canLogExpenses,
    canTransferExpenses,
    canApproveExpenses,
    canManageExpenseRules: can('expenseRules'),
    canViewInvoices: can('invoices'),
    canCreateInvoices: can('createInvoices'),
    canEditInvoices: can('editInvoices'),
    canDeleteInvoices: can('deleteInvoices'),
    canSendInvoices: can('sendInvoices'),
    canViewCustomers: can('customers'),
    canAddCustomers: can('addCustomers'),
    canEditCustomers: can('editCustomers'),
    canDeleteCustomers: can('deleteCustomers'),
    canUseTerminals: can('terminals'),
    canRunPayroll: can('payroll'),
    canManageSetup: can('setup'),
  }
}

export type Permissions = ReturnType<typeof permissionsFor>

/** What the signed-in user may see and do, from their role and the permissions their login carries. */
export const usePermissions = (): Permissions => {
  const role = useAuthStore(state => state.user?.role)
  const permissions = useAuthStore(state => state.user?.permissions)
  return useMemo(() => permissionsFor({ role, permissions }), [role, permissions])
}
