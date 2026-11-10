import { useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '@/api/auth'
import { useSaveStorefront, WEEK_DAYS, type StorefrontProfile, type WeekDay } from '@/api/storefront'

export type HoursPreset = 'weekdays' | 'everyday' | 'custom'

const WEEKDAYS: WeekDay[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const EVERY_DAY = WEEK_DAYS.map(day => day.value)

const sameDays = (a: WeekDay[], b: WeekDay[]) => a.length === b.length && a.every(day => b.includes(day))
const ordered = (days: WeekDay[]) => EVERY_DAY.filter(day => days.includes(day))

export const presetOptions = [
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'everyday', label: 'Every day' },
  { value: 'custom', label: 'Custom' },
] as const satisfies readonly { value: HoursPreset; label: string }[]

/** Opening days (working_days) and delivery days (delivery_days) shown on the storefront. */
export function useStoreHours(profile: StorefrontProfile) {
  const [workingDays, setWorkingDays] = useState<WeekDay[]>(profile.workingDays)
  const [deliveryDays, setDeliveryDays] = useState<WeekDay[]>(profile.deliveryDays)
  const [custom, setCustom] = useState(false)
  const save = useSaveStorefront()

  const preset: HoursPreset = custom ? 'custom' : sameDays(workingDays, WEEKDAYS) ? 'weekdays' : sameDays(workingDays, EVERY_DAY) ? 'everyday' : 'custom'

  const toggle = (list: WeekDay[], day: WeekDay) => ordered(list.includes(day) ? list.filter(item => item !== day) : [...list, day])

  const dirty = !sameDays(workingDays, profile.workingDays) || !sameDays(deliveryDays, profile.deliveryDays)

  const submit = () => {
    if (!workingDays.length) return toast.error('Pick at least one opening day.')
    save.mutate({ workingDays, deliveryDays }, {
      onSuccess: () => toast.success('Opening and delivery days saved'),
      onError: error => toast.error(errorMessage(error)),
    })
  }

  return {
    days: WEEK_DAYS,
    workingDays,
    deliveryDays,
    preset,
    setPreset: (value: HoursPreset) => {
      setCustom(value === 'custom')
      if (value === 'weekdays') setWorkingDays(WEEKDAYS)
      if (value === 'everyday') setWorkingDays(EVERY_DAY)
    },
    toggleWorkingDay: (day: WeekDay) => { setCustom(true); setWorkingDays(current => toggle(current, day)) },
    toggleDeliveryDay: (day: WeekDay) => setDeliveryDays(current => toggle(current, day)),
    dirty,
    reset: () => { setWorkingDays(profile.workingDays); setDeliveryDays(profile.deliveryDays); setCustom(false) },
    submit,
    saving: save.isPending,
  }
}
