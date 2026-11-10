import { Button } from '@/components/ui/Button'
import { FilePicker } from '@/components/ui/common'
import { Field } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { SelectField } from '@/components/ui/SelectField'
import { useBusinessSetup } from '../hooks/useBusinessSetup'

export function BusinessStep() {
  const { register, errors, categories, logo, onLogoFile, onSubmit, isSubmitting, isReady } = useBusinessSetup()
  return <form onSubmit={onSubmit} noValidate>
    <div className="mt-7">
      <FilePicker accept="image/*" onFile={onLogoFile} className="block"><span className="mb-2 block text-[12px] font-extrabold text-[#34483F]">Business logo</span><div className="flex items-center gap-4 rounded-2xl border border-dashed border-[#C9D8CF] bg-[#FAFCFA] p-4">{logo ? <img src={logo} alt="Business logo" className="h-14 w-14 rounded-xl object-cover"/> : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#EAF5E9] text-[#438352]"><Icon name="building" size={22}/></div>}<div><div className="text-xs font-extrabold text-[#28483B]">{logo ? 'Change business logo' : 'Upload your business logo'}</div><div className="mt-1 text-[10px] text-[#87968F]">PNG or JPG · up to 2 MB</div></div></div></FilePicker>
      <div className="mt-5 space-y-4">
        <Field label="Business name" placeholder="e.g. Kemi’s Store" error={errors.name?.message} {...register('name')}/>
        <SelectField label="Business category" options={categories} {...register('category')}/>
        <Field label="Business pickup address" placeholder="Enter your full business address" autoComplete="street-address" error={errors.address?.message} {...register('address')}/>
      </div>
    </div>
    <Button type="submit" loading={isSubmitting} disabled={!isReady} className="mt-7 w-full py-3.5">Save and continue</Button>
  </form>
}
