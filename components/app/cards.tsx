"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconArrowRight,
  IconBoxOff,
  IconCalendarEvent,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconDotsVertical,
  IconMailDown,
  IconMapPin,
  IconTruckDelivery,
  type Icon,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import {
  formatCommissionShort,
  formatDate,
  formatDistance,
  formatRelative,
  formatRupiah,
  formatShelfLife,
  formatTimeRange,
  summarizeSchedule,
  upcomingDayLabel,
} from "@/lib/format"
import type {
  AppNotification,
  Application,
  NotificationType,
  Opportunity,
  Product,
  Role,
  StockRow,
} from "@/lib/types"
import { toast } from "@/components/ui/toast"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog, Thumb } from "@/components/app/blocks"
import {
  ApplicationStatusChip,
  MatchBadge,
  OpportunityStatusChip,
  StatusChip,
  StockChip,
} from "@/components/app/status"
import { NumberStepper } from "@/components/app/inputs"

const cardBase =
  "min-w-0 bg-background shadow-sm ring-1 ring-foreground/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40"

/** Flat variant for cards nested inside a <Section>. */
const insetClass = "bg-muted/50 shadow-none ring-0 hover:bg-muted"

// ---------------------------------------------------------------------------
// Opportunity
// ---------------------------------------------------------------------------

export function OpportunityCard({
  opportunity: o,
  side,
  href,
}: {
  opportunity: Opportunity
  side: Role
  href: string
}) {
  const newApps = o.application_counts.submitted ?? 0
  return (
    <Link href={href} className={cn(cardBase, "group flex flex-col gap-4 p-5 hover:bg-background/70")}>
      {side === "umkm" && (
        <div className="flex items-center gap-3">
          <Thumb kind="store" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{o.store.name}</p>
            {o.store.distance_km != null && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <IconMapPin className="size-3" />
                {formatDistance(o.store.distance_km)}
              </p>
            )}
          </div>
          {o.match && <MatchBadge match={o.match} />}
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base leading-snug font-semibold">{o.title}</h3>
        {side === "store" && <OpportunityStatusChip status={o.status} />}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {o.categories.map((c) => (
          <span key={c.id} className="bg-muted px-2 py-1 text-xs text-foreground/80">
            {c.name}
          </span>
        ))}
      </div>

      <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
        <Meta label="Komisi" value={formatCommissionShort(o.commission)} />
        <Meta
          label="Kuota"
          value={side === "store" ? `${o.quota_used}/${o.quota} UMKM` : `Sisa ${o.quota_remaining} dari ${o.quota} UMKM`}
        />
        <Meta label="Terima barang" value={summarizeSchedule(o.receiving_schedule)} />
        <Meta label="Berlaku sampai" value={formatDate(o.valid_until)} />
      </dl>

      {side === "store" && (
        <div
          className={cn(
            "-mx-5 -mb-5 flex items-center justify-between border-t px-5 py-3 text-sm",
            newApps > 0 ? "bg-primary/5 font-medium text-primary" : "text-muted-foreground"
          )}
        >
          {newApps > 0 ? `${newApps} pengajuan baru` : "Tidak ada pengajuan baru"}
          <IconArrowRight className="size-4" />
        </div>
      )}

      {side === "umkm" && o.my_application && (
        <div className="-mx-5 -mb-5 flex items-center justify-between gap-3 border-t bg-muted/50 px-5 py-3">
          <span className="text-xs font-semibold tracking-widest uppercase">Sudah diajukan</span>
          <ApplicationStatusChip status={o.my_application.status} />
        </div>
      )}
    </Link>
  )
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">{label}</dt>
      <dd className="[overflow-wrap:anywhere]">{value}</dd>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

export function counterpartOf(a: Application, viewer: Role) {
  return viewer === "store"
    ? { name: a.umkm.business_name, kind: "umkm" as const }
    : { name: a.store.name, kind: "store" as const }
}

export function ApplicationCard({
  application: a,
  viewer,
  showSlot = true,
  inset,
}: {
  application: Application
  viewer: Role
  showSlot?: boolean
  inset?: boolean
}) {
  const cp = counterpartOf(a, viewer)
  const approved = a.items.filter((i) => i.decision === "approved").length
  const decided = a.items.some((i) => i.decision !== "pending")
  return (
    <Link
      href={`/kerja-sama/${a.id}`}
      className={cn(cardBase, "flex gap-4 p-5 hover:bg-background/70", inset && insetClass)}
    >
      <Thumb kind={cp.kind} className={cn(inset && "bg-background")} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <p className="truncate font-medium">{cp.name}</p>
          <ApplicationStatusChip status={a.status} />
        </div>
        <p className="truncate text-sm text-muted-foreground">{a.opportunity.title}</p>
        <p className="text-sm">
          {a.items.length} produk{decided && ` · ${approved} disetujui`}
        </p>
        {showSlot && a.delivery_slot && ["approved", "in_delivery"].includes(a.status) && (
          <SlotLine slot={a.delivery_slot} />
        )}
        <p className="text-xs text-muted-foreground">Diperbarui {formatRelative(a.updated_at)}</p>
      </div>
    </Link>
  )
}

function SlotLine({ slot }: { slot: NonNullable<Application["delivery_slot"]> }) {
  const tag = upcomingDayLabel(slot.date)
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-sm">
      <IconCalendarEvent className="size-4 text-muted-foreground" stroke={1.75} />
      {formatDate(slot.date)} · {formatTimeRange(slot.start, slot.end)}
      {tag && <StatusChip tone="info">{tag}</StatusChip>}
    </p>
  )
}

/** Compact row for "Jadwal antar mendatang". */
export function DeliveryRow({ application: a, viewer }: { application: Application; viewer: Role }) {
  const slot = a.delivery_slot!
  const tag = upcomingDayLabel(slot.date)
  const cp = counterpartOf(a, viewer)
  const count = a.items.filter((i) => i.decision === "approved").length
  return (
    <Link
      href={`/kerja-sama/${a.id}`}
      className="flex items-start gap-4 border-b py-4 outline-none last:border-0 hover:bg-muted/40 focus-visible:bg-muted/60"
    >
      <div className="flex w-14 shrink-0 flex-col items-center bg-muted py-2 text-center">
        <span className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
          {formatDate(slot.date).split(",")[0]}
        </span>
        <span className="text-xl font-medium tabular-nums">{formatDate(slot.date, { weekday: false }).split(" ")[0]}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="truncate font-medium">{cp.name}</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums">
            <IconClock className="size-3.5 text-muted-foreground" />
            {formatTimeRange(slot.start, slot.end)}
          </span>
          {tag && <StatusChip tone="info">{tag}</StatusChip>}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">{count} produk</span>
          <ApplicationStatusChip status={a.status} />
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Product
// ---------------------------------------------------------------------------

export function ProductCard({
  product: p,
  href,
  menu,
}: {
  product: Product
  href: string
  menu?: { label: string; onSelect: () => void; destructive?: boolean }[]
}) {
  return (
    <div className={cn(cardBase, "relative flex gap-4 p-5", !p.is_active && "opacity-80")}>
      <Thumb kind="product" size="lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start gap-2 pr-8">
          <Link href={href} className="font-medium outline-none after:absolute after:inset-0 hover:underline">
            {p.name}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="bg-muted px-2 py-0.5 text-foreground/80">{p.category.name}</span>
          {!p.is_active && <StatusChip tone="neutral">Diarsipkan</StatusChip>}
        </div>
        <dl className="mt-1 grid grid-cols-[repeat(3,minmax(0,1fr))] gap-3 text-sm">
          <Meta label="Harga setor" value={formatRupiah(p.base_price)} />
          <Meta label="Harga jual" value={formatRupiah(p.suggested_retail_price)} />
          <Meta
            label="Masa simpan"
            value={p.shelf_life_days ? formatShelfLife(p.shelf_life_days) : formatDate(p.expiry_date!, { weekday: false })}
          />
        </dl>
        <p className="text-xs text-muted-foreground">
          {p.active_placements > 0 ? `Dijual di ${p.active_placements} toko` : "Belum dijual di toko"}
        </p>
      </div>
      {menu && (
        <div className="absolute top-3 right-3 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-8 items-center justify-center outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
              aria-label={`Menu ${p.name}`}
            >
              <IconDotsVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {menu.map((m) => (
                <DropdownMenuItem
                  key={m.label}
                  variant={m.destructive ? "destructive" : "default"}
                  onClick={m.onSelect}
                >
                  {m.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

export function StockRowItem({ row, viewer, inset }: { row: StockRow; viewer: Role; inset?: boolean }) {
  const editable = viewer === "store"
  const out = row.stock_status === "out_of_stock"
  const counterpart = viewer === "store" ? row.umkm.business_name : row.store.name
  return (
    <div
      className={cn(
        cardBase,
        "flex flex-col gap-4 p-5 sm:flex-row sm:items-center",
        inset && insetClass,
        viewer === "umkm" && out && "bg-destructive/5 ring-destructive/15"
      )}
    >
      <Link
        href={`/kerja-sama/${row.application_id}`}
        className="flex min-w-0 flex-1 items-center gap-4 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <Thumb kind="product" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="truncate font-medium">{row.product.name}</p>
          <p className="truncate text-sm text-muted-foreground">{counterpart}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="text-sm text-foreground">{formatRupiah(row.sell_price)}</span>
            <span>·</span>
            <span>Diperbarui {formatRelative(row.stock_updated_at)}</span>
          </div>
          {viewer === "umkm" && out && (
            <p className="text-sm font-medium text-destructive">Hubungi toko untuk kirim ulang</p>
          )}
        </div>
      </Link>
      {editable ? (
        <StockControl row={row} />
      ) : (
        <StockChip status={row.stock_status} quantity={row.stock_quantity} mode={row.stock_mode} />
      )}
    </div>
  )
}

/** Store-side stock control: count stepper (autosave 1s) or Ada/Habis switch. */
export function StockControl({ row }: { row: Pick<StockRow, "stock_mode" | "stock_quantity" | "stock_status" | "umkm"> }) {
  const [qty, setQty] = React.useState(row.stock_quantity ?? 0)
  const [available, setAvailable] = React.useState(row.stock_status === "available")
  const [confirm, setConfirm] = React.useState<null | { revert: () => void; apply: () => void }>(null)
  const saved = React.useRef(row.stock_quantity ?? 0)
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  const save = () => toast.add({ title: "Stok diperbarui.", type: "success" })

  const changeQty = (next: number) => {
    setQty(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (next === saved.current) return
      if (next === 0) {
        setConfirm({
          apply: () => {
            saved.current = 0
            save()
          },
          revert: () => setQty(saved.current),
        })
        return
      }
      saved.current = next
      save()
    }, 1000)
  }

  React.useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div className="flex items-center justify-between gap-4 sm:justify-end">
      {row.stock_mode === "count" ? (
        <>
          <StockChip status={qty === 0 ? "out_of_stock" : "available"} quantity={qty} mode="count" />
          <NumberStepper value={qty} onChange={changeQty} min={0} max={999} label="Jumlah stok" />
        </>
      ) : (
        <label className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase">
          <span className={cn(!available && "text-destructive")}>{available ? "Ada" : "Habis"}</span>
          <Switch
            checked={available}
            onCheckedChange={(checked) => {
              if (!checked) {
                setAvailable(false)
                setConfirm({ apply: save, revert: () => setAvailable(true) })
              } else {
                setAvailable(true)
                save()
              }
            }}
          />
        </label>
      )}
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && confirm) {
            confirm.revert()
            setConfirm(null)
          }
        }}
        title="Tandai habis?"
        description={`${row.umkm.business_name} akan menerima notifikasi untuk kirim ulang.`}
        confirmLabel="Ya, tandai habis"
        onConfirm={() => {
          confirm?.apply()
          setConfirm(null)
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------

const NOTIFICATION_ICON: Record<NotificationType, { icon: Icon; className: string }> = {
  application_submitted: { icon: IconMailDown, className: "bg-primary/10 text-primary" },
  application_approved: { icon: IconCircleCheck, className: "bg-success/10 text-success" },
  application_rejected: { icon: IconCircleX, className: "bg-destructive/10 text-destructive" },
  application_status_changed: { icon: IconTruckDelivery, className: "bg-muted text-foreground" },
  stock_out: { icon: IconBoxOff, className: "bg-destructive/10 text-destructive" },
}

export function NotificationCard({
  notification: n,
  onOpen,
}: {
  notification: AppNotification
  onOpen: (n: AppNotification) => void
}) {
  const meta = NOTIFICATION_ICON[n.type]
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={cn(
        "flex w-full items-start gap-4 border-b px-5 py-4 text-left transition-colors outline-none last:border-0 hover:bg-muted/40 focus-visible:bg-muted/60",
        !n.is_read && "bg-primary/[0.03]"
      )}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center", meta.className)}>
        <meta.icon className="size-5" stroke={1.75} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cn("text-sm", !n.is_read && "font-semibold")}>{n.title}</span>
        <span className="text-sm text-muted-foreground">{n.body}</span>
        <span className="text-xs text-muted-foreground">{formatRelative(n.created_at)}</span>
      </span>
      {!n.is_read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Belum dibaca" />}
    </button>
  )
}

