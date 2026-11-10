import { Children, isValidElement, type InputHTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react'
import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { cn } from '@/lib/cn'
import { DateRangeFilter, toApiDate } from './DateRangeFilter'
import { Select, type SelectOption } from './Select'

/** Form controls from the Payments design. They work with react-hook-form's register(). */

function FieldError({ message }: { message?: string }) {
  return message ? <span role="alert" className="mt-1 block text-[10px] font-semibold text-[#C72D34]">{message}</span> : null
}

const labelClass = 'mb-1.5 block text-[10px] font-extrabold text-foreground'

export function KitField({ label, error, className, ref, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; ref?: Ref<HTMLInputElement> }) {
  return <label className={cn('block min-w-0', className)}>
    <span className={labelClass}>{label}</span>
    <input ref={ref} aria-invalid={error ? true : undefined} className="h-11 w-full min-w-0 rounded-xl border border-border bg-[#F8FAF8] px-3 text-xs font-bold text-foreground outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 aria-invalid:border-[#C72D34]" {...props}/>
    <FieldError message={error}/>
  </label>
}

const optionText = (node: ReactNode) => Children.toArray(node).map(String).join('')

/** Reads <option> children (through arrays and fragments) into Select options; a repeated value keeps its first entry. */
const optionsFrom = (node: ReactNode, into: SelectOption[] = []) => {
  Children.forEach(node, child => {
    if (!isValidElement(child)) return
    const element = child as ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>
    if (element.type !== 'option') return void optionsFrom(element.props.children, into)
    const value = String(element.props.value ?? optionText(element.props.children))
    if (!into.some(option => option.value === value)) into.push({ value, label: optionText(element.props.children), disabled: element.props.disabled })
  })
  return into
}

type KitSelectProps = {
  label: string
  error?: string
  /** Either <option> children or an options list. */
  children?: ReactNode
  options?: readonly SelectOption[]
  value?: string
  placeholder?: string
  disabled?: boolean
  name?: string
  className?: string
  boxClassName?: string
  /** Same shape as a native select's change event, so `event.target.value` and register() both work. */
  onChange?: (event: { target: { name?: string; value: string }; type: string }) => unknown
  onBlur?: (event: { target: { name?: string; value: string }; type: string }) => unknown
  ref?: Ref<HTMLInputElement>
}

/** The shared Select in the kit's field size. */
export function KitSelect({ label, error, children, options, className, boxClassName, ...props }: KitSelectProps) {
  return <div className={cn('block min-w-0', className)}>
    <span className={labelClass}>{label}</span>
    <Select aria-label={label} options={options ?? optionsFrom(children)} error={error} boxClassName={cn('h-11 border-border bg-[#F8FAF8] px-3 text-xs font-bold text-foreground', boxClassName)} {...props}/>
  </div>
}

/** Single date in the kit's field size. Value is YYYY-MM-DD, as a date input's would be. */
export function KitDateField({ label, value, onChange, error, placeholder = 'Select a date', max, yearJump, className }: { label: string; value: string; onChange: (value: string) => void; error?: string; placeholder?: string; max?: Date; yearJump?: boolean; className?: string }) {
  const day = value ? new Date(`${value.slice(0, 10)}T00:00:00`) : undefined
  return <div className={cn('block min-w-0', className)}>
    <span className={labelClass}>{label}</span>
    <DateRangeFilter
      singleDay
      align="start"
      value={day ? { from: day, to: day } : undefined}
      onChange={next => onChange(toApiDate(next?.from))}
      placeholder={placeholder}
      max={max}
      yearJump={yearJump}
      className="flex w-full"
      triggerClassName={cn('h-11 border-border bg-[#F8FAF8] text-xs font-bold', error && 'border-[#C72D34]')}
    />
    <FieldError message={error}/>
  </div>
}

/** KitDateField bound to a react-hook-form field. */
export function KitFormDate<T extends FieldValues>({ control, name, ...props }: { control: Control<T>; name: FieldPath<T>; label: string; error?: string; placeholder?: string; max?: Date; yearJump?: boolean; className?: string }) {
  const { field } = useController({ control, name })
  return <KitDateField value={String(field.value ?? '')} onChange={field.onChange} {...props}/>
}
