import { useMemo, useState } from 'react'
import { PAYROLL_RATES, usePayroll } from '@/api/payroll'
import { useDisclosure } from '@/hooks/useDisclosure'

export const PAYROLL_TABS = ['Overview', 'Employees', 'Pay runs', 'Taxes & filings'] as const
export type PayrollTab = (typeof PAYROLL_TABS)[number]

export type PayrollTotals = { gross: number; employeeTaxes: number; employerTaxes: number; deductions: number; net: number; headcount: number }

export function usePayrollPage() {
  const payroll = usePayroll()
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

  // Payroll is sample data: there is no pay-run or payroll-approval endpoint, so a run can't be submitted anywhere.
  return { data, totals, tab, setTab, addEmployee, openPayRun: () => setTab('Pay runs') }
}
