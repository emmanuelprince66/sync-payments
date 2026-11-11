import { Check } from 'lucide-react'
import type { InvoiceDesign } from '@/api/invoices'
import { cn } from '@/lib/cn'
import { INVOICE_TEMPLATES } from '../constants'

/** A miniature of each design, drawn in its own colour. */
export function DesignThumbnail({ name, accent }: { name: InvoiceDesign; accent: string }) {
  if (name === 'Classic') return <div className="h-full bg-white p-2 shadow-sm">
    <div className="h-1.5" style={{ background: accent }}/>
    <div className="mt-2 flex justify-between"><div className="h-3 w-3 rounded-sm" style={{ background: accent }}/><div className="h-2 w-10 bg-primary"/></div>
    <div className="mt-2 h-4 rounded-sm" style={{ background: `${accent}22` }}/>
    <div className="mt-2 h-1.5" style={{ background: `${accent}22` }}/><div className="mt-1 h-px bg-border"/><div className="mt-1 h-px bg-border"/>
  </div>
  if (name === 'Ledger') return <div className="h-full bg-white shadow-sm">
    <div className="flex h-7 items-center justify-between px-2" style={{ background: accent }}><div className="h-3 w-3 rounded-sm bg-white"/><div className="h-2 w-8 border border-white/70"/></div>
    <div className="m-2 grid grid-cols-4 gap-1 border-y border-primary py-1"><i className="h-1 bg-primary/40"/><i className="h-1 bg-primary/30"/><i className="h-1 bg-primary/20"/><i className="h-1 bg-primary/40"/></div>
    <div className="mx-2 h-px bg-primary"/><div className="mx-2 mt-1 h-px bg-border"/><div className="mx-2 mt-1 h-px bg-border"/>
    <div className="ml-auto mr-2 mt-1.5 h-2.5 w-8 border border-primary"/>
  </div>
  return <div className="relative h-full bg-white pl-5 pr-2 shadow-sm">
    <div className="absolute inset-y-0 left-0 w-2.5" style={{ background: accent }}/>
    <div className="pt-2 text-[15px] font-black leading-none tracking-tighter">0042<span style={{ color: accent }}>.</span></div>
    <div className="mt-2 h-1 w-12" style={{ background: `${accent}55` }}/>
    <div className="mt-2 h-px w-full bg-border"/><div className="mt-1 h-1.5" style={{ background: `${accent}18` }}/>
    <div className="mt-1.5 h-3 rounded-sm" style={{ background: `${accent}22` }}/>
  </div>
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
          <div className={cn('overflow-hidden bg-[#E9ECE8] p-2', compact ? 'aspect-[1/1.1]' : 'aspect-[1.6/1]')}><DesignThumbnail name={template.name} accent={selected && accent ? accent : template.accent}/></div>
          <div className="mt-2 flex items-start justify-between gap-2">
            <div className="min-w-0"><p className="text-xs font-extrabold">{template.name}</p>{!compact && <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{template.note}</p>}</div>
            {selected && <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-secondary text-white"><Check size={12}/></span>}
          </div>
        </button>
      })}
    </div>
  </div>
}
