import { useId, type ReactNode } from 'react'
import { OptionSelect } from '@/components/ui/OptionSelect'
import { cn } from '@/lib/cn'
import { usePhoneField } from '../hooks/usePhoneField'

type PhoneFieldProps = {
  label: ReactNode
  name: string
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  error?: string
}

/** Phone number with a country-code picker (Nigeria by default). The value is the full international number. */
export function PhoneField({ label, name, value, onChange, onBlur, placeholder = 'Enter phone number', error }: PhoneFieldProps) {
  const inputId = useId()
  const { countries, country, national, onCountryChange, onNationalChange } = usePhoneField({ value, onChange })
  return <div className="block min-w-0">
    <label htmlFor={inputId} data-ff="label" className="mb-2 block text-[12px] font-extrabold text-[#474747]">{label}</label>
    <div className="flex gap-2">
      <OptionSelect aria-label="Country code" options={countries} value={country} onValueChange={onCountryChange} searchable className="w-[148px] shrink-0" boxClassName={cn(error && 'border-[#E52929]')}/>
      <span data-ff="box" className={cn('flex h-12 min-w-0 flex-1 items-center rounded-xl border border-[#D9DADE] bg-white px-3.5 transition focus-within:border-[#FF7F00] focus-within:ring-4 focus-within:ring-[#FF7F00]/10', error && 'border-[#E52929] focus-within:border-[#E52929] focus-within:ring-[#E52929]/10')}>
        <input id={inputId} name={name} type="tel" inputMode="tel" autoComplete="tel-national" value={national} placeholder={placeholder} aria-invalid={error ? true : undefined}
          onChange={event => onNationalChange(event.target.value)} onBlur={onBlur}
          data-ff="input"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#1E1E1E] outline-none placeholder:font-medium placeholder:text-[#6D7176]"/>
      </span>
    </div>
    {error && <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#C72D34]">{error}</span>}
  </div>
}
