import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronDown, Columns3, FileText, GripVertical, Info, Paperclip, Plus, Trash2, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Select } from '@/components/ui/Select'
import { useFormatMoney } from '@/hooks/useFormatMoney'
import { cn } from '@/lib/cn'
import { OPTIONAL_COLUMNS, SALES_ACCOUNTS, TAX_RATES } from '../constants'
import type { InvoiceFormModel } from '../hooks/useInvoiceForm'
import { EntityPicker } from './EntityPicker'

const ITEM_NOTE = "Create items to save details for reuse. If you don't need to save details use the description field."

const th = 'whitespace-nowrap border-b border-r border-border bg-[#F6F8F7] px-3 py-3 text-left text-[11px] font-extrabold text-foreground'
const td = 'border-b border-r border-border p-0 align-middle'
const cellInput = 'h-11 w-full min-w-0 bg-transparent px-3 text-xs font-semibold text-foreground outline-none focus:bg-white focus:ring-2 focus:ring-inset focus:ring-secondary/50 aria-invalid:bg-[#FDF3F3] aria-invalid:ring-2 aria-invalid:ring-inset aria-invalid:ring-[#C72D34]/60'
const cellSelect = 'h-11 rounded-none border-0 bg-transparent px-3 text-xs font-semibold hover:border-0 focus-visible:ring-2 focus-visible:ring-inset'
const menuClass = 'z-[70] min-w-[200px] overflow-hidden rounded-xl border border-[#E2EAE5] bg-white p-1.5 shadow-[0_18px_44px_rgba(9,38,28,.16)]'
const toolbarButton = 'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-white px-3.5 text-[11px] font-extrabold text-secondary transition hover:bg-accent'

function Menu({ trigger, children, align = 'start' }: { trigger: ReactNode; children: ReactNode; align?: 'start' | 'end' }) {
  return <Popover.Root>
    <Popover.Trigger asChild>{trigger}</Popover.Trigger>
    <Popover.Portal><Popover.Content align={align} sideOffset={6} collisionPadding={12} className={menuClass}>{children}</Popover.Content></Popover.Portal>
  </Popover.Root>
}

const menuItem = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-foreground outline-none hover:bg-[#F3F7F4] focus:bg-[#F3F7F4]'

export function InvoiceLineTable({ model }: { model: InvoiceFormModel }) {
  const money = useFormatMoney()
  const { register, formState: { errors } } = model.form
  const show = model.columns.isVisible
  const noTax = model.values.taxMode === 'none'
  const itemOptions = model.items.list.map(item => ({ value: item.id, label: item.code, hint: item.name }))
  const fileCount = model.files.list.length

  return <div className="flex flex-col gap-4">
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-separate border-spacing-0 text-xs">
          <thead>
            <tr>
              <th className={cn(th, 'sticky left-0 z-10 w-10 min-w-10 px-0')}><span className="sr-only">Reorder</span></th>
              {show('item') && <th className={cn(th, 'w-[124px] min-w-[124px]')}>Item</th>}
              <th className={cn(th, 'min-w-32')}>Description</th>
              <th className={cn(th, 'w-16 min-w-16 text-right')}>Qty.</th>
              <th className={cn(th, 'w-24 min-w-24 text-right')}>Price</th>
              {show('discount') && <th className={cn(th, 'w-[88px] min-w-[88px] text-right')}><span className="inline-flex items-center gap-1" title="Discount as a percentage of the line">Disc. (%) <Info size={12} className="text-muted-foreground"/></span></th>}
              {show('account') && <th className={cn(th, 'w-32 min-w-32')}>Account</th>}
              {show('taxRate') && <th className={cn(th, 'w-[104px] min-w-[104px]')}>Tax rate</th>}
              {show('taxAmount') && <th className={cn(th, 'w-[100px] min-w-[100px] text-right')}>Tax amount</th>}
              <th className={cn(th, 'w-28 min-w-28 text-right')}>Amount</th>
              <th className={cn(th, 'sticky right-0 z-10 w-10 min-w-10 border-r-0 px-0')}><span className="sr-only">Delete</span></th>
            </tr>
          </thead>
          <tbody>
            {model.lines.fields.map((field, index) => {
              const lineErrors = errors.lines?.[index]
              const figures = model.lineFigures[index] ?? { amount: 0, tax: 0 }
              const itemId = model.values.lines?.[index]?.itemId ?? ''
              return <tr key={field.id} onDragOver={event => { event.preventDefault(); model.rows.dragOver(index) }} onDrop={event => event.preventDefault()} className="group">
                <td className={cn(td, 'sticky left-0 z-[1] bg-white text-center')}>
                  <button type="button" draggable aria-label={`Move row ${index + 1}. Drag, or use the arrow keys`}
                    onDragStart={event => { event.dataTransfer.effectAllowed = 'move'; model.rows.dragStart(index) }} onDragEnd={model.rows.dragEnd}
                    onKeyDown={event => { if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); model.rows.move(index, index + (event.key === 'ArrowUp' ? -1 : 1)) } }}
                    className="mx-auto grid h-11 w-full cursor-grab place-items-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary/50 active:cursor-grabbing"><GripVertical size={15}/></button>
                </td>
                {show('item') && <td className={td}>
                  <EntityPicker
                    aria-label={`Item, row ${index + 1}`}
                    value={itemId}
                    options={itemOptions}
                    loading={model.items.loading}
                    onChange={value => { const item = model.items.list.find(entry => entry.id === value); if (item) model.applyItem(item, index) }}
                    onCreate={query => model.itemForm.start(index, query)}
                    onDelete={model.items.remove}
                    createLabel="Create new item"
                    note={ITEM_NOTE}
                    triggerClassName="h-11 px-3 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary/50"
                    contentClassName="w-[320px]"
                  />
                </td>}
                <td className={td}><input aria-label={`Description, row ${index + 1}`} title={lineErrors?.description?.message} aria-invalid={lineErrors?.description ? true : undefined} {...register(`lines.${index}.description`)} className={cellInput}/></td>
                <td className={td}><input aria-label={`Quantity, row ${index + 1}`} title={lineErrors?.qty?.message} inputMode="decimal" aria-invalid={lineErrors?.qty ? true : undefined} {...register(`lines.${index}.qty`)} className={cn(cellInput, 'text-right')}/></td>
                <td className={td}><input aria-label={`Price, row ${index + 1}`} title={lineErrors?.price?.message} inputMode="decimal" aria-invalid={lineErrors?.price ? true : undefined} {...register(`lines.${index}.price`)} className={cn(cellInput, 'text-right')}/></td>
                {show('discount') && <td className={td}><input aria-label={`Discount percent, row ${index + 1}`} title={lineErrors?.discount?.message} inputMode="decimal" aria-invalid={lineErrors?.discount ? true : undefined} {...register(`lines.${index}.discount`)} className={cn(cellInput, 'text-right')}/></td>}
                {show('account') && <td className={td}><Select aria-label={`Account, row ${index + 1}`} options={SALES_ACCOUNTS} boxClassName={cellSelect} {...register(`lines.${index}.account`)}/></td>}
                {show('taxRate') && <td className={td}><Select aria-label={`Tax rate, row ${index + 1}`} options={TAX_RATES} disabled={noTax} boxClassName={cellSelect} {...register(`lines.${index}.taxRate`)}/></td>}
                {show('taxAmount') && <td className={cn(td, 'px-3 text-right font-semibold text-muted-foreground')}>{money(figures.tax)}</td>}
                <td className={cn(td, 'px-3 text-right font-extrabold')}>{money(figures.amount)}</td>
                <td className={cn(td, 'sticky right-0 z-[1] border-r-0 bg-white text-center')}>
                  <button type="button" aria-label={`Delete row ${index + 1}`} onClick={() => model.rows.remove(index)} className="mx-auto grid h-11 w-full place-items-center text-muted-foreground outline-none hover:text-[#C72D34] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary/50"><Trash2 size={15}/></button>
                </td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3 p-3">
        <div className="inline-flex overflow-hidden rounded-xl border border-border">
          <button type="button" onClick={() => model.rows.add(1)} className="inline-flex h-10 items-center gap-1.5 px-3.5 text-[11px] font-extrabold text-secondary hover:bg-accent"><Plus size={14}/> Add row</button>
          <Menu trigger={<button type="button" aria-label="More ways to add rows" className="grid h-10 w-10 place-items-center border-l border-border text-secondary hover:bg-accent"><ChevronDown size={14}/></button>}>
            <Popover.Close asChild><button type="button" onClick={() => model.rows.add(5)} className={menuItem}><Plus size={14}/> Add 5 rows</button></Popover.Close>
          </Menu>
        </div>
        {errors.lines?.root?.message && <p role="alert" className="text-[11px] font-semibold text-[#C72D34]">{errors.lines.root.message}</p>}
      </div>
    </div>

    <div className="flex flex-wrap gap-3">
      <Menu trigger={<button type="button" className={toolbarButton}><Columns3 size={14}/> Columns ({model.columns.hidden.length} hidden) <ChevronDown size={14}/></button>}>
        <p className="px-3 pb-1 pt-2 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Show columns</p>
        {OPTIONAL_COLUMNS.map(column => {
          const visible = show(column.id)
          return <button key={column.id} type="button" role="menuitemcheckbox" aria-checked={visible} onClick={() => model.columns.toggle(column.id)} className={menuItem}>
            <span className={cn('grid h-4 w-4 shrink-0 place-items-center rounded border', visible ? 'border-secondary bg-secondary text-white' : 'border-border bg-white')}>{visible && <Check size={11}/>}</span>
            {column.label}
          </button>
        })}
      </Menu>

      <Menu trigger={<button type="button" className={toolbarButton}><FileText size={14}/> Files{fileCount > 0 && ` (${fileCount})`} <ChevronDown size={14}/></button>}>
        <div className="flex w-[min(300px,calc(100vw-48px))] flex-col gap-1">
          {model.files.list.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs">
            <Paperclip size={13} className="shrink-0 text-muted-foreground"/>
            <span className="min-w-0 flex-1 truncate font-semibold">{file.name}</span>
            <button type="button" aria-label={`Remove ${file.name}`} onClick={() => model.files.remove(index)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-[#C72D34]"><X size={13}/></button>
          </div>)}
          <label className={cn(menuItem, 'cursor-pointer font-extrabold text-secondary')}>
            <Plus size={14}/> Attach files
            <input type="file" multiple className="sr-only" onChange={event => { model.files.add(event.target.files); event.target.value = '' }}/>
          </label>
          <p className="px-3 pb-1 text-[10px] leading-4 text-muted-foreground">Files stay on this device for now. They aren't uploaded or sent with the invoice.</p>
        </div>
      </Menu>
    </div>
  </div>
}

export function InvoiceTotals({ totals }: { totals: InvoiceFormModel['totals'] }) {
  const money = useFormatMoney()
  return <dl className="ml-auto flex w-full flex-col text-sm md:max-w-sm">
    <div className="flex justify-between gap-4 py-2.5"><dt>Subtotal</dt><dd className="font-semibold">{money(totals.subtotal)}</dd></div>
    <div className="flex justify-between gap-4 py-2.5"><dt>Total tax</dt><dd className="font-semibold">{money(totals.tax)}</dd></div>
    <div className="mt-2 flex justify-between gap-4 border-y-[3px] border-[#C9D2CD] py-3 text-xl font-extrabold"><dt>Total</dt><dd className="[overflow-wrap:anywhere]">{money(totals.total)}</dd></div>
  </dl>
}
