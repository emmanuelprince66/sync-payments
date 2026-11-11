// Hidden for now (restore with their nav items below): FileCheck2 (Reconciliation), Send (Payments), HandCoins (Pay later).
import { Contact, CreditCard, FileText, GitBranch, Landmark, LayoutDashboard, MonitorSmartphone, ReceiptText, ShieldCheck, Store, UsersRound, type LucideIcon } from 'lucide-react'
import { paths } from '@/routes/paths'

export type NavId = 'overview' | 'transactions' | 'payments' | 'branches' | 'expenses' | 'invoices' | 'reconciliation' | 'terminals' | 'accounts' | 'payroll' | 'compliance' | 'customers' | 'storefront' | 'bnpl'

export const navItems: { id: NavId; label: string; icon: LucideIcon; to: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, to: paths.overview },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText, to: paths.transactions },
  // Payments is hidden from the sidebar; its route stays because Accounts links to it ("Transfer" on an account).
  // { id: 'payments', label: 'Payments', icon: Send, to: paths.payments },
  { id: 'branches', label: 'Branches', icon: GitBranch, to: paths.branches },
  { id: 'expenses', label: 'Expenses', icon: CreditCard, to: paths.expenses },
  { id: 'invoices', label: 'Invoices', icon: FileText, to: paths.invoices },
  { id: 'customers', label: 'Customers', icon: Contact, to: paths.customers },
  // Reconciliation is switched off for now (route and page are commented out too).
  // { id: 'reconciliation', label: 'Reconciliation', icon: FileCheck2, to: paths.reconciliation },
  { id: 'terminals', label: 'Terminals', icon: MonitorSmartphone, to: paths.terminals },
  { id: 'accounts', label: 'Accounts', icon: Landmark, to: paths.accounts },
  { id: 'storefront', label: 'Storefront', icon: Store, to: paths.storefront },
  // Pay later is switched off for now (route is commented out too); Akawopay stays in Storefront › Checkout options.
  // { id: 'bnpl', label: 'Pay later', icon: HandCoins, to: paths.bnpl },
  { id: 'payroll', label: 'Payroll', icon: UsersRound, to: paths.payroll },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck, to: paths.compliance },
]
