import { addDaysIso, formatDate, formatTimeRange } from "@/lib/format"
import type { Day, ReceivingSlot } from "@/lib/types"

const WEEKDAY: Day[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

/**
 * Upcoming dates (14 days, Asia/Jakarta) that match the receiving schedule.
 * Admins may also pick today (`includeToday`).
 */
export function upcomingSlots(schedule: ReceivingSlot[], { includeToday = true, now = new Date() } = {}) {
  const out: { value: string; label: string; date: string; start: string; end: string }[] = []
  for (let i = includeToday ? 0 : 1; i < 15; i++) {
    const iso = addDaysIso(i, now)
    const day = WEEKDAY[new Date(`${iso}T00:00:00Z`).getUTCDay()]
    for (const s of schedule.filter((x) => x.day === day)) {
      out.push({
        value: `${iso}|${s.start}|${s.end}`,
        label: `${formatDate(iso)}, ${formatTimeRange(s.start, s.end)}`,
        date: iso,
        start: s.start,
        end: s.end,
      })
    }
  }
  return out
}

export function parseSlot(value: string) {
  const [date, start, end] = value.split("|")
  return { date, start, end }
}
