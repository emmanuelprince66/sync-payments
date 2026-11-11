import type { ReactNode, Ref } from 'react'
import { createPortal } from 'react-dom'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { longDate, ledgerDate } from '../dates'
import { A4_HEIGHT_PX, A4_WIDTH_PX, documentNumber, tint, type InvoiceDocumentModel } from '../document'
import { useFitScale } from '../hooks/useFitScale'
import { DocumentFooter, DocumentLines, DocumentLogo, DocumentTotals, INK, MUTED, PaidStamp, RULE } from './InvoicePreviewBody'

type DesignProps = { doc: InvoiceDocumentModel }

function Meta({ label, value, color }: { label: string; value: ReactNode; color?: string }) {
  return <div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[.14em]" style={{ color: MUTED }}>{label}</p><p className="mt-1 break-words text-[13px] font-bold" style={{ color: color ?? INK }}>{value}</p></div>
}

function PartyLines({ doc }: DesignProps) {
  return <>
    {doc.partyEmail && <p className="mt-1 text-[12px]" style={{ color: MUTED }}>{doc.partyEmail}</p>}
    {doc.partyPhone && <p className="text-[12px]" style={{ color: MUTED }}>{doc.partyPhone}</p>}
  </>
}

/** Classic: accent rule, letterhead, tinted bill-to panel. */
function ClassicDesign({ doc }: DesignProps) {
  return <div className="px-14 pb-14">
    <div className="h-2.5" style={{ background: doc.accent }}/>
    <div className="mt-10 flex items-start justify-between gap-8">
      <div className="min-w-0">
        <DocumentLogo doc={doc}/>
        <p className="mt-4 text-[14px] font-extrabold" style={{ color: INK }}>{doc.legalName}</p>
        {doc.address && <p className="mt-1 max-w-[300px] whitespace-pre-line text-[12px] leading-5" style={{ color: MUTED }}>{doc.address}</p>}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[34px] font-black tracking-[.18em]" style={{ color: INK }}>INVOICE</p>
        <p className="mt-1 text-[13px] font-bold" style={{ color: doc.accent }}>{doc.number}</p>
        <div className="mt-3"><PaidStamp doc={doc}/></div>
      </div>
    </div>
    <div className="mt-10 grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-6">
      <div className="rounded-lg p-5" style={{ background: tint(doc.accent, 0.08) }}>
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em]" style={{ color: doc.accent }}>Bill to</p>
        <p className="mt-2 break-words text-[16px] font-extrabold" style={{ color: INK }}>{doc.party}</p>
        <PartyLines doc={doc}/>
      </div>
      <div className="grid grid-cols-2 content-start gap-x-4 gap-y-4 py-2">
        <Meta label="Issue date" value={longDate(doc.issueDate)}/>
        <Meta label="Due date" value={longDate(doc.dueDate)} color={doc.accent}/>
        {doc.reference && <Meta label="Reference" value={doc.reference}/>}
      </div>
    </div>
    <div className="mt-10"><DocumentLines doc={doc} variant="classic"/></div>
    <DocumentTotals doc={doc}/>
    <DocumentFooter doc={doc}/>
  </div>
}

/** Ledger: solid header band, ruled meta strip, numbered rows, boxed totals. */
function LedgerDesign({ doc }: DesignProps) {
  const money = useFormatMoney()
  return <div>
    <div className="flex items-start justify-between gap-8 px-14 py-10" style={{ background: doc.accent, color: '#FFFFFF' }}>
      <div className="min-w-0">
        <DocumentLogo doc={doc} onDark size={40}/>
        <p className="mt-4 text-[14px] font-extrabold">{doc.legalName}</p>
        {doc.address && <p className="mt-1 max-w-[300px] whitespace-pre-line text-[12px] leading-5" style={{ color: 'rgba(255,255,255,.72)' }}>{doc.address}</p>}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] font-bold tracking-[.28em]" style={{ color: 'rgba(255,255,255,.7)' }}>DOCUMENT {documentNumber(doc.number)}</p>
        <p className="mt-2 text-[40px] font-light leading-none">Invoice</p>
      </div>
    </div>
    <div className="px-14 pb-14">
      <div className="mt-10 grid grid-cols-4 gap-4 py-4" style={{ borderTop: `1px solid ${INK}`, borderBottom: `1px solid ${INK}` }}>
        <Meta label="Issued" value={ledgerDate(doc.issueDate)}/>
        <Meta label="Due" value={ledgerDate(doc.dueDate)}/>
        <Meta label="Number" value={doc.number}/>
        <Meta label={doc.amountPaid > 0 ? 'Balance due' : 'Total'} value={money(doc.amountPaid > 0 ? doc.balance : doc.total)}/>
      </div>
      <div className="mt-8 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[.2em]" style={{ color: MUTED }}>Account</p>
          <p className="mt-2 break-words text-[16px] font-extrabold" style={{ color: INK }}>{doc.party}</p>
          <PartyLines doc={doc}/>
          {doc.reference && <p className="mt-2 text-[12px]" style={{ color: MUTED }}>Ref. {doc.reference}</p>}
        </div>
        <PaidStamp doc={doc}/>
      </div>
      <div className="mt-8"><DocumentLines doc={doc} variant="ledger"/></div>
      <DocumentTotals doc={doc} boxed/>
      <DocumentFooter doc={doc}/>
    </div>
  </div>
}

/** Studio: side stripe, oversized number, editorial spacing, tinted thank-you card. */
function StudioDesign({ doc }: DesignProps) {
  const money = useFormatMoney()
  return <div className="relative pb-14 pl-24 pr-14" style={{ minHeight: A4_HEIGHT_PX }}>
    <div className="absolute inset-y-0 left-0 w-8" style={{ background: doc.accent }}/>
    <div className="flex items-start justify-between gap-8 pt-12">
      <DocumentLogo doc={doc} size={52}/>
      <div className="min-w-0 text-right">
        <p className="text-[11px] font-extrabold uppercase tracking-[.22em]" style={{ color: INK }}>{doc.legalName}</p>
        {doc.address && <p className="mt-2 max-w-[300px] whitespace-pre-line text-[12px] leading-5" style={{ color: MUTED }}>{doc.address}</p>}
      </div>
    </div>
    <p className="mt-14 text-[12px] font-extrabold uppercase tracking-[.3em]" style={{ color: doc.accent }}>Invoice</p>
    <div className="flex items-end justify-between gap-6">
      <p className="text-[72px] font-black leading-none tracking-[-.06em]" style={{ color: INK }}>{documentNumber(doc.number)}<span style={{ color: doc.accent }}>.</span></p>
      <PaidStamp doc={doc}/>
    </div>
    <div className="mt-10 grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-6 pb-8" style={{ borderBottom: `1px solid ${RULE}` }}>
      <div className="min-w-0"><p className="text-[10px] uppercase tracking-[.16em]" style={{ color: MUTED }}>Prepared for</p><p className="mt-2 break-words text-[16px] font-extrabold" style={{ color: INK }}>{doc.party}</p><PartyLines doc={doc}/></div>
      <Meta label="Issued" value={longDate(doc.issueDate)}/>
      <Meta label="Due" value={longDate(doc.dueDate)} color={doc.accent}/>
    </div>
    <div className="mt-8"><DocumentLines doc={doc} variant="studio"/></div>
    <DocumentTotals doc={doc}/>
    <div data-pdf-block className="mt-8 flex items-center justify-between gap-6 rounded-xl p-6" style={{ background: tint(doc.accent, 0.1) }}>
      <p className="max-w-[340px] text-[12px] leading-5" style={{ color: INK }}>Thank you for your business. Please use <b>{doc.number}</b> as your payment reference{doc.reference ? ` (${doc.reference})` : ''}.</p>
      <div className="shrink-0 text-right"><p className="text-[10px] uppercase tracking-[.16em]" style={{ color: MUTED }}>{doc.amountPaid > 0 ? 'Balance due' : 'Amount due'}</p><p className="text-[22px] font-black" style={{ color: doc.accent }}>{money(doc.amountPaid > 0 ? doc.balance : doc.total)}</p></div>
    </div>
  </div>
}

const designs = { Classic: ClassicDesign, Ledger: LedgerDesign, Studio: StudioDesign }

/** The invoice at true A4 width (794 px): what the PDF is made from. */
export function InvoiceDocument({ doc, ref }: { doc: InvoiceDocumentModel; ref?: Ref<HTMLDivElement> }) {
  const Design = designs[doc.design] ?? ClassicDesign
  return <div ref={ref} data-invoice-document className="bg-white font-sans antialiased" style={{ width: A4_WIDTH_PX, minHeight: A4_HEIGHT_PX, color: INK }}>
    <Design doc={doc}/>
  </div>
}

/** The A4 document shrunk to fit its container, for screens. */
export function InvoicePreview({ doc, className }: { doc: InvoiceDocumentModel; className?: string }) {
  const { boxRef, contentRef, scale, height } = useFitScale(A4_WIDTH_PX)
  return <div className={className ?? 'bg-[#EEF1ED] p-3 sm:p-6'}>
    <div ref={boxRef} className="w-full">
      <div className="relative mx-auto overflow-hidden shadow-[0_12px_30px_rgba(29,38,28,.14)]" style={{ width: A4_WIDTH_PX * scale, height: height * scale }}>
        <div ref={contentRef} className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})` }}><InvoiceDocument doc={doc}/></div>
      </div>
    </div>
  </div>
}

/** An unscaled copy kept off screen (in <body>, clear of any dialog), so the PDF is captured at full size whatever the screen. */
export function InvoicePdfSource({ doc, sourceRef }: { doc: InvoiceDocumentModel; sourceRef: (node: HTMLDivElement | null) => void }) {
  return createPortal(<div aria-hidden="true" inert className="pointer-events-none fixed top-0" style={{ left: -(A4_WIDTH_PX + 200) }}>
    <InvoiceDocument ref={sourceRef} doc={doc}/>
  </div>, document.body)
}
