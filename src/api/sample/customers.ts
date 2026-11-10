import type { UnknownRecord } from '../http'

/** Customer records in the shape sink-inventory's endpoints answer, for VITE_AUTH_MODE=mock only. */

const daysAgo = (days: number) => new Date(Date.now() - days * 86400 * 1000).toISOString()

const address = (street: string, city: string, state: string) => ({ id: `addr-${street.length}`, address: street, city, state, country: 'Nigeria', phone: null, latitude: null, longitude: null, is_default: true, created_at: daysAgo(120) })

const row = (id: string, name: string, phone: string, email: string, totalSales: number, salesCount: number, wallet: number, debt: number, status: string, extra: UnknownRecord = {}): UnknownRecord => ({
  id, name, phone, email, total_sales: totalSales, sales_count: salesCount, wallet_balance: wallet, credit_balance: debt, status,
  customer_code: `CUS-${id.slice(-6).toUpperCase()}`, gender: null, date_of_birth: null, addresses: [], last_visit: daysAgo(salesCount ? 3 : 60), created_at: daysAgo(200), ...extra,
})

export const sampleCustomers: UnknownRecord[] = [
  row('mock-cus-a1b2c3', 'Chidinma Okeke', '08032457791', 'chidinma@example.com', 284500, 14, 12000, 0, 'Active', { gender: 'FEMALE', date_of_birth: '1992-04-18', tier_name: 'Gold', addresses: [address('14 Admiralty Way', 'Lekki', 'Lagos')] }),
  row('mock-cus-d4e5f6', 'Tobi Adeyemi', '08124401290', 'tobi@example.com', 96500, 6, 0, 18500, 'Active', { gender: 'MALE', addresses: [address('3 Allen Avenue', 'Ikeja', 'Lagos')] }),
  row('mock-cus-g7h8i9', 'Amaka Nwosu', '07065512340', '', 41200, 3, 2500, 0, 'New', { gender: 'FEMALE' }),
  row('mock-cus-j1k2l3', 'Ibrahim Musa', '09033218877', 'ibrahim.musa@example.com', 187000, 11, 0, 0, 'At Risk', { gender: 'MALE', addresses: [address('22 Ahmadu Bello Way', 'Garki', 'FCT - Abuja')] }),
  row('mock-cus-m4n5o6', 'Funke Balogun', '08055230012', 'funke@example.com', 12500, 1, 0, 0, 'Inactive'),
  row('mock-cus-p7q8r9', 'Emeka Obi', '08188776655', '', 63800, 5, 7000, 4500, 'Active', { gender: 'MALE' }),
  row('mock-cus-s1t2u3', 'Halima Bello', '07031124567', 'halima@example.com', 22000, 2, 0, 0, 'New'),
  row('mock-cus-v4w5x6', 'Segun Oladipo', '08099001122', 'segun@example.com', 315000, 19, 30000, 0, 'Active', { tier_name: 'Platinum', addresses: [address('8 Ring Road', 'Ibadan', 'Oyo')] }),
]

/** One ledger per customer, as GET customer/transactions/{id}/ answers. */
export const sampleTransactions = (customerId: string): UnknownRecord[] => {
  const seed = customerId.length
  return [
    { id: `${customerId}-t1`, type: 'PURCHASE', title: 'In-store purchase', reference: `KS-84${seed}19`, amount: 48000, flow: 'OUTFLOW', payment_method: 'TRANSFER', status: 'PAID', attendant: 'Kemi Adeyemi', created_at: daysAgo(2), details: { items_count: 3 } },
    { id: `${customerId}-t2`, type: 'WALLET', title: 'Wallet top-up', reference: null, amount: 10000, flow: 'INFLOW', payment_method: 'CASH', status: 'SUCCESSFUL', attendant: 'Kemi Adeyemi', created_at: daysAgo(6), details: { new_balance: 12000 } },
    { id: `${customerId}-t3`, type: 'PURCHASE', title: 'Online order', reference: `KS-84${seed}07`, amount: 32500, flow: 'OUTFLOW', payment_method: 'CARD', status: 'PAID', attendant: null, created_at: daysAgo(14), details: { items_count: 2 } },
    { id: `${customerId}-t4`, type: 'DEBT', title: 'Debt settlement', reference: `KS-84${seed}01`, amount: 5000, flow: 'INFLOW', payment_method: 'TRANSFER', status: 'SUCCESSFUL', attendant: 'Kemi Adeyemi', created_at: daysAgo(21), details: {} },
    { id: `${customerId}-t5`, type: 'LOYALTY', title: 'Loyalty reward', reference: null, amount: 1500, flow: 'INFLOW', payment_method: null, status: 'SUCCESSFUL', attendant: null, created_at: daysAgo(30), details: { program_name: 'Loyal regulars' } },
  ]
}
