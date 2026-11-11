import { lazy } from 'react'

/** Page modules, split per route. Import functions are kept so pages can be warmed up before they're needed. */
const loaders = {
  auth: () => import('@/features/auth/AuthPage'),
  selectBusiness: () => import('@/features/business/SelectBusinessPage'),
  overview: () => import('@/features/overview/OverviewPage'),
  transactions: () => import('@/features/transactions/TransactionsPage'),
  branches: () => import('@/features/branches/BranchesPage'),
  payments: () => import('@/features/payments/PaymentsPage'),
  expenses: () => import('@/features/expenses/ExpensesPage'),
  invoices: () => import('@/features/invoices/InvoicesPage'),
  invoiceNew: () => import('@/features/invoices/CreateInvoicePage'),
  invoiceDetail: () => import('@/features/invoices/InvoiceDetailPage'),
  // Reconciliation is switched off for now (see router.tsx).
  // reconciliation: () => import('@/features/reconciliation/ReconciliationPage'),
  payouts: () => import('@/features/payouts/PayoutsPage'),
  terminals: () => import('@/features/terminals/TerminalsPage'),
  accounts: () => import('@/features/accounts/AccountsPage'),
  payroll: () => import('@/features/payroll/PayrollPage'),
  compliance: () => import('@/features/compliance/CompliancePage'),
  kyc: () => import('@/features/kyc/KycPage'),
  customers: () => import('@/features/customers/CustomersPage'),
  customerDetail: () => import('@/features/customers/CustomerDetailPage'),
  storefront: () => import('@/features/storefront/StorefrontPage'),
  bnpl: () => import('@/features/bnpl/BnplPage'),
}

export const pages = {
  AuthPage: lazy(loaders.auth),
  SelectBusinessPage: lazy(loaders.selectBusiness),
  OverviewPage: lazy(loaders.overview),
  TransactionsPage: lazy(loaders.transactions),
  BranchesPage: lazy(loaders.branches),
  PaymentsPage: lazy(loaders.payments),
  ExpensesPage: lazy(loaders.expenses),
  InvoicesPage: lazy(loaders.invoices),
  CreateInvoicePage: lazy(loaders.invoiceNew),
  InvoiceDetailPage: lazy(loaders.invoiceDetail),
  // ReconciliationPage: lazy(loaders.reconciliation),
  PayoutsPage: lazy(loaders.payouts),
  TerminalsPage: lazy(loaders.terminals),
  AccountsPage: lazy(loaders.accounts),
  PayrollPage: lazy(loaders.payroll),
  CompliancePage: lazy(loaders.compliance),
  KycPage: lazy(loaders.kyc),
  CustomersPage: lazy(loaders.customers),
  CustomerDetailPage: lazy(loaders.customerDetail),
  StorefrontPage: lazy(loaders.storefront),
  BnplPage: lazy(loaders.bnpl),
}

/** Downloads the app's pages in the background, ignoring failures, so navigating never waits on code. */
export const preloadAppShell = () => {
  for (const load of Object.values(loaders)) load().catch(() => undefined)
}
