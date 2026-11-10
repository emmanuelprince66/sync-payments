/** The bulk screen's sample batch: the API has no bulk transfer endpoint. Always shown with a SampleDataBadge. */
export type BulkRow = { name: string; account: string; bank: string; amount: number; reference: string }

export const SAMPLE_BULK_ROWS: BulkRow[] = [
  { name: 'Atlas Print Co.', account: '1028834012', bank: 'Zenith Bank', amount: 680000, reference: 'Print production' },
  { name: 'Northern Logistics', account: '2034562281', bank: 'Access Bank', amount: 1240000, reference: 'Haulage' },
  { name: 'Kite Studio', account: '0099887740', bank: 'Guaranty Trust Bank', amount: 920000, reference: 'Design retainer' },
]

export const BULK_CSV_HEADER = ['Name', 'Account number', 'Bank', 'Amount', 'Reference']
export const BULK_FEE_PER_ROW = 50
