import type { CSSProperties } from 'react'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { tint, type InvoiceDocumentModel } from '../document'

/**
 * Pieces every invoice design shares. Colours are plain hex/rgba (no Tailwind opacity
 * modifiers) so the PDF renderer draws them exactly. Rows carry `data-pdf-block`, the
 * places a long invoice may break onto a new page.
 */

export const INK = '#1D261C'
export const MUTED = '#6B7A71'
export const RULE = '#E3E8E4'

type Variant = 'classic' | 'ledger' | 'studio'

const qtyText = (qty: number) => (Number.isInteger(qty) ? String(qty) : qty.toFixed(2))
const columns = 'grid grid-cols-[minmax(0,1fr)_56px_120px_130px] gap-3 px-4'

export function DocumentLines({ doc, variant }: { doc: InvoiceDocumentModel; variant: Variant }) {
  const money = useFormatMoney()
  const head: CSSProperties = variant === 'classic'
    ? { background: tint(doc.accent, 0.1), color: doc.accent }
    : variant === 'ledger' ? { borderTop: `2px solid ${INK}`, borderBottom: `1px solid ${INK}`, color: INK } : { borderBottom: `2px solid ${doc.accent}`, color: MUTED }
  return <div>
    <div className={`${columns} py-2.5 text-[10px] font-extrabold uppercase tracking-[.14em]`} style={head}>
      <span>Description</span><span className="text-right">Qty</span><span className="text-right">Price</span><span className="text-right">Amount</span>
    </div>
    {doc.lines.length === 0 && <p className="px-4 py-6 text-[12px]" style={{ color: MUTED }}>Line items you add show here.</p>}
    {doc.lines.map((line, index) => <div key={index} data-pdf-block className={`${columns} py-3.5 text-[12px] leading-5`}
      style={{ borderBottom: `1px solid ${RULE}`, background: variant === 'studio' && index % 2 ? tint(doc.accent, 0.05) : undefined }}>
      <span className="break-words" style={{ color: INK }}>{variant === 'ledger' && <span className="mr-3 tabular-nums" style={{ color: MUTED }}>{String(index + 1).padStart(2, '0')}</span>}{line.description}</span>
      <span className="text-right tabular-nums" style={{ color: MUTED }}>{qtyText(line.qty)}</span>
      <span className="text-right tabular-nums" style={{ color: MUTED }}>{money(line.price)}</span>
      <span className="text-right font-bold tabular-nums" style={{ color: INK }}>{money(line.amount)}</span>
    </div>)}
  </div>
}

function TotalRow({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) {
  return <div className={strong ? 'flex justify-between gap-4 pt-3 text-[15px] font-extrabold' : 'flex justify-between gap-4 text-[12px]'} style={{ color: color ?? (strong ? INK : MUTED), borderTop: strong ? `1px solid ${RULE}` : undefined }}>
    <span>{label}</span><span className="tabular-nums">{value}</span>
  </div>
}

/** Subtotal, tax and total; paid and balance join in once money has come in. */
export function DocumentTotals({ doc, boxed = false }: { doc: InvoiceDocumentModel; boxed?: boolean }) {
  const money = useFormatMoney()
  return <div data-pdf-block className="mt-6 flex justify-end">
    <div className="flex w-[300px] flex-col gap-2.5 p-4" style={boxed ? { border: `1px solid ${INK}` } : undefined}>
      <TotalRow label="Subtotal" value={money(doc.subtotal)}/>
      <TotalRow label="Tax" value={money(doc.tax)}/>
      <TotalRow label="Total" value={money(doc.total)} strong color={doc.accent}/>
      {doc.amountPaid > 0 && <>
        <TotalRow label="Amount paid" value={`- ${money(doc.amountPaid)}`}/>
        <TotalRow label="Balance due" value={money(doc.balance)} strong/>
      </>}
    </div>
  </div>
}

/** A "PAID" stamp once nothing is owed, "VOID" on a voided invoice, "DRAFT" before it is approved. */
export function PaidStamp({ doc }: { doc: InvoiceDocumentModel }) {
  const stamp = doc.status === 'Void' ? { text: 'VOID', color: '#C72D34' }
    : doc.status === 'Paid' || (doc.amountPaid > 0 && doc.balance <= 0) ? { text: 'PAID', color: '#337D44' }
      : doc.status === 'Draft' ? { text: 'DRAFT', color: '#8A9A92' } : null
  if (!stamp) return null
  return <span className="inline-block rotate-[-8deg] rounded-md px-3 py-1 text-[13px] font-black tracking-[.3em]" style={{ border: `2px solid ${stamp.color}`, color: stamp.color }}>{stamp.text}</span>
}

export function DocumentLogo({ doc, size = 44, onDark = false }: { doc: InvoiceDocumentModel; size?: number; onDark?: boolean }) {
  if (doc.logoUrl) {
    return <span className="inline-flex items-center rounded-md" style={onDark ? { background: '#FFFFFF', padding: 6 } : undefined}>
      <img src={doc.logoUrl} alt="Business logo" crossOrigin="anonymous" className="object-contain object-left" style={{ height: size, maxWidth: size * 3.5 }}/>
    </span>
  }
  return <span className="grid shrink-0 place-items-center rounded-xl text-[18px] font-black" style={{ width: size, height: size, background: onDark ? '#FFFFFF' : doc.accent, color: onDark ? doc.accent : '#FFFFFF' }}>
    {doc.legalName.trim().charAt(0).toUpperCase() || 'S'}
  </span>
}

/** The business's phone and email, under its address. */
export function ContactLine({ doc, color }: { doc: InvoiceDocumentModel; color?: string }) {
  if (!doc.contactLine) return null
  return <p className="mt-1 text-[12px]" style={{ color: color ?? MUTED }}>{doc.contactLine}</p>
}

/** Bank, account number and name the customer pays into. */
export function PayToBlock({ doc, framed = false }: { doc: InvoiceDocumentModel; framed?: boolean }) {
  if (!doc.payTo) return null
  return <div data-pdf-block className={framed ? 'mt-8 grid grid-cols-3 gap-4 rounded-lg p-5' : 'grid grid-cols-3 gap-4'} style={framed ? { border: `1px solid ${RULE}` } : undefined}>
    {[['Bank', doc.payTo.bank], ['Account number', doc.payTo.account], ['Account name', doc.payTo.name]].map(([label, value]) => <div key={label} className="min-w-0">
      <p className="text-[10px] font-extrabold uppercase tracking-[.14em]" style={{ color: MUTED }}>{label}</p>
      <p className="mt-1 break-words text-[13px] font-bold tabular-nums" style={{ color: INK }}>{value || '—'}</p>
    </div>)}
  </div>
}

export function DocumentFooter({ doc }: { doc: InvoiceDocumentModel }) {
  return <div data-pdf-block className="mt-10 pt-5 text-[11px] leading-5" style={{ borderTop: `1px solid ${RULE}`, color: MUTED }}>
    {doc.payTo && <div className="mb-5"><p className="mb-2 text-[11px] font-extrabold" style={{ color: INK }}>Pay into</p><PayToBlock doc={doc}/></div>}
    <div className="grid grid-cols-2 gap-6">
    <p><span className="font-extrabold" style={{ color: INK }}>Payment</span><br/>Please use <b style={{ color: INK }}>{doc.number}</b> as your payment reference.</p>
    <p className="text-right"><span className="font-extrabold" style={{ color: INK }}>Thank you for your business</span><br/>{doc.legalName}</p>
    </div>
  </div>
}
