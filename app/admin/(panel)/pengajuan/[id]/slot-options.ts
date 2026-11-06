import { formatDate, formatTimeRange } from "@/lib/format"
import type { Day, ReceivingSlot } from "@/lib/types"

const WEEKDAY: Day[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

/** Upcoming dates (next 14 days from the mock "today") that match the receiving schedule. */
export function upcomingSlots(schedule: ReceivingSlot[], from = "2026-11-04") {
  const [y, m, d] = from.split("-").map(Number)
  const out: { value: string; label: string; date: string; start: string; end: string }[] = []
  for (let i = 0; i < 14; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i))
    const iso = dt.toISOString().slice(0, 10)
    for (const s of schedule.filter((x) => x.day === WEEKDAY[dt.getUTCDay()])) {
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
