import { subDays } from 'date-fns'
import { useState } from 'react'
import { toApiDate, type DateRange } from '@/components/ui/DateRangeFilter'

/** The last `count` days including today, for screens that open on a recent period. */
export const lastDays = (count: number): DateRange => ({ from: subDays(new Date(), count - 1), to: new Date() })

/**
 * State behind a screen's <DateRangeFilter/>, plus the start_date/end_date the API takes.
 * A half-picked range (start only) filters that one day. `onChange` is for resetting pagination.
 */
export function useDateRangeFilter(options: { initial?: () => DateRange; onChange?: () => void } = {}) {
  const [range, setRange] = useState<DateRange | undefined>(options.initial)
  return {
    range,
    startDate: toApiDate(range?.from),
    endDate: toApiDate(range?.to ?? range?.from),
    setRange: (next: DateRange | undefined) => { setRange(next); options.onChange?.() },
  }
}
