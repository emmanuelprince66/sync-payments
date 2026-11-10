import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PAYROLL_RATES, usePayroll } from '@/api/payroll'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useSampleApprovalsStore } from '@/stores/sample-approvals-store'

export const PAYROLL_TABS = ['Overview', 'Employees', 'Pay runs', 'Taxes & filings'] as const
export type PayrollTab = (typeof PAYROLL_TABS)[number]

export type PayrollTotals = { gross: number; employeeTaxes: number; employerTaxes: number; deductions: number; net: number; headcount: number }

export function usePayrollPage() {
  const payroll = usePayroll()
  const approvals = useSampleApprovalsStore(state => state.items)
  const addApproval = useSampleApprovalsStore(state => state.add)
  const addEmployee = useDisclosure()
  const [tab, setTab] = useState<PayrollTab>('Overview')

  const data = payroll.data
  const totals = useMemo<PayrollTotals>(() => {
    const employees = data?.employees ?? []
    const gross = employees.reduce((sum, person) => sum + person.amount, 0)
    const employeeTaxes = gross * PAYROLL_RATES.employeeTax
    const benefits = gross * PAYROLL_RATES.benefits
    return { gross, employeeTaxes, employerTaxes: gross * PAYROLL_RATES.employerTax, deductions: employeeTaxes + benefits, net: gross - employeeTaxes - benefits, headcount: employees.length }
  }, [data])

  const submitted = Boolean(data && approvals.some(item => item.id === data.run.id))

  const submitRun = () => {
    if (!data || submitted) return
    addApproval({ id: data.run.id, title: `June payroll — ${totals.headcount} employees`, requester: data.run.requester, amount: totals.gross, category: 'Payroll', submitted: 'Just now', approver: data.run.approver, status: 'Pending', source: 'Expense' })
    toast.success('Payroll submitted for approval.')
  }

  return { data, totals, tab, setTab, submitted, submitRun, addEmployee, openPayRun: () => setTab('Pay runs') }
}
