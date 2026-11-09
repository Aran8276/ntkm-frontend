"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconArrowRight, IconMapPin } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { DAYS, DAY_LABEL, formatDate, formatTimeRange } from "@/lib/format"
import type { AdminApplicationRow, AuditLog } from "@/lib/admin-types"
import type { OperatingHour } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApplicationStatusChip } from "@/components/app/status"
import { AUDIT_ACTION_LABEL, DateTime, Dash, OverrideMark, TARGET_LABEL } from "@/components/admin/admin-ui"

/** Clickable compact table used inside detail pages. */
export function MiniTable<T>({
  rows,
  rowKey,
  rowHref,
  columns,
  empty,
}: {
  rows: T[]
  rowKey: (r: T) => string
  rowHref?: (r: T) => string
  columns: { header: string; cell: (r: T) => React.ReactNode; className?: string }[]
  empty: string
}) {
  const router = useRouter()
  if (!rows.length) return <p className="bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">{empty}</p>
  return (
    <div className="-mx-(--card-spacing,1.5rem)">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((c) => (
              <TableHead key={c.header} className={cn("first:pl-(--card-spacing,1.5rem) last:pr-(--card-spacing,1.5rem)", c.className)}>
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const href = rowHref?.(r)
            return (
              <TableRow
                key={rowKey(r)}
                className={href ? "cursor-pointer" : undefined}
                onClick={(e) => {
                  if (!href || (e.target as HTMLElement).closest("a,button")) return
                  if (e.metaKey || e.ctrlKey) window.open(href, "_blank")
                  else router.push(href)
                }}
              >
                {columns.map((c) => (
                  <TableCell key={c.header} className={cn("first:pl-(--card-spacing,1.5rem) last:pr-(--card-spacing,1.5rem)", c.className)}>
                    {c.cell(r)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export function slotLabel(a: Pick<AdminApplicationRow, "delivery_slot">) {
  return a.delivery_slot ? `${formatDate(a.delivery_slot.date)}, ${formatTimeRange(a.delivery_slot.start, a.delivery_slot.end)}` : null
}

/** Applications list (A04 Kerja sama, A10 Pengajuan). */
export function ApplicationsMiniTable({
  rows,
  counterpart,
  showProducts,
}: {
  rows: AdminApplicationRow[]
  counterpart: "store" | "umkm"
  showProducts?: boolean
}) {
  return (
    <MiniTable
      rows={rows}
      rowKey={(a) => a.id}
      rowHref={(a) => `/admin/pengajuan/${a.id}`}
      empty="Belum ada pengajuan."
      columns={[
        { header: "Diajukan", cell: (a) => <DateTime value={a.created_at} /> },
        {
          header: counterpart === "store" ? "Toko" : "UMKM",
          cell: (a) => (counterpart === "store" ? a.store.name : a.umkm.business_name),
        },
        ...(showProducts
          ? [
              {
                header: "Produk",
                cell: (a: AdminApplicationRow) => `${a.items_count} produk${a.approved_count ? ` · ${a.approved_count} disetujui` : ""}`,
              },
            ]
          : [{ header: "Peluang", cell: (a: AdminApplicationRow) => <span className="block max-w-56 truncate">{a.opportunity.title}</span> }]),
        {
          header: "Status",
          cell: (a) => (
            <span className="flex items-center gap-1.5">
              <ApplicationStatusChip status={a.status} />
              {a.has_override && <OverrideMark label={false} />}
            </span>
          ),
        },
        { header: "Slot antar", cell: (a) => slotLabel(a) ?? <Dash /> },
        { header: "Diperbarui", cell: (a) => <DateTime value={a.updated_at} /> },
      ]}
    />
  )
}

/** Audit rows (A04 Aktivitas). */
export function AuditMiniTable({ rows, empty = "Belum ada tindakan admin." }: { rows: AuditLog[]; empty?: string }) {
  return (
    <MiniTable
      rows={rows}
      rowKey={(l) => l.id}
      rowHref={(l) => `/admin/audit?id=${l.id}`}
      empty={empty}
      columns={[
        { header: "Waktu", cell: (l) => <DateTime value={l.created_at} /> },
        { header: "Admin", cell: (l) => l.admin.name },
        { header: "Aksi", cell: (l) => AUDIT_ACTION_LABEL[l.action] ?? l.action },
        {
          header: "Objek",
          cell: (l) => (
            <span className="flex flex-col">
              <span className="text-xs text-muted-foreground">{TARGET_LABEL[l.target_type] ?? l.target_type}</span>
              <span className="max-w-56 truncate">{l.target_label}</span>
            </span>
          ),
        },
        { header: "Alasan", cell: (l) => <span className="block max-w-72 truncate text-muted-foreground">{l.reason || "—"}</span> },
      ]}
    />
  )
}

/** Read-only map placeholder (Leaflet in production). */
export function StaticMap({ lat, lng, className }: { lat: number; lng: number; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex aspect-[16/7] items-center justify-center overflow-hidden bg-muted bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:28px_28px]",
        className
      )}
    >
      <span className="absolute top-[38%] left-0 h-3 w-full -rotate-6 bg-background/90" />
      <span className="absolute top-0 left-[58%] h-full w-2.5 rotate-12 bg-background/90" />
      <IconMapPin className="relative z-10 size-8 -translate-y-3 fill-primary/20 text-primary" />
      <span className="absolute right-2 bottom-2 bg-background/90 px-2 py-1 font-mono text-[0.625rem] text-muted-foreground">
        {lat.toFixed(4)}, {lng.toFixed(4)}
      </span>
    </div>
  )
}

export function OperatingHoursTable({ hours }: { hours: OperatingHour[] }) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
      {DAYS.map((d) => {
        const h = hours.find((x) => x.day === d)
        return (
          <React.Fragment key={d}>
            <dt className="text-muted-foreground">{DAY_LABEL[d]}</dt>
            <dd className={cn("tabular-nums", (!h || h.is_closed) && "text-muted-foreground")}>
              {!h || h.is_closed ? "Tutup" : formatTimeRange(h.open, h.close)}
            </dd>
          </React.Fragment>
        )
      })}
    </dl>
  )
}

/** Small linked stat inside detail cards. */
export function MiniStats({ items }: { items: { label: string; value: React.ReactNode; href?: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
      {items.map((i) => {
        const inner = (
          <>
            <span className="flex items-center justify-between gap-2 text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
              {i.label}
              {i.href && <IconArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />}
            </span>
            <span className="text-2xl font-medium tabular-nums">{i.value}</span>
          </>
        )
        return i.href ? (
          <Link key={i.label} href={i.href} className="group flex flex-col gap-2 bg-background p-4 outline-none hover:bg-muted/40 focus-visible:bg-muted">
            {inner}
          </Link>
        ) : (
          <div key={i.label} className="flex flex-col gap-2 bg-background p-4">
            {inner}
          </div>
        )
      })}
    </div>
  )
}
