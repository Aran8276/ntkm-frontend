"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconCopy,
  IconInfoCircle,
  IconShieldCheck,
  IconTrash,
  IconX,
  type Icon,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatDateTime, formatRelative, initials } from "@/lib/format"
import type {
  AccountStatus,
  AdminLevel,
  AuditAction,
  CreatedBy,
  EmailStatus,
  TargetType,
  VerificationStatus,
} from "@/lib/admin-types"
import type { Role } from "@/lib/types"
import { AUDIT_LOGS } from "@/lib/admin-mock"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/toast"
import { Section } from "@/components/app/blocks"
import { StatusChip, type Tone } from "@/components/app/status"

// ---------------------------------------------------------------------------
// Chips
// ---------------------------------------------------------------------------

export const ACCOUNT_STATUS: Record<AccountStatus, { label: string; tone: Tone }> = {
  invited: { label: "Diundang", tone: "info" },
  active: { label: "Aktif", tone: "success" },
  suspended: { label: "Disuspend", tone: "danger" },
}

export function AccountStatusChip({ status }: { status: AccountStatus }) {
  return <StatusChip tone={ACCOUNT_STATUS[status].tone}>{ACCOUNT_STATUS[status].label}</StatusChip>
}

export const ADMIN_LEVEL: Record<AdminLevel, { label: string; tone: Tone }> = {
  superadmin: { label: "Superadmin", tone: "violet" },
  staff: { label: "Staff", tone: "neutral" },
}

export function AdminLevelChip({ level }: { level: AdminLevel }) {
  return <StatusChip tone={ADMIN_LEVEL[level].tone}>{ADMIN_LEVEL[level].label}</StatusChip>
}

export const VERIFICATION: Record<VerificationStatus, { label: string; tone: Tone }> = {
  unverified: { label: "Belum diisi", tone: "neutral" },
  pending: { label: "Menunggu", tone: "warning" },
  verified: { label: "Terverifikasi", tone: "success" },
  rejected: { label: "Ditolak", tone: "danger" },
}

export function VerificationChip({ status, children }: { status: VerificationStatus; children?: React.ReactNode }) {
  return <StatusChip tone={VERIFICATION[status].tone}>{children ?? VERIFICATION[status].label}</StatusChip>
}

/** Three tiny NIB · PIRT · Halal chips coloured by verification status. */
export function LegalStatusChips({
  verification,
}: {
  verification: Record<"nib" | "pirt" | "halal", VerificationStatus>
}) {
  return (
    <span className="flex gap-1">
      {(["nib", "pirt", "halal"] as const).map((k) => (
        <Tooltip key={k}>
          <TooltipTrigger render={<span />}>
            <VerificationChip status={verification[k]}>{k === "halal" ? "Halal" : k.toUpperCase()}</VerificationChip>
          </TooltipTrigger>
          <TooltipContent>
            {k === "halal" ? "Halal" : k.toUpperCase()}: {VERIFICATION[verification[k]].label}
          </TooltipContent>
        </Tooltip>
      ))}
    </span>
  )
}

export const EMAIL_STATUS: Record<EmailStatus, { label: string; tone: Tone }> = {
  pending: { label: "Menunggu", tone: "neutral" },
  sent: { label: "Terkirim", tone: "success" },
  failed: { label: "Gagal", tone: "danger" },
  skipped: { label: "Tanpa email", tone: "neutral" },
}

export function EmailStatusChip({ status }: { status: EmailStatus }) {
  return <StatusChip tone={EMAIL_STATUS[status].tone}>{EMAIL_STATUS[status].label}</StatusChip>
}

export function OverrideMark({ label = true }: { label?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 bg-warning/15 px-1.5 py-1 text-[0.625rem] leading-none font-semibold tracking-widest text-[color-mix(in_oklch,var(--warning),var(--foreground)_35%)] uppercase">
      <IconShieldCheck className="size-3" />
      {label && "Admin"}
    </span>
  )
}

export function CreatorChip({ createdBy, kind }: { createdBy: CreatedBy; kind: "toko" | "UMKM" }) {
  return createdBy.is_admin ? (
    <StatusChip tone="violet">Dibuat oleh admin</StatusChip>
  ) : (
    <StatusChip tone="neutral">Dibuat oleh {kind}</StatusChip>
  )
}

export function DeletedChip() {
  return (
    <StatusChip tone="neutral" className="before:hidden">
      <IconTrash className="size-3" /> Dihapus
    </StatusChip>
  )
}

const ROLE_LABEL: Record<Role, string> = { store: "Toko", umkm: "UMKM" }

export function RoleChips({ roles }: { roles: Role[] }) {
  if (!roles.length) return <span className="text-xs text-muted-foreground">Tanpa peran</span>
  return (
    <span className="flex gap-1">
      {roles.map((r) => (
        <span key={r} className="border px-1.5 py-1 text-[0.625rem] leading-none font-semibold tracking-widest uppercase">
          {ROLE_LABEL[r]}
        </span>
      ))}
    </span>
  )
}

export function ActiveChip({ active }: { active: boolean }) {
  return active ? <StatusChip tone="success">Aktif</StatusChip> : <StatusChip tone="neutral">Diarsipkan</StatusChip>
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

/** "—" for null values. */
export function Dash() {
  return <span className="text-muted-foreground">—</span>
}

/** Absolute timestamp; relative time in a tooltip. */
export function DateTime({ value, className }: { value: string | null | undefined; className?: string }) {
  if (!value) return <Dash />
  return (
    <Tooltip>
      <TooltipTrigger render={<time dateTime={value} className={cn("tabular-nums", className)} />}>
        {formatDateTime(value)}
      </TooltipTrigger>
      <TooltipContent>{formatRelative(value)}</TooltipContent>
    </Tooltip>
  )
}

/** First 8 chars of a UUID in mono + copy-full-id button. */
export function IdCell({ id, className }: { id: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <code className="font-mono text-xs text-muted-foreground">{id.slice(0, 8)}</code>
      <button
        type="button"
        aria-label="Salin ID lengkap"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          navigator.clipboard?.writeText(id).catch(() => {})
          toast.add({ title: "ID disalin.", type: "success" })
        }}
        className="relative z-10 inline-flex size-6 items-center justify-center text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <IconCopy className="size-3.5" />
      </button>
    </span>
  )
}

export function BoolIcon({ value, label }: { value: boolean; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-5 items-center justify-center",
        value ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
      )}
      aria-label={label ? `${label}: ${value ? "ya" : "tidak"}` : value ? "Ya" : "Tidak"}
    >
      {value ? <IconCheck className="size-3.5" /> : <IconX className="size-3.5" />}
    </span>
  )
}

export function EmailLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      onClick={(e) => e.stopPropagation()}
      className="relative z-10 text-primary underline-offset-4 hover:underline"
    >
      {email}
    </a>
  )
}

/** "0812…" → https://wa.me/62812… */
export function PhoneLink({ phone }: { phone: string }) {
  const intl = phone.replace(/\D/g, "").replace(/^0/, "62")
  return (
    <a
      href={`https://wa.me/${intl}`}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="relative z-10 text-primary tabular-nums underline-offset-4 hover:underline"
    >
      {phone}
    </a>
  )
}

/** Before (struck, red) → after (green). */
export function ChangeValue({ before, after }: { before: string | null; after: string | null }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2 font-mono text-xs">
      <del className="bg-destructive/10 px-1.5 py-0.5 text-destructive">{before ?? "null"}</del>
      <IconArrowRight className="size-3 text-muted-foreground" />
      <ins className="bg-success/10 px-1.5 py-0.5 text-success no-underline">{after ?? "null"}</ins>
    </span>
  )
}

export function Avatar({ name, size = "default" }: { name: string; size?: "sm" | "default" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold tracking-wider text-foreground/80",
        size === "sm" && "size-7 text-[0.625rem]",
        size === "default" && "size-9 text-xs",
        size === "lg" && "size-14 text-base"
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

/** Link that keeps the cell clickable as its own target inside clickable rows. */
export function CellLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className={cn("relative z-10 underline-offset-4 hover:text-primary hover:underline", className)}
    >
      {children}
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Layout pieces
// ---------------------------------------------------------------------------

/** Detail page grid: left 2/3 data, right 1/3 actions & history. */
export function DetailColumns({ main, aside }: { main: React.ReactNode; aside: React.ReactNode }) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-6 xl:col-span-2">{main}</div>
      <div className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-24">{aside}</div>
    </div>
  )
}

/** Label/value grid inside cards. */
export function DataList({
  items,
  columns = 2,
}: {
  items: { label: React.ReactNode; value: React.ReactNode; full?: boolean }[]
  columns?: 1 | 2 | 3
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-8 gap-y-5",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3"
      )}
    >
      {items.map((it, i) => (
        <div key={i} className={cn("flex min-w-0 flex-col gap-1.5", it.full && "sm:col-span-full")}>
          <dt className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">{it.label}</dt>
          <dd className="text-sm [overflow-wrap:anywhere]">{it.value ?? <Dash />}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Banner({
  tone = "neutral",
  icon: Ico,
  children,
  action,
}: {
  tone?: "neutral" | "info" | "danger" | "warning"
  icon?: Icon
  children: React.ReactNode
  action?: React.ReactNode
}) {
  const DefaultIcon = tone === "danger" || tone === "warning" ? IconAlertTriangle : tone === "neutral" ? IconTrash : IconInfoCircle
  const I = Ico ?? DefaultIcon
  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center gap-3 border-l-2 px-4 py-3 text-sm",
        tone === "neutral" && "border-muted-foreground/40 bg-foreground/5 text-foreground/80",
        tone === "info" && "border-primary bg-primary/5 text-foreground",
        tone === "danger" && "border-destructive bg-destructive/5 text-destructive",
        tone === "warning" && "border-warning bg-warning/10 text-foreground"
      )}
    >
      <I className="size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  )
}

/** Stack of full-width action buttons inside the right-hand "Aksi" card. */
export function ActionStack({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2 [&>*]:w-full [&>*]:justify-start">{children}</div>
}

// ---------------------------------------------------------------------------
// Audit labels + "Riwayat admin" card
// ---------------------------------------------------------------------------

export const AUDIT_ACTION_LABEL: Record<AuditAction, string> = {
  create: "Dibuat",
  update: "Diubah",
  delete: "Dihapus",
  restore: "Dipulihkan",
  hard_delete: "Dihapus permanen",
  invite: "Diundang",
  suspend: "Disuspend",
  activate: "Diaktifkan",
  grant_admin: "Diangkat admin",
  revoke_admin: "Akses admin dicabut",
  close: "Ditutup",
  reopen: "Dibuka ulang",
  force_status: "Status diubah paksa",
  stock_correction: "Stok dikoreksi",
  verify_legal: "Legalitas diputuskan",
  remove_file: "File dihapus",
  resend_email: "Email dikirim ulang",
  broadcast: "Pengumuman dikirim",
  export: "Data diekspor",
}

export const TARGET_LABEL: Record<TargetType, string> = {
  user: "Pengguna",
  store: "Toko",
  umkm: "UMKM",
  opportunity: "Peluang",
  product: "Produk",
  application: "Pengajuan",
  category: "Kategori",
  file: "File",
  notification: "Notifikasi",
}

export function AdminHistoryCard({ type, id }: { type: TargetType; id: string }) {
  const rows = AUDIT_LOGS.filter((l) => l.target_type === type && l.target_id === id).slice(0, 5)
  return (
    <Section
      title="Riwayat admin"
      action={
        rows.length ? (
          <Link
            href={`/admin/audit?target_type=${type}&target_id=${id}`}
            className="text-[0.6875rem] font-semibold tracking-widest text-primary uppercase hover:underline"
          >
            Lihat semua
          </Link>
        ) : undefined
      }
    >
      {rows.length ? (
        <ul className="-my-2 flex flex-col divide-y">
          {rows.map((l) => (
            <li key={l.id}>
              <Link href={`/admin/audit?id=${l.id}`} className="flex flex-col gap-1 py-3 outline-none hover:bg-muted/40 focus-visible:bg-muted">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{AUDIT_ACTION_LABEL[l.action]}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(l.created_at)}</span>
                </span>
                <span className="text-xs text-muted-foreground">oleh {l.admin.name}</span>
                {l.reason && <span className="truncate text-xs text-foreground/80">“{l.reason}”</span>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada tindakan admin pada data ini.</p>
      )}
    </Section>
  )
}

/** Card with big number + label, links to the filtered list (A02). */
export function StatCard({
  label,
  value,
  href,
  tone = "default",
  hint,
}: {
  label: string
  value: number | string
  href: string
  tone?: "default" | "alert" | "muted"
  hint?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-w-0 flex-col gap-3 bg-background p-5 shadow-sm ring-1 ring-foreground/5 transition-colors outline-none hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-ring/40",
        tone === "alert" && "bg-destructive/[0.04] ring-destructive/25"
      )}
    >
      <span className="flex items-start justify-between gap-2 text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
        {label}
        <IconArrowRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      <span
        className={cn(
          "text-3xl font-medium tabular-nums",
          tone === "alert" && "text-destructive",
          tone === "muted" && "text-muted-foreground"
        )}
      >
        {value}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Link>
  )
}

/** Underlined tab bar (state lives in the URL, owned by the caller). */
export function TabBar<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: React.ReactNode; count?: number; hidden?: boolean }[]
  className?: string
}) {
  return (
    <div role="tablist" className={cn("flex gap-1 overflow-x-auto border-b [scrollbar-width:none]", className)}>
      {options
        .filter((o) => !o.hidden)
        .map((o) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(o.value)}
              className={cn(
                "relative -mb-px flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-semibold tracking-widest whitespace-nowrap uppercase outline-none focus-visible:bg-background",
                active ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
              {o.count != null && o.count > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-[0.625rem] text-primary-foreground">
                  {o.count}
                </span>
              )}
            </button>
          )
        })}
    </div>
  )
}
