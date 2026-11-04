import type { Commission, Day, ReceivingSlot } from "@/lib/types"

/**
 * Fixed "now" for the mock UI so server and client render identical relative
 * times (no hydration mismatch). Replace with `new Date()` once data is live.
 */
export const NOW = new Date("2026-11-04T16:00:00+07:00")

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000

const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
const DAY_LONG = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

export const DAYS: Day[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

export const DAY_LABEL: Record<Day, string> = {
  mon: "Senin",
  tue: "Selasa",
  wed: "Rabu",
  thu: "Kamis",
  fri: "Jumat",
  sat: "Sabtu",
  sun: "Minggu",
}

export const DAY_LABEL_SHORT: Record<Day, string> = {
  mon: "Sen",
  tue: "Sel",
  wed: "Rab",
  thu: "Kam",
  fri: "Jum",
  sat: "Sab",
  sun: "Min",
}

/** Calendar parts in Asia/Jakarta, computed manually for SSR/CSR parity. */
function parts(input: string | Date) {
  const raw =
    typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)
      ? new Date(`${input}T00:00:00+07:00`)
      : new Date(input)
  const d = new Date(raw.getTime() + JAKARTA_OFFSET_MS)
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    date: d.getUTCDate(),
    weekday: d.getUTCDay(),
    hours: d.getUTCHours(),
    minutes: d.getUTCMinutes(),
    dayIndex: Math.floor(d.getTime() / 86_400_000),
  }
}

const pad = (n: number) => String(n).padStart(2, "0")

/** 12500 → "Rp12.500" */
export function formatRupiah(value: number) {
  const sign = value < 0 ? "-" : ""
  const digits = String(Math.round(Math.abs(value))).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${sign}Rp${digits}`
}

/** "2026-11-09" → "Sen, 9 Nov 2026" */
export function formatDate(input: string | Date, opts: { weekday?: boolean } = { weekday: true }) {
  const p = parts(input)
  const base = `${p.date} ${MONTH_SHORT[p.month]} ${p.year}`
  return opts.weekday ? `${DAY_SHORT[p.weekday]}, ${base}` : base
}

/** "2026-11-09" → "Senin, 9 Nov 2026" */
export function formatDateLong(input: string | Date) {
  const p = parts(input)
  return `${DAY_LONG[p.weekday]}, ${p.date} ${MONTH_SHORT[p.month]} ${p.year}`
}

/** ISO → "4 Nov 2026, 15.30" */
export function formatDateTime(input: string | Date) {
  const p = parts(input)
  return `${p.date} ${MONTH_SHORT[p.month]} ${p.year}, ${pad(p.hours)}.${pad(p.minutes)}`
}

/** "08:00" → "08.00" */
export function formatTime(time: string) {
  return time.replace(":", ".")
}

/** "08:00","10:00" → "08.00–10.00" */
export function formatTimeRange(start: string, end: string) {
  return `${formatTime(start)}–${formatTime(end)}`
}

/** ISO → "5 menit lalu", "2 jam lalu", "kemarin", "3 hari lalu", full date after 7 days */
export function formatRelative(input: string | Date, now: Date = NOW) {
  const then = new Date(input)
  const diffMin = Math.floor((now.getTime() - then.getTime()) / 60_000)
  if (diffMin < 1) return "baru saja"
  if (diffMin < 60) return `${diffMin} menit lalu`
  const dayDiff = parts(now).dayIndex - parts(then).dayIndex
  if (dayDiff === 0) return `${Math.floor(diffMin / 60)} jam lalu`
  if (dayDiff === 1) return "kemarin"
  if (dayDiff < 7) return `${dayDiff} hari lalu`
  return formatDate(then, { weekday: false })
}

/** Grouping bucket for notification lists. */
export function relativeDayBucket(input: string | Date, now: Date = NOW) {
  const dayDiff = parts(now).dayIndex - parts(input).dayIndex
  if (dayDiff <= 0) return "Hari ini"
  if (dayDiff === 1) return "Kemarin"
  return "Sebelumnya"
}

/** "Hari ini" / "Besok" / null for an upcoming date. */
export function upcomingDayLabel(input: string | Date, now: Date = NOW) {
  const dayDiff = parts(input).dayIndex - parts(now).dayIndex
  if (dayDiff === 0) return "Hari ini"
  if (dayDiff === 1) return "Besok"
  return null
}

/** Today's greeting date, e.g. "Rabu, 4 Nov 2026". */
export function formatToday(now: Date = NOW) {
  return formatDateLong(now)
}

/** 3.6 → "3,6 km" */
export function formatDistance(km: number) {
  return `${km.toFixed(1).replace(".", ",")} km`
}

export function formatShelfLife(days: number) {
  return `${days} hari`
}

export function formatCommission(c: Commission) {
  return c.type === "percent"
    ? `Komisi ${c.value}% dari harga jual`
    : `Komisi ${formatRupiah(c.value)} per unit terjual`
}

export function formatCommissionShort(c: Commission) {
  return c.type === "percent" ? `Komisi ${c.value}%` : `Komisi ${formatRupiah(c.value)}/unit`
}

export function calcCommission(sellPrice: number, c: Commission) {
  const commission = c.type === "percent" ? Math.round((sellPrice * c.value) / 100) : c.value
  return { commission, income: Math.max(sellPrice - commission, 0) }
}

/**
 * Compact receiving schedule: slots sharing the same time range are merged.
 * [{mon 08-10},{thu 08-10}] → "Sen & Kam, 08.00–10.00"
 */
export function summarizeSchedule(slots: ReceivingSlot[]) {
  const groups = new Map<string, Day[]>()
  for (const s of slots) {
    const key = formatTimeRange(s.start, s.end)
    groups.set(key, [...(groups.get(key) ?? []), s.day])
  }
  return [...groups.entries()]
    .map(([range, days]) => {
      const sorted = [...new Set(days)].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b))
      const labels = sorted.map((d) => DAY_LABEL_SHORT[d])
      const joined =
        labels.length > 1 ? `${labels.slice(0, -1).join(", ")} & ${labels.at(-1)}` : labels[0]
      return `${joined}, ${range}`
    })
    .join(" · ")
}

export function formatCount(n: number) {
  return n > 99 ? "99+" : String(n)
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
}
