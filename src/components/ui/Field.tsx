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
    <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">{label}</span>
    <span className={cn('flex h-12 items-center rounded-xl border border-[#DCE7E0] bg-white px-3.5 transition focus-within:border-[#529661] focus-within:ring-4 focus-within:ring-[#529661]/10', error && 'border-[#E65A4F] focus-within:border-[#E65A4F] focus-within:ring-[#E65A4F]/10')}>
      <input
        ref={ref}
        id={inputId}
        name={name}
        type={type}
        aria-invalid={error ? true : undefined}
        onChange={event => { onChange?.(event); onValueChange?.(event.target.value) }}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#09261C] outline-none placeholder:font-medium placeholder:text-[#9AABA3]"
        {...props}
      />
      {suffix && <span className="ml-2 text-xs font-bold text-[#75877F]">{suffix}</span>}
      {endAdornment}
    </span>
    {error
      ? <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#D15B50]">{error}</span>
      : hint && <span className="mt-1.5 block text-[11px] text-[#7C8D85]">{hint}</span>}
  </label>
}
