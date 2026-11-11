import type { UseFormReturn } from 'react-hook-form'
import { FilePicker } from '@/components/ui/common'
import { KitField } from '@/components/ui/KitForm'
import type { InvoiceFormValues } from '../schemas'

export function InvoiceBrandCard({ form, logoName, logoUrl, onLogo }: { form: UseFormReturn<InvoiceFormValues>; logoName: string; logoUrl: string; onLogo: (file: File) => void }) {
  const { register, formState: { errors } } = form
  return <div className="rounded-xl border border-border p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="min-w-0"><p className="text-[11px] font-extrabold">Brand</p><p className="mt-1 text-[10px] text-muted-foreground">Logo, colour and business details on this invoice.</p></div>
      <FilePicker accept="image/*" onFile={onLogo} className="shrink-0 rounded-lg border border-border px-3 py-2 text-[10px] font-extrabold text-secondary hover:bg-accent">Upload logo</FilePicker>
    </div>
    <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-3">
      <div className="flex min-w-0 items-center gap-2 rounded-lg bg-muted px-3 py-2">
        {logoUrl && <img src={logoUrl} alt="Business logo" className="h-7 w-7 shrink-0 object-contain"/>}
        <div className="min-w-0"><p className="truncate text-[10px] font-extrabold">{logoName}</p><p className="mt-0.5 text-[9px] text-muted-foreground">Logo</p></div>
      </div>
      <label><span className="mb-1 block text-[9px] font-extrabold text-muted-foreground">Brand colour</span><input type="color" aria-label="Brand colour" {...register('accent')} className="h-9 w-full cursor-pointer rounded-lg border border-border bg-white p-1"/></label>
    </div>
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <KitField label="Business legal name" error={errors.legalName?.message} {...register('legalName')}/>
      <KitField label="Business address" error={errors.address?.message} {...register('address')}/>
    </div>
  </div>
}
