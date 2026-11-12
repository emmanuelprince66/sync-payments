import { Check } from 'lucide-react'
import { useMemo } from 'react'
import type { InvoiceDesign } from '@/api/invoices'
import { cn } from '@/lib/cn'
import { useBusinessDataStore } from '@/stores/business-data-store'
import { INVOICE_TEMPLATES } from '../constants'
import { isoDaysFromNow } from '../dates'
import type { InvoiceDocumentModel } from '../document'
import { InvoicePreview } from './InvoicePreview'

const SAMPLE_LINES = [
  { description: 'Brand identity design', qty: 1, price: 180000, amount: 180000 },
  { description: 'Social media templates', qty: 6, price: 15000, amount: 90000 },
  { description: 'Printing and delivery', qty: 1, price: 25000, amount: 25000 },
]

/**
 * A miniature of the real design, filled with this business's logo, name and
 * address and a few sample lines, so the cards show what customers will get.
 */
export function DesignThumbnail({ name, accent }: { name: InvoiceDesign; accent: string }) {
  const business = useBusinessDataStore(state => state.businessData)
  const doc = useMemo<InvoiceDocumentModel>(() => {
    const subtotal = SAMPLE_LINES.reduce((sum, line) => sum + line.amount, 0)
    const tax = Math.round(subtotal * 0.075)
    return {
      design: name, accent, legalName: business?.name || 'Your business', address: business?.address || '', logoUrl: business?.logo || '',
      party: 'Adaeze Okafor', partyEmail: 'adaeze@example.com', partyPhone: '', number: 'INV-0042', reference: '',
      issueDate: isoDaysFromNow(0), dueDate: isoDaysFromNow(14),
      lines: SAMPLE_LINES, subtotal, tax, total: subtotal + tax, amountPaid: 0, balance: subtotal + tax, status: 'Sent',
    }
  }, [name, accent, business])
  return <div aria-hidden="true" className="pointer-events-none h-full w-full overflow-hidden"><InvoicePreview doc={doc} className=""/></div>
}

/** Choose one of the three invoice designs (a radio group of cards). */
export function InvoiceDesignPicker({ value, onChange, accent, compact = false }: { value: InvoiceDesign; onChange: (design: InvoiceDesign) => void; accent?: string; compact?: boolean }) {
  return <div>
    <p className="text-[11px] font-extrabold" id="invoice-design-label">Invoice design</p>
    {!compact && <p className="mt-1 text-[10px] text-muted-foreground">Used for the preview, the PDF your customer receives and the invoice record.</p>}
    <div role="radiogroup" aria-labelledby="invoice-design-label" className={cn('mt-3 grid gap-3', compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3')}>
      {INVOICE_TEMPLATES.map(template => {
        const selected = value === template.name
        return <button key={template.name} type="button" role="radio" aria-checked={selected} onClick={() => onChange(template.name)}
          className={cn('relative rounded-xl border p-2.5 text-left transition hover:border-secondary', selected ? 'border-secondary bg-accent/40 ring-2 ring-secondary/20' : 'border-border bg-white')}>
          <div className={cn('overflow-hidden bg-[#E9ECE8] p-2', compact ? 'aspect-[1/1.1]' : 'aspect-[1.25/1]')}><DesignThumbnail name={template.name} accent={selected && accent ? accent : template.accent}/></div>
          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="min-w-0"><p className="text-xs font-extrabold">{template.name}</p>{!compact && <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{template.note}</p>}</div>
            {selected && <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-secondary text-white"><Check size={12}/></span>}
          </div>
        </button>
      })}
    </div>
  </div>
}
