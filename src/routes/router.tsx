import { Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/components/layout/AppLayout'
import { AppLoader } from '@/components/ui/AppLoader'
import { GuestOnly, RequireAuth, RequireBusiness } from './guards'
import { pages } from './pages'
import { paths } from './paths'

const { AuthPage, SelectBusinessPage, OverviewPage, TransactionsPage, BranchesPage, PaymentsPage, ExpensesPage, InvoicesPage, CreateInvoicePage, /* ReconciliationPage, (switched off for now) */ PayoutsPage, TerminalsPage, AccountsPage, PayrollPage, CompliancePage, KycPage } = pages
const { CustomersPage, CustomerDetailPage, StorefrontPage, BnplPage } = pages
const { InvoiceDetailPage } = pages

export const router = createBrowserRouter([
  {
    element: <GuestOnly/>,
    children: [
      { path: paths.login, element: <AuthPage/> },
      { path: paths.signup, element: <AuthPage/> },
    ],
  },
  // Onboarding steps after signup: the user is already signed in by then.
  { path: `${paths.signup}/:step`, element: <Suspense fallback={<AppLoader/>}><AuthPage/></Suspense> },
  {
    element: <RequireAuth/>,
    children: [
      { path: paths.selectBusiness, element: <SelectBusinessPage/> },
      {
        element: <RequireBusiness/>,
        children: [
      {
        element: <AppLayout/>,
        children: [
          { index: true, element: <OverviewPage/> },
          { path: paths.transactions, element: <TransactionsPage/> },
          { path: paths.branches, element: <BranchesPage/> },
          { path: paths.payments, element: <PaymentsPage/> },
          { path: paths.expenses, element: <ExpensesPage/> },
          { path: paths.invoices, element: <InvoicesPage/> },
          { path: paths.invoiceNew, element: <CreateInvoicePage/> },
          { path: paths.invoiceDetail, element: <InvoiceDetailPage/> },
          { path: paths.approvals, element: <Navigate to={paths.expenseApprovals} replace/> },
          // Reconciliation is switched off for now; restore with its nav item and page loader.
          // { path: paths.reconciliation, element: <ReconciliationPage/> },
          { path: paths.payouts, element: <PayoutsPage/> },
          { path: paths.terminals, element: <TerminalsPage/> },
          { path: paths.accounts, element: <AccountsPage/> },
          { path: paths.payroll, element: <PayrollPage/> },
          { path: paths.compliance, element: <CompliancePage/> },
          { path: paths.kyc, element: <KycPage/> },
          { path: paths.customers, element: <CustomersPage/> },
          { path: paths.customerDetail, element: <CustomerDetailPage/> },
          { path: paths.storefront, element: <StorefrontPage/> },
          { path: paths.bnpl, element: <BnplPage/> },
        ],
      },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={paths.dashboard} replace/> },
])
