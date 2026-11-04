"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { IconCheck, IconX } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type {
  ApplicationStatus,
  Decision,
  Match,
  OpportunityStatus,
  StockRow,
} from "@/lib/types"

const chipVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 px-2 py-1 text-[0.625rem] leading-none font-semibold tracking-widest whitespace-nowrap uppercase before:size-1.5 before:shrink-0 before:rounded-full before:bg-current",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        info: "bg-primary/10 text-primary",
        success: "bg-success/10 text-success",
        warning: "bg-warning/15 text-[color-mix(in_oklch,var(--warning),var(--foreground)_35%)]",
        danger: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
)

export type Tone = NonNullable<VariantProps<typeof chipVariants>["tone"]>

export function StatusChip({
  tone,
  className,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof chipVariants>) {
  return <span data-slot="status-chip" className={cn(chipVariants({ tone }), className)} {...props} />
}

export const APPLICATION_STATUS: Record<ApplicationStatus, { label: string; tone: Tone }> = {
  submitted: { label: "Diajukan", tone: "neutral" },
  approved: { label: "Disetujui", tone: "info" },
  in_delivery: { label: "Dalam pengiriman", tone: "info" },
  received: { label: "Diterima toko", tone: "success" },
  completed: { label: "Selesai", tone: "success" },
  rejected: { label: "Ditolak", tone: "danger" },
  cancelled: { label: "Dibatalkan", tone: "danger" },
}

export function ApplicationStatusChip({ status, className }: { status: ApplicationStatus; className?: string }) {
  const s = APPLICATION_STATUS[status]
  return (
    <StatusChip tone={s.tone} className={className}>
      {s.label}
    </StatusChip>
  )
}

const DECISION: Record<Decision, { label: string; tone: Tone }> = {
  pending: { label: "Menunggu", tone: "neutral" },
  approved: { label: "Disetujui", tone: "success" },
  rejected: { label: "Ditolak", tone: "danger" },
}

export function DecisionChip({ decision }: { decision: Decision }) {
  return <StatusChip tone={DECISION[decision].tone}>{DECISION[decision].label}</StatusChip>
}

const OPPORTUNITY: Record<OpportunityStatus, { label: string; tone: Tone }> = {
  open: { label: "Dibuka", tone: "success" },
  full: { label: "Kuota penuh", tone: "warning" },
  closed: { label: "Ditutup", tone: "neutral" },
}

export function OpportunityStatusChip({ status }: { status: OpportunityStatus }) {
  return <StatusChip tone={OPPORTUNITY[status].tone}>{OPPORTUNITY[status].label}</StatusChip>
}

export function StockChip({
  status,
  quantity,
  mode,
}: {
  status: StockRow["stock_status"]
  quantity?: number | null
  mode?: StockRow["stock_mode"]
}) {
  if (status === "out_of_stock") return <StatusChip tone="danger">Habis</StatusChip>
  return (
    <StatusChip tone="success">
      {mode === "count" && quantity != null ? `Ada · ${quantity}` : "Ada"}
    </StatusChip>
  )
}

const MATCH = {
  high: { label: "Sangat cocok", tone: "success" },
  medium: { label: "Cocok", tone: "warning" },
  low: { label: "Kurang cocok", tone: "neutral" },
} as const satisfies Record<Match["level"], { label: string; tone: Tone }>

export function MatchReasons({ reasons }: { reasons: Match["reasons"] }) {
  return (
    <ul className="flex flex-col gap-3">
      {reasons.map((r) => (
        <li key={r.label} className="flex items-start gap-3 text-sm">
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center",
              r.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}
          >
            {r.ok ? <IconCheck className="size-3.5" /> : <IconX className="size-3.5" />}
          </span>
          <span>{r.label}</span>
        </li>
      ))}
    </ul>
  )
}

/** Match badge; tapping opens the "Kenapa cocok?" bottom sheet. */
export function MatchBadge({
  match,
  size = "default",
  interactive = true,
}: {
  match: Match
  size?: "default" | "lg"
  interactive?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const m = MATCH[match.level]
  const chip = (
    <StatusChip tone={m.tone} className={cn(size === "lg" && "px-3 py-2 text-xs")}>
      {m.label} · {match.score}
    </StatusChip>
  )
  if (!interactive) return chip

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        className="relative z-10 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        aria-label={`${m.label}, skor ${match.score}. Lihat alasan`}
      >
        {chip}
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg">
          <SheetHeader>
            <SheetTitle>Kenapa cocok?</SheetTitle>
            <SheetDescription>
              Skor kecocokan {match.score} dari 100, dihitung dari kategori, jarak, legalitas, dan syarat toko.
            </SheetDescription>
            <div className="mt-4">
              <MatchReasons reasons={match.reasons} />
            </div>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  )
}

/** Three legal chips (NIB, PIRT, Halal) with check / cross. */
export function LegalChips({
  legal,
}: {
  legal: { has_nib: boolean; has_pirt: boolean; has_halal: boolean }
}) {
  const items = [
    { label: "NIB", ok: legal.has_nib },
    { label: "PIRT", ok: legal.has_pirt },
    { label: "Halal", ok: legal.has_halal },
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <span
          key={i.label}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 text-[0.625rem] font-semibold tracking-widest uppercase",
            i.ok ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
          )}
        >
          {i.ok ? <IconCheck className="size-3" /> : <IconX className="size-3" />}
          {i.label}
        </span>
      ))}
    </div>
  )
}
