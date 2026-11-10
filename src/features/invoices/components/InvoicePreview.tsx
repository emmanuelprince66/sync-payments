import type { Ref } from 'react'
import { Logo } from '@/components/ui/Logo'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import type { InvoiceTemplate } from '../constants'
import { ledgerDate, shortDate } from '../dates'
import type { InvoicePreviewModel } from '../hooks/useInvoiceForm'
import { InvoicePreviewBody } from './InvoicePreviewBody'

type TemplateProps = { preview: InvoicePreviewModel }

function ClassicTemplate({ preview }: TemplateProps) {
  const { accent } = preview
  return <div className="mx-auto min-h-[500px] max-w-sm bg-white p-7 shadow-[0_12px_30px_rgba(29,38,28,.12)]">
    <div className={`${preview.letterhead === 'Minimal' ? 'h-px' : 'h-2'} w-full`} style={{ background: accent }}/>
    <div className="mt-6 flex justify-between gap-3">
      <div className="min-w-0">
        {preview.logoUrl ? <img src={preview.logoUrl} alt="Business logo" className="h-10 max-w-32 object-contain object-left"/> : <Logo/>}
        <p className="mt-3 max-w-[150px] text-[8px] leading-4 text-muted-foreground">{preview.legalName}<br/>{preview.address}</p>
      </div>
      <div className="text-right"><p className="text-2xl font-black tracking-[.14em]">INVOICE</p><p className="mt-2 text-[9px] text-muted-foreground">#{preview.number} · Due {shortDate(preview.dueDate)}</p></div>
    </div>
    <div className="mt-8 rounded-sm p-4" style={{ background: `${accent}14` }}>
      <p className="text-[8px] font-extrabold uppercase tracking-wider" style={{ color: accent }}>Bill to</p>
      <p className="mt-1 break-words text-xs font-extrabold">{preview.party}</p>
      {preview.partyEmail && <p className="mt-1 text-[8px] text-muted-foreground">{preview.partyEmail}</p>}
    </div>
    <InvoicePreviewBody preview={preview}/>
    <p className="mt-8 border-t pt-4 text-[8px] leading-4 text-muted-foreground">ACH: Thread Bank · Routing 064009445 · Account •• 6735<br/>Use {preview.number} as payment reference.</p>
  </div>
}

function LedgerTemplate({ preview }: TemplateProps) {
  const money = useFormatMoney()
  const { accent } = preview
  return <div className="mx-auto min-h-[500px] max-w-sm bg-[#FBFBF8] shadow-[0_12px_30px_rgba(29,38,28,.12)]">
    <div className="p-7 text-white" style={{ background: accent }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {preview.logoUrl ? <img src={preview.logoUrl} alt="Business logo" className="h-8 max-w-28 object-contain object-left brightness-0 invert"/> : <div className="truncate text-sm font-black tracking-tight">{preview.legalName.split(' ')[0].toUpperCase()} /</div>}
          <p className="mt-2 text-[8px] leading-4 text-white/65">{preview.legalName}<br/>{preview.address}</p>
        </div>
        <div className="shrink-0 text-right"><p className="text-[8px] font-bold tracking-[.22em] text-white/60">DOCUMENT {preview.documentNumber}</p><p className="mt-2 text-2xl font-light">Invoice</p></div>
      </div>
    </div>
    <div className="p-7">
      <div className="grid grid-cols-3 gap-1 border-y border-foreground py-3 text-[8px]">
        <div><p className="text-muted-foreground">ISSUED</p><p className="mt-1 font-extrabold">{ledgerDate(preview.issueDate)}</p></div>
        <div><p className="text-muted-foreground">DUE</p><p className="mt-1 font-extrabold">{ledgerDate(preview.dueDate)}</p></div>
        <div><p className="text-muted-foreground">TOTAL</p><p className="mt-1 font-extrabold">{money(preview.total)}</p></div>
      </div>
      <div className="mt-7"><p className="break-words text-[8px] font-extrabold uppercase tracking-[.2em] text-muted-foreground">Account / {preview.party}</p></div>
      <InvoicePreviewBody preview={preview} compact/>
      <div className="mt-12 grid grid-cols-2 gap-5 border-t border-foreground pt-4 text-[8px] leading-4">
        <p>PAYMENT<br/>Thread Bank •• 6735<br/>Reference {preview.number}</p>
        <p className="text-right">QUESTIONS<br/>billing@northstar.co<br/>+1 212 555 0148</p>
      </div>
    </div>
  </div>
}

function StudioTemplate({ preview }: TemplateProps) {
  const { accent } = preview
  return <div className="relative mx-auto min-h-[500px] max-w-sm overflow-hidden bg-white shadow-[0_12px_30px_rgba(29,38,28,.12)]">
    <div className="absolute inset-y-0 left-0 w-5" style={{ background: accent }}/>
    <div className="p-8 pl-12">
      <div className="flex items-start justify-between gap-3">
        {preview.logoUrl ? <img src={preview.logoUrl} alt="Business logo" className="h-12 max-w-28 object-contain object-left"/> : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-black text-white" style={{ background: accent }}>{preview.legalName.charAt(0).toUpperCase()}</div>}
        <div className="min-w-0 text-right"><p className="text-[8px] font-extrabold uppercase tracking-[.2em] text-muted-foreground">{preview.legalName}</p><p className="mt-2 text-[8px] leading-4 text-muted-foreground">{preview.address}</p></div>
      </div>
      <p className="mt-10 text-[9px] font-extrabold uppercase tracking-[.24em]" style={{ color: accent }}>Invoice</p>
      <p className="mt-1 text-4xl font-black tracking-[-.06em]">{preview.documentNumber}<span style={{ color: accent }}>.</span></p>
      <div className="mt-8 flex justify-between gap-3">
        <div className="min-w-0"><p className="text-[8px] uppercase text-muted-foreground">Prepared for</p><p className="mt-1 break-words text-xs font-extrabold">{preview.party}</p></div>
        <div className="shrink-0 text-right text-[8px] leading-4"><p>Issued {shortDate(preview.issueDate)}</p><p className="font-extrabold" style={{ color: accent }}>Due {shortDate(preview.dueDate)}</p></div>
      </div>
      <InvoicePreviewBody preview={preview}/>
      <div className="mt-8 rounded-lg p-4 text-[8px] leading-4" style={{ background: `${accent}12` }}>Thank you for your business. Pay securely by ACH to account •• 6735 using reference {preview.number}.</div>
    </div>
  </div>
}

const templates: Record<InvoiceTemplate, (props: TemplateProps) => React.ReactNode> = { Classic: ClassicTemplate, Ledger: LedgerTemplate, Studio: StudioTemplate }

export function InvoicePreview({ template, preview, ref }: { template: InvoiceTemplate; preview: InvoicePreviewModel; ref?: Ref<HTMLDivElement> }) {
  const Template = templates[template]
  return <div ref={ref} className="bg-[#EEF1ED] p-4 sm:p-6"><Template preview={preview}/></div>
}
