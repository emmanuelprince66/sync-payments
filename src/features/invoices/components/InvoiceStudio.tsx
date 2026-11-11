import { ArrowRight } from 'lucide-react'
import type { InvoiceDesign } from '@/api/invoices'
import { cn } from '@/lib/cn'
import { INVOICE_TEMPLATES } from '../constants'
import { DesignThumbnail } from './InvoiceDesignPicker'

export function InvoiceStudio({ template, onChoose }: { template: InvoiceDesign; onChoose: (name: InvoiceDesign) => void }) {
  return <section className="rounded-xl border border-border bg-white p-5">
    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-secondary">Invoice designs</p><h2 className="mt-1 text-sm font-extrabold">Start an invoice in one of three designs</h2></div>
      <p className="text-[10px] text-muted-foreground">Logo, address and brand colour are editable</p>
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {INVOICE_TEMPLATES.map(({ name, note, accent }) => <button key={name} type="button" onClick={() => onChoose(name)} className={cn('group rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:border-secondary hover:shadow-md', template === name ? 'border-secondary bg-accent/30' : 'border-border')}>
        <div className="mb-3 aspect-[1.8/1] overflow-hidden bg-[#E9ECE8] p-3"><DesignThumbnail name={name} accent={accent}/></div>
        <div className="flex items-center justify-between">
          <div><p className="text-xs font-extrabold">{name}</p><p className="mt-0.5 text-[9px] text-muted-foreground">{note}</p></div>
          <ArrowRight size={14} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-secondary"/>
        </div>
      </button>)}
    </div>
  </section>
}
