import { IconCheck, IconMinus } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import {
  DAY_LABEL,
  DAYS,
  formatCommission,
  formatRupiah,
  formatShelfLife,
  formatTimeRange,
} from "@/lib/format"
import type { Opportunity, OperatingHour, ReceivingSlot } from "@/lib/types"
import { InfoRow } from "@/components/app/blocks"

export function CategoryChips({ categories }: { categories: Opportunity["categories"] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((c) => (
        <span key={c.id} className="bg-muted px-2.5 py-1 text-xs text-foreground/80">
          {c.name}
        </span>
      ))}
    </div>
  )
}

/** Requirement list: shelf life, max price, legal, notes. */
export function RequirementList({ opportunity: o }: { opportunity: Opportunity }) {
  const r = o.requirements
  const legal = [
    { label: "NIB", required: r.requires_nib },
    { label: "PIRT", required: r.requires_pirt },
    { label: "Sertifikat halal", required: r.requires_halal },
  ]
  return (
    <div className="flex flex-col divide-y">
      <InfoRow label="Masa simpan minimal" value={r.min_shelf_life_days ? formatShelfLife(r.min_shelf_life_days) : "Tidak ditentukan"} />
      <InfoRow label="Harga jual maksimal" value={r.max_retail_price ? formatRupiah(r.max_retail_price) : "Tidak ditentukan"} />
      <InfoRow label="Maksimal produk per UMKM" value={`${o.max_products_per_umkm} produk`} />
      <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
        <span className="text-muted-foreground">Legalitas wajib</span>
        <span className="flex flex-wrap justify-end gap-2">
          {legal.map((l) => (
            <span
              key={l.label}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 text-xs",
                l.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground line-through"
              )}
            >
              {l.required ? <IconCheck className="size-3" /> : <IconMinus className="size-3" />}
              {l.label}
            </span>
          ))}
        </span>
      </div>
      {r.notes && (
        <div className="flex flex-col gap-1 py-3 text-sm">
          <span className="text-muted-foreground">Syarat lain</span>
          <p>{r.notes}</p>
        </div>
      )}
      <InfoRow label="Komisi" value={formatCommission(o.commission)} />
    </div>
  )
}

/** Receiving schedule, one line per day: "Senin, 08.00–10.00". */
export function ScheduleList({ slots }: { slots: ReceivingSlot[] }) {
  const sorted = [...slots].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start.localeCompare(b.start))
  return (
    <ul className="flex flex-col divide-y">
      {sorted.map((s, i) => (
        <li key={i} className="flex justify-between py-2.5 text-sm">
          <span>{DAY_LABEL[s.day]}</span>
          <span className="tabular-nums">{formatTimeRange(s.start, s.end)}</span>
        </li>
      ))}
    </ul>
  )
}

export function OperatingHoursList({ hours }: { hours: OperatingHour[] }) {
  return (
    <ul className="flex flex-col divide-y">
      {hours.map((h) => (
        <li key={h.day} className="flex justify-between py-2 text-sm">
          <span>{DAY_LABEL[h.day]}</span>
          <span className={cn("tabular-nums", h.is_closed && "text-muted-foreground")}>
            {h.is_closed ? "Tutup" : formatTimeRange(h.open, h.close)}
          </span>
        </li>
      ))}
    </ul>
  )
}
