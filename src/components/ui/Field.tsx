import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { cn } from '@/lib/cn'

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string
  suffix?: string
  hint?: string
  error?: string
  /** Element rendered at the end of the input box (e.g. the password eye button). */
  endAdornment?: ReactNode
  /** Controlled usage: receives the raw string value. */
  onValueChange?: (value: string) => void
  ref?: Ref<HTMLInputElement>
}

/**
 * Labelled text input from the design. Use it controlled (value + onValueChange)
 * or with react-hook-form (`{...register('name')}`).
 */
export function Field({ label, suffix, hint, error, endAdornment, onValueChange, onChange, className, type = 'text', id, name, ref, ...props }: FieldProps) {
  const inputId = id ?? (name ? `field-${name}` : undefined)
  return <label className={cn('block', className)} htmlFor={inputId}>
    <span data-ff="label" className="mb-2 block text-[12px] font-extrabold text-[#474747]">{label}</span>
    <span data-ff="box" className={cn('flex h-12 items-center rounded-xl border border-[#D9DADE] bg-white px-3.5 transition focus-within:border-[#FF7F00] focus-within:ring-4 focus-within:ring-[#FF7F00]/10', error && 'border-[#E52929] focus-within:border-[#E52929] focus-within:ring-[#E52929]/10')}>
      <input
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        aria-invalid={error ? true : undefined}
        onChange={event => { onChange?.(event); onValueChange?.(event.target.value) }}
        data-ff="input"
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#1E1E1E] outline-none placeholder:font-medium placeholder:text-[#6D7176]"
        {...props}
      />
      {suffix && <span className="ml-2 text-xs font-bold text-[#6D7176]">{suffix}</span>}
      {endAdornment}
    </span>
    {error
      ? <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#C72D34]">{error}</span>
      : hint && <span className="mt-1.5 block text-[11px] text-[#6D7176]">{hint}</span>}
  </label>
}
