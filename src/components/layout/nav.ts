import { Contact, CreditCard, FileCheck2, FileText, GitBranch, HandCoins, Landmark, LayoutDashboard, MonitorSmartphone, ReceiptText, Send, ShieldCheck, Store, UsersRound, type LucideIcon } from 'lucide-react'
import { paths } from '@/routes/paths'

export type NavId = 'overview' | 'transactions' | 'payments' | 'branches' | 'expenses' | 'invoices' | 'reconciliation' | 'terminals' | 'accounts' | 'payroll' | 'compliance' | 'customers' | 'storefront' | 'bnpl'

export const navItems: { id: NavId; label: string; icon: LucideIcon; to: string }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, to: paths.overview },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText, to: paths.transactions },
  { id: 'payments', label: 'Payments', icon: Send, to: paths.payments },
  { id: 'branches', label: 'Branches', icon: GitBranch, to: paths.branches },
  { id: 'expenses', label: 'Expenses', icon: CreditCard, to: paths.expenses },
  { id: 'invoices', label: 'Invoices', icon: FileText, to: paths.invoices },
  { id: 'customers', label: 'Customers', icon: Contact, to: paths.customers },
  { id: 'reconciliation', label: 'Reconciliation', icon: FileCheck2, to: paths.reconciliation },
  { id: 'terminals', label: 'Terminals', icon: MonitorSmartphone, to: paths.terminals },
  { id: 'accounts', label: 'Accounts', icon: Landmark, to: paths.accounts },
  { id: 'storefront', label: 'Storefront', icon: Store, to: paths.storefront },
  { id: 'bnpl', label: 'Pay later', icon: HandCoins, to: paths.bnpl },
  { id: 'payroll', label: 'Payroll', icon: UsersRound, to: paths.payroll },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck, to: paths.compliance },
]
