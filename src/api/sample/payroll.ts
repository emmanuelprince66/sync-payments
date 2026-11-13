import { mockDelay } from '@/lib/api-client'

/** Sample data: the backend has no payroll endpoints yet. */

export type EmployeeStatus = 'Ready' | 'Review'

export type Employee = {
  name: string
  role: string
  account: string
  amount: number
  type: string
  status: EmployeeStatus
}

export type PayrollCalendarItem = { date: string; title: string; done: boolean }
export type PayrollTask = { task: string; due: string; tab: 'Employees' | 'Pay runs' }
export type TaxLiability = { name: string; amount: number; due: string }
export type TaxFiling = { form: string; status: string; due: string }

export type PayrollData = {
  employees: Employee[]
  calendar: PayrollCalendarItem[]
  tasks: PayrollTask[]
  liabilities: TaxLiability[]
  filings: TaxFiling[]
  run: { id: string; title: string; period: string; payDate: string; approver: string; requester: string }
}

/** Share of gross pay, from the design's pay-run lines. */
export const PAYROLL_RATES = { employeeTax: 0.21, benefits: 0.05, employerTax: 0.0912 }

const data: PayrollData = {
  employees: [
    { name: 'Maya Chen', role: 'Operations Lead', account: 'Chase •• 4410', amount: 6800, type: 'Salary', status: 'Ready' },
    { name: 'David Cole', role: 'Product Designer', account: 'Zenith •• 0281', amount: 5400, type: 'Salary', status: 'Ready' },
    { name: 'Sarah Adeyemi', role: 'Finance Admin', account: 'Thread •• 8842', amount: 6200, type: 'Salary', status: 'Ready' },
    { name: 'Avery Stone', role: 'Branch Manager', account: 'Chase •• 1044', amount: 4800, type: 'Salary', status: 'Review' },
  ],
  calendar: [
    { date: 'Jun 16', title: 'Period opened', done: true },
    { date: 'Jun 24', title: 'Changes due', done: true },
    { date: 'Jun 26', title: 'Final review', done: false },
    { date: 'Jun 28', title: 'Payday', done: false },
  ],
  tasks: [
    { task: 'Review Avery’s overtime', due: 'Needs attention', tab: 'Employees' },
    { task: 'Confirm tax liability', due: 'Due Jun 26', tab: 'Pay runs' },
    { task: 'Review direct deposits', due: 'Due Jun 26', tab: 'Pay runs' },
  ],
  liabilities: [
    { name: 'Federal withholding', amount: 8240, due: 'Jul 15' },
    { name: 'Social Security & Medicare', amount: 6880, due: 'Jul 15' },
    { name: 'New York State', amount: 2140, due: 'Jul 31' },
    { name: 'Local withholding', amount: 1160, due: 'Jul 31' },
  ],
  filings: [
    { form: 'Form 941 · Q2 2026', status: 'Ready to file', due: 'Jul 31' },
    { form: 'NY quarterly return', status: 'In preparation', due: 'Jul 31' },
    { form: 'Employee W-2 data', status: 'Up to date', due: 'Jan 31, 2027' },
  ],
  run: { id: 'PAY-0626', title: 'June 16–30 pay run', period: 'Pay date Jun 28 · Semi-monthly', payDate: 'Jun 28', approver: 'Sarah Adeyemi', requester: 'Tobi Olosunde' },
}

export const getPayroll = () => mockDelay({ ...data, employees: [...data.employees] })

export const addEmployee = (employee: Employee) => {
  data.employees = [...data.employees, employee]
  return mockDelay(employee)
}
