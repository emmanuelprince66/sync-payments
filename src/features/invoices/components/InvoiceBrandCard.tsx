import type { UseFormReturn } from 'react-hook-form'
import { FilePicker } from '@/components/ui/common'
import { KitField } from '@/components/ui/KitForm'
import { SelectField } from '@/components/ui/SelectField'
import { LETTERHEADS } from '../constants'
import type { InvoiceFormValues } from '../schemas'

export function InvoiceBrandCard({ form, logoName, logoUrl, onLogo }: { form: UseFormReturn<InvoiceFormValues>; logoName: string; logoUrl: string; onLogo: (file: File) => void }) {
  const { register, formState: { errors } } = form
  return <div className="rounded-lg border border-border p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="min-w-0"><p className="text-[10px] font-extrabold">Brand & letterhead</p><p className="mt-1 text-[9px] text-muted-foreground">Applied to this document and future invoices.</p></div>
      <FilePicker accept="image/*" onFile={onLogo} className="shrink-0 rounded-md border border-border px-2.5 py-1.5 text-[9px] font-extrabold text-secondary hover:bg-accent">Upload logo</FilePicker>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_90px_120px]">
      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
        {logoUrl && <img src={logoUrl} alt="Uploaded business logo" className="h-6 w-6 object-contain"/>}
        <div className="min-w-0"><p className="truncate text-[9px] font-extrabold">{logoName}</p><p className="mt-0.5 text-[8px] text-muted-foreground">Logo file</p></div>
      </div>
      <label><span className="mb-1 block text-[8px] font-extrabold text-muted-foreground">Brand color</span><input type="color" {...register('accent')} className="h-8 w-full cursor-pointer rounded border border-border bg-white p-1"/></label>
      <div><span className="mb-1 block text-[8px] font-extrabold text-muted-foreground">Letterhead</span><SelectField aria-label="Letterhead" options={LETTERHEADS} boxClassName="h-8 rounded border-border px-2 text-[9px] font-bold" {...register('letterhead')}/></div>
    </div>
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <KitField label="Business legal name" error={errors.legalName?.message} {...register('legalName')}/>
      <KitField label="Business address" error={errors.address?.message} {...register('address')}/>
    </div>
  </div>
}
