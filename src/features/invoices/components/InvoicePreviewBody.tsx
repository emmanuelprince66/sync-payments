import { useFormatMoney } from '@/hooks/useFormatMoney'
import type { InvoicePreviewModel } from '../hooks/useInvoiceForm'

export function InvoicePreviewBody({ preview, compact = false }: { preview: InvoicePreviewModel; compact?: boolean }) {
  const money = useFormatMoney()
  return <div className={compact ? 'mt-6' : 'mt-8'}>
    <div className="grid grid-cols-[minmax(0,1fr)_76px] border-b pb-2 text-[7px] font-extrabold uppercase tracking-wider text-muted-foreground"><span>Description</span><span className="text-right">Amount</span></div>
    {preview.lines.length === 0 && <p className="py-4 text-[9px] text-muted-foreground">Line items you add show here.</p>}
    {preview.lines.map((line, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_76px] py-4 text-[9px]"><span className="break-words">{line.description}</span><span className="text-right font-extrabold">{money(line.amount)}</span></div>)}
    <div className="ml-auto mt-3 flex w-40 flex-col gap-2 border-t pt-3 text-[8px]">
      <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{money(preview.subtotal)}</span></div>
      <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{money(preview.tax)}</span></div>
      <div className="flex justify-between border-t pt-2 text-xs font-extrabold"><span>Total</span><span style={{ color: preview.accent }}>{money(preview.total)}</span></div>
    </div>
  </div>
}
