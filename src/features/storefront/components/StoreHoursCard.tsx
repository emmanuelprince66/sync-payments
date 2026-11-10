import { CalendarClock } from 'lucide-react'
import type { StorefrontProfile, WeekDay } from '@/api/storefront'
import { cn } from '@/lib/cn'
import { presetOptions, useStoreHours } from '../hooks/useStoreHours'
import { CardActions, PillSwitch, SettingsCard } from './SettingsCard'

function DayChips({ label, days, selected, onToggle }: { label: string; days: readonly { value: WeekDay; short: string }[]; selected: WeekDay[]; onToggle: (day: WeekDay) => void }) {
  return <div role="group" aria-label={label} className="grid grid-cols-7 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
    {days.map(day => {
      const on = selected.includes(day.value)
      return <button key={day.value} type="button" aria-pressed={on} onClick={() => onToggle(day.value)} className={cn('rounded-xl py-2.5 text-[11px] font-extrabold transition sm:min-w-[52px] sm:px-3', on ? 'bg-secondary text-white shadow-[0_4px_12px_rgba(82,150,97,.22)]' : 'border border-border bg-white text-muted-foreground hover:border-secondary')}>{day.short}</button>
    })}
  </div>
}

export function StoreHoursCard({ profile }: { profile: StorefrontProfile }) {
  const hours = useStoreHours(profile)

  return <SettingsCard icon={<CalendarClock size={16}/>} title="Opening & delivery days" description="Shown on your storefront so customers know when you’re open and when orders go out.">
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[10px] font-extrabold">Opening days</span>
          <PillSwitch label="Opening days preset" value={hours.preset} options={presetOptions} onChange={hours.setPreset}/>
        </div>
        <DayChips label="Opening days" days={hours.days} selected={hours.workingDays} onToggle={hours.toggleWorkingDay}/>
      </div>
      <div>
        <div className="text-[10px] font-extrabold">Delivery days</div>
        <p className="mb-3 mt-0.5 text-[10px] text-muted-foreground">Days riders pick up and deliver your orders.</p>
        <DayChips label="Delivery days" days={hours.days} selected={hours.deliveryDays} onToggle={hours.toggleDeliveryDay}/>
      </div>
    </div>
    <CardActions dirty={hours.dirty} saving={hours.saving} onReset={hours.reset} onSave={hours.submit} saveLabel="Save days"/>
  </SettingsCard>
}
