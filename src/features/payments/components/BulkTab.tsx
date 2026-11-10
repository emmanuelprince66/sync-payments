import { CheckCircle2, Download } from 'lucide-react'
import { FilePicker } from '@/components/ui/common'
import { SampleDataBadge } from '@/components/ui/misc'
import { KitButton } from '@/components/ui/PaymentKit'
import { useBulkPayments } from '../hooks/useBulkPayments'

/** The design's bulk screen. There is no bulk endpoint, so it runs on sample data. */
export function BulkTab() {
  const bulk = useBulkPayments()
  return <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,.75fr)]">
    <section className="min-w-0 rounded-xl border border-border bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-extrabold">Bulk payment batch</h2><SampleDataBadge/></div><p className="mt-1 text-[9px] text-muted-foreground">Upload a CSV or add recipients manually</p></div>
        <KitButton variant="secondary" onClick={bulk.downloadTemplate}><Download size={13}/> CSV template</KitButton>
      </div>
      <FilePicker accept=".csv" onFile={file => void bulk.loadCsv(file)} className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-secondary/40 bg-accent/35 p-8 text-center">
        <Download size={21} className="rotate-180 text-secondary"/>
        <p className="mt-3 text-xs font-extrabold">Drop your payment CSV here</p>
        <p className="mt-1 text-[9px] text-muted-foreground">Name, account number, bank, amount, reference</p>
      </FilePicker>
      <div className="mt-5 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[420px] text-[10px]">
          <thead><tr className="bg-muted text-left text-[8px] uppercase tracking-wider text-muted-foreground"><th className="px-4 py-3">Recipient</th><th className="px-4 py-3">Bank</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Check</th></tr></thead>
          <tbody>{bulk.rows.map(row => <tr key={`${row.name}-${row.account}`} className="border-t border-border"><td className="px-4 py-3 font-extrabold">{row.name}</td><td className="px-4 py-3 text-muted-foreground">{row.bank} •• {row.account.slice(-4)}</td><td className="px-4 py-3 text-right font-extrabold">{bulk.money(row.amount)}</td><td className="px-4 py-3 text-secondary">Validated</td></tr>)}</tbody>
        </table>
      </div>
    </section>
    <aside className="min-w-0 self-start rounded-xl border border-border bg-white p-5">
      <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Batch total</p>
      <p className="mt-2 text-3xl font-extrabold [overflow-wrap:anywhere]">{bulk.total}</p>
      <p className="mt-1 text-[9px] text-muted-foreground">{bulk.rows.length} validated recipients</p>
      <div className="my-5 flex flex-col gap-3 border-y border-border py-4 text-[10px]">
        <div className="flex justify-between"><span className="text-muted-foreground">Fees</span><span className="font-extrabold">{bulk.fees}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Approval</span><span className="font-extrabold">1 required</span></div>
      </div>
      {bulk.submitted
        ? <div className="flex items-center gap-2 rounded-lg bg-accent p-3 text-[10px] font-extrabold text-secondary"><CheckCircle2 size={15}/>Sent to Approvals as sample data. No money moves.</div>
        : <KitButton onClick={bulk.submit} className="w-full">Submit batch for approval</KitButton>}
    </aside>
  </div>
}
