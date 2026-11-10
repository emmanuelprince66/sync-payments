import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { INVOICE_TEMPLATES, type InvoiceTemplate } from '../constants'

function TemplateThumbnail({ name }: { name: InvoiceTemplate }) {
  if (name === 'Classic') return <div className="h-full bg-white p-2 shadow-sm"><div className="h-1.5 bg-secondary"/><div className="mt-2 flex justify-between"><div className="h-2 w-10 bg-primary"/><div className="h-3 w-12 bg-primary/15"/></div><div className="mt-3 h-5 bg-secondary/10"/><div className="mt-2 h-px bg-border"/></div>
  if (name === 'Ledger') return <div className="h-full bg-[#FBFBF8] shadow-sm"><div className="flex h-8 items-center justify-between bg-primary px-2"><div className="h-1.5 w-9 bg-white"/><div className="h-2 w-8 border border-white/60"/></div><div className="m-2 grid grid-cols-3 border-y border-primary py-1"><i className="h-1 bg-primary/30"/><i className="h-1 bg-primary/20"/><i className="h-1 bg-primary/10"/></div><div className="mx-2 mt-3 h-px bg-primary"/></div>
  return <div className="relative h-full bg-white pl-6 shadow-sm"><div className="absolute inset-y-0 left-0 w-3 bg-[#B97445]"/><div className="pt-3 text-[14px] font-black tracking-tighter">1049<span className="text-[#B97445]">.</span></div><div className="mt-2 h-1 w-12 bg-[#B97445]/30"/><div className="mt-3 h-px w-3/4 bg-border"/></div>
}

export function InvoiceStudio({ template, onChoose }: { template: InvoiceTemplate; onChoose: (name: InvoiceTemplate) => void }) {
  return <section className="rounded-xl border border-border bg-white p-5">
    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-secondary">Invoice studio</p><h2 className="mt-1 text-sm font-extrabold">Choose a genuinely different document system</h2></div>
      <p className="text-[10px] text-muted-foreground">Logo, address, color, and letterhead are editable</p>
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {INVOICE_TEMPLATES.map(({ name, note }) => <button key={name} type="button" onClick={() => onChoose(name)} className={cn('group rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:border-secondary hover:shadow-md', template === name ? 'border-secondary bg-accent/30' : 'border-border')}>
        <div className="mb-3 aspect-[1.8/1] overflow-hidden bg-[#E9ECE8] p-3"><TemplateThumbnail name={name}/></div>
        <div className="flex items-center justify-between">
          <div><p className="text-xs font-extrabold">{name}</p><p className="mt-0.5 text-[9px] text-muted-foreground">{note}</p></div>
          <ArrowRight size={14} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-secondary"/>
        </div>
      </button>)}
    </div>
  </section>
}
