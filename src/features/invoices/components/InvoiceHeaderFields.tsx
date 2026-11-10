import { Bookmark, CircleDollarSign, Hash, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useController } from 'react-hook-form'
import { Link } from 'react-router'
import { DateRangeFilter, toApiDate } from '@/components/ui/DateRangeFilter'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/cn'
import { TAX_MODES } from '../constants'
import type { InvoiceFormModel } from '../hooks/useInvoiceForm'
import { EntityPicker } from './EntityPicker'

const labelClass = 'mb-1.5 block text-[11px] font-extrabold text-foreground'
const boxClass = 'h-11 rounded-xl border border-border bg-[#F8FAF8] px-3 text-xs font-bold text-foreground transition focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/10'
const invalidClass = 'border-[#C72D34]'

function FieldError({ message }: { message?: string }) {
  return message ? <span role="alert" className="mt-1 block text-[10px] font-semibold text-[#C72D34]">{message}</span> : null
}

function HeaderField({ label, htmlFor, error, children }: { label: string; htmlFor?: string; error?: string; children: ReactNode }) {
  return <div className="min-w-0">
    {htmlFor ? <label htmlFor={htmlFor} className={labelClass}>{label}</label> : <span className={labelClass}>{label}</span>}
    {children}
    <FieldError message={error}/>
  </div>
}

function DateField({ model, name, label, placeholder }: { model: InvoiceFormModel; name: 'issueDate' | 'dueDate'; label: string; placeholder: string }) {
  const { field, fieldState } = useController({ control: model.form.control, name })
  const day = field.value ? new Date(`${field.value}T00:00:00`) : undefined
  return <HeaderField label={label} error={fieldState.error?.message}>
    <DateRangeFilter singleDay align="start" placeholder={placeholder} value={day ? { from: day, to: day } : undefined} onChange={next => field.onChange(toApiDate(next?.from))}
      className="flex w-full" triggerClassName={cn('h-11 gap-2.5 border-border bg-[#F8FAF8] text-xs font-bold', fieldState.error && invalidClass)}/>
  </HeaderField>
}

/** Visa, Mastercard and Amex marks, drawn inline so nothing loads from elsewhere. */
function CardLogos() {
  // The four-column layout leaves less room between xl and 2xl, so Amex steps out there.
  return <span role="img" className="flex shrink-0 items-center gap-1" aria-label="Visa, Mastercard and American Express">
    <span className="grid h-5 w-8 place-items-center rounded-[3px] bg-[#1A1F71] text-[8px] font-black italic tracking-tight text-white">VISA</span>
    <span className="relative grid h-5 w-8 place-items-center rounded-[3px] bg-[#111]"><span className="absolute left-[7px] h-3 w-3 rounded-full bg-[#EB001B]"/><span className="absolute right-[7px] h-3 w-3 rounded-full bg-[#F79E1B] mix-blend-screen"/></span>
    <span className="grid h-5 w-8 place-items-center rounded-[3px] bg-[#2E77BC] text-[6px] font-black leading-none tracking-tight text-white xl:hidden 2xl:grid">AMEX</span>
  </span>
}

export function InvoiceHeaderFields({ model }: { model: InvoiceFormModel }) {
  const { register, formState: { errors } } = model.form
  const contact = useController({ control: model.form.control, name: 'contactId' })

  return <div className="grid grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-5 md:grid-cols-[repeat(2,minmax(0,1fr))] xl:grid-cols-[repeat(4,minmax(0,1fr))]">
    <HeaderField label="Contact" error={errors.contactId?.message}>
      <EntityPicker
        aria-label="Contact"
        value={contact.field.value}
        options={model.contacts.options}
        selectedLabel={model.contacts.selected?.name}
        loading={model.contacts.loading}
        onSearch={model.contacts.setQuery}
        onChange={model.contacts.pick}
        onCreate={model.contactForm.start}
        createLabel="Create new contact"
        placeholder="Choose a contact"
        icon={<UserRound size={15}/>}
        invalid={Boolean(errors.contactId)}
        triggerClassName={cn(boxClass, 'hover:border-secondary', errors.contactId && invalidClass)}
      />
    </HeaderField>

    <DateField model={model} name="issueDate" label="Issue date" placeholder="Select a date"/>
    <DateField model={model} name="dueDate" label="Due date" placeholder="Select a date"/>

    <HeaderField label="Invoice number" htmlFor="invoice-number" error={errors.number?.message}>
      <label className={cn('flex items-center gap-2.5', boxClass, errors.number && invalidClass)}>
        <Hash size={15} className="shrink-0 text-foreground/70"/>
        <input id="invoice-number" autoComplete="off" {...register('number')} className="h-full w-full min-w-0 bg-transparent outline-none"/>
      </label>
    </HeaderField>

    <HeaderField label="Reference" htmlFor="invoice-reference">
      <label className={cn('flex items-center gap-2.5', boxClass)}>
        <Bookmark size={15} className="shrink-0 fill-current text-foreground/70"/>
        <input id="invoice-reference" autoComplete="off" placeholder="e.g. PO number" {...register('reference')} className="h-full w-full min-w-0 bg-transparent outline-none placeholder:font-medium placeholder:text-muted-foreground"/>
      </label>
    </HeaderField>

    <HeaderField label="Online payments">
      <Link to={model.onlinePaymentsPath} className={cn('flex items-center justify-between gap-2 bg-white hover:border-secondary', boxClass)}>
        <span className="truncate font-extrabold text-secondary">Set up online payments</span>
        <CardLogos/>
      </Link>
    </HeaderField>

    <HeaderField label="Currency">
      <div className={cn('flex items-center gap-2.5', boxClass)}>
        <CircleDollarSign size={15} className="shrink-0 text-foreground/70"/>
        <span className="min-w-0 flex-1 truncate">Nigerian Naira</span>
        <span className="text-[10px] font-extrabold text-muted-foreground">NGN</span>
      </div>
    </HeaderField>

    <HeaderField label="Tax">
      <Select aria-label="Tax" options={TAX_MODES} boxClassName="h-11 border-border bg-[#F8FAF8] px-3 text-xs font-bold text-foreground" {...register('taxMode')}/>
    </HeaderField>
  </div>
}
