import { CircleDollarSign } from 'lucide-react'
import { KitModal, KitMoneyField, KitTextarea } from '@/components/ui/KitExtras'
import { KitFormDate, KitSelect } from '@/components/ui/KitForm'
import { KitButton } from '@/components/ui/PaymentKit'
import { INVOICE_PAYMENT_METHODS } from '@/api/invoices'
import { useBusinessCurrency } from '@/hooks/useCurrencySymbol'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import type { RecordPaymentForm } from '../hooks/useRecordPaymentForm'

const METHOD_OPTIONS = INVOICE_PAYMENT_METHODS.map(method => ({ value: method, label: method }))

export function RecordPaymentModal({ model, invoiceNumber }: { model: RecordPaymentForm; invoiceNumber: string }) {
  const money = useFormatMoney()
  const { symbol } = useBusinessCurrency()
  const { register, control, formState: { errors } } = model.form
  return <KitModal open={model.open} onClose={model.close} title="Record payment" description={`${invoiceNumber} · ${money(model.balance)} due`} icon={<CircleDollarSign size={16}/>}
    footer={<>
      <KitButton variant="secondary" onClick={model.close}>Cancel</KitButton>
      <KitButton type="submit" form="record-payment-form" loading={model.submitting}>{model.isFull ? 'Record full payment' : 'Record part payment'}</KitButton>
    </>}>
    <form id="record-payment-form" onSubmit={model.submit} noValidate className="flex flex-col gap-4">
      <div>
        <KitMoneyField label="Amount paid" symbol={symbol} error={errors.amount?.message} {...register('amount')}/>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-muted-foreground">
          <span>{model.isFull ? 'This clears the invoice. It will be marked Paid.' : `${money(model.remaining)} will still be due.`}</span>
          <button type="button" onClick={model.payInFull} className="font-extrabold text-secondary hover:underline">Pay full balance</button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <KitFormDate control={control} name="date" label="Payment date" error={errors.date?.message} max={new Date()}/>
        <KitSelect label="Method" options={METHOD_OPTIONS} error={errors.method?.message} {...register('method')}/>
      </div>
      <KitTextarea label="Note (optional)" placeholder="e.g. Transfer from GTBank, ref 0034…" error={errors.note?.message} {...register('note')}/>
    </form>
  </KitModal>
}
