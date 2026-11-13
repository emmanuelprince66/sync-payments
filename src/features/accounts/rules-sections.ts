/** Settings home: the transaction PIN, plus (owner and admins) expense rules and approval rights from Expenses. */
export const RULES_SECTIONS = [
  { value: 'pin', label: 'Transaction PIN' },
  { value: 'expense-rules', label: 'Expense rules' },
  { value: 'approval-rights', label: 'Approval rights' },
] as const

export type RulesSection = (typeof RULES_SECTIONS)[number]['value']
