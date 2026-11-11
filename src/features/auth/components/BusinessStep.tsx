import { Button } from '@/components/ui/Button'
import { FilePicker } from '@/components/ui/common'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { SelectField } from '@/components/ui/SelectField'
import { cn } from '@/lib/cn'
import { useBusinessSetup } from '../hooks/useBusinessSetup'
import { PhoneField } from './PhoneField'

export function BusinessStep() {
  const { register, errors, types, currencies, phone, days, selectedDays, toggleDay, logo, logoAccept, logoMaxMb, onLogoFile, onLogoClear, onSubmit, isSubmitting } = useBusinessSetup()
  return <form onSubmit={onSubmit} noValidate>
    <div className="mt-7">
      <span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">Business Logo</span>
      <div className="flex items-center gap-3">
        <FilePicker accept={logoAccept} onFile={onLogoFile} className="block min-w-0 flex-1"><div className="flex items-center gap-4 rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-4">{logo ? <img src={logo} alt="Business logo" className="h-14 w-14 rounded-xl object-cover"/> : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]"><Icon name="building" size={22}/></div>}<div><div className="text-xs font-extrabold text-[#28483B]">{logo ? 'Change Image' : 'Select Image'}</div><div className="mt-1 text-[10px] text-[#87968F]">JPG, PNG or WebP · up to {logoMaxMb} MB</div></div></div></FilePicker>
        {logo && <Button variant="ghost" onClick={onLogoClear} className="shrink-0">Remove</Button>}
      </div>
      <div className="mt-5 space-y-4">
        <Field label="Business Name" placeholder="Enter business name" error={errors.name?.message} {...register('name')}/>
        <SelectField label="Type" placeholder="Select a type" options={types} error={errors.type?.message} {...register('type')}/>
        <SelectField label="Currency" placeholder="Select a currency" options={currencies} error={errors.currency?.message} {...register('currency')}/>
        <Field label="Country" placeholder="Enter country" autoComplete="country-name" error={errors.country?.message} {...register('country')}/>
        <Field label="State / Province" placeholder="Enter state or province" autoComplete="address-level1" error={errors.state?.message} {...register('state')}/>
        <Field label="City / Town" placeholder="Enter city or town" autoComplete="address-level2" error={errors.city?.message} {...register('city')}/>
        <Field label="Street Address" placeholder="Enter street address" autoComplete="street-address" error={errors.street?.message} {...register('street')}/>
        <PhoneField label="Phone Number" name={phone.name} value={phone.value} onChange={phone.onChange} onBlur={phone.onBlur} placeholder="Enter phone number" error={errors.phone?.message}/>
        <Field label="Email Address" type="email" placeholder="business@example.com" autoComplete="email" error={errors.email?.message} {...register('email')}/>
        <div>
          <span className="mb-1 block text-[12px] font-extrabold text-[#34483F]">Delivery Days</span>
          <span className="mb-2 block text-[11px] text-[#7C8D85]">Days this business delivers orders.</span>
          <div className="flex flex-wrap gap-2">{days.map(day => {
            const active = selectedDays.includes(day.value)
            return <button key={day.value} type="button" aria-pressed={active} onClick={() => toggleDay(day.value)}
              className={cn('rounded-full border px-3.5 py-1.5 text-xs font-bold transition', active ? 'border-[#529661] bg-[#529661] text-white hover:bg-[#438352]' : 'border-[#DCE7E0] bg-white text-[#34483F] hover:border-[#529661] hover:bg-[#F3F7F4]')}>{day.short}</button>
          })}</div>
        </div>
      </div>
    </div>
    <Button type="submit" loading={isSubmitting} className="mt-7 w-full py-3.5">Create Business</Button>
  </form>
}
