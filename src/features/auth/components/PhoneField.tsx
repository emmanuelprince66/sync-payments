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
    <label htmlFor={inputId} className="mb-2 block text-[12px] font-extrabold text-[#34483F]">{label}</label>
    <div className="flex gap-2">
      <OptionSelect aria-label="Country code" options={countries} value={country} onValueChange={onCountryChange} searchable className="w-[148px] shrink-0" boxClassName={cn(error && 'border-[#E65A4F]')}/>
      <span className={cn('flex h-12 min-w-0 flex-1 items-center rounded-xl border border-[#DCE7E0] bg-white px-3.5 transition focus-within:border-[#529661] focus-within:ring-4 focus-within:ring-[#529661]/10', error && 'border-[#E65A4F] focus-within:border-[#E65A4F] focus-within:ring-[#E65A4F]/10')}>
        <input id={inputId} name={name} type="tel" inputMode="tel" autoComplete="tel-national" value={national} placeholder={placeholder} aria-invalid={error ? true : undefined}
          onChange={event => onNationalChange(event.target.value)} onBlur={onBlur}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#09261C] outline-none placeholder:font-medium placeholder:text-[#9AABA3]"/>
      </span>
    </div>
    {error && <span role="alert" className="mt-1.5 block text-[11px] font-semibold text-[#D15B50]">{error}</span>}
  </div>
}
