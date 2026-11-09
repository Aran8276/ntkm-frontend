"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconArrowRight,
  IconBox,
  IconBuildingStore,
  IconPlant2,
  type Icon,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { initials } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

/** Page-level heading inside <main>: title, description, actions. */
export function PageHeading({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  eyebrow?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow && <p className="text-sm text-muted-foreground">{eyebrow}</p>}
        <h2 className="text-2xl font-semibold tracking-wider uppercase">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Card section with Sera-style uppercase title. */
export function Section({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  size,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
  contentClassName?: string
  size?: "default" | "sm"
}) {
  return (
    <Card size={size} className={cn("rounded-none max-sm:[--card-spacing:--spacing(5)]", className)}>
      {(title || description || action) && (
        <CardHeader>
          {title && <CardTitle className="text-base">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      {children && <CardContent className={contentClassName}>{children}</CardContent>}
    </Card>
  )
}

/** "Lihat semua" style link in section headers. */
export function SeeAll({ href, children = "Lihat semua" }: { href: string; children?: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold tracking-widest text-primary uppercase hover:underline"
    >
      {children}
      <IconArrowRight className="size-3.5" />
    </Link>
  )
}

/** Big tappable number (summary tiles on dashboards). */
export function StatTile({
  label,
  value,
  hint,
  href,
  highlight,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  href: string
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-2 bg-background p-5 shadow-sm ring-1 ring-foreground/5 transition-colors outline-none hover:bg-background/70 focus-visible:ring-2 focus-visible:ring-ring/40",
        highlight && "ring-primary/30"
      )}
    >
      <span className="flex items-start justify-between gap-2 text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
        {label}
        <IconArrowRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      <span className={cn("text-3xl font-medium tabular-nums", highlight && "text-primary")}>{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Link>
  )
}

/** Stat number, skeleton while its list is loading. */
export function Count({ n }: { n: number | undefined }) {
  return n == null ? <Skeleton className="inline-block h-8 w-10 align-middle" /> : <>{n}</>
}

/** Photo/logo square; falls back to an icon or initials when there is no image. */
export function Thumb({
  name,
  kind = "product",
  size = "default",
  src,
  className,
}: {
  name?: string
  kind?: "product" | "store" | "umkm" | "initials"
  size?: "sm" | "default" | "lg"
  /** Image URL from the API (`photo_url`, `logo_url`, `image_url`). */
  src?: string | null
  className?: string
}) {
  const icons: Record<string, Icon> = { product: IconBox, store: IconBuildingStore, umkm: IconPlant2 }
  const Ico = icons[kind]
  if (src)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user uploads served by the API host
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        className={cn(
          "shrink-0 bg-muted object-cover",
          size === "sm" && "size-9",
          size === "default" && "size-12",
          size === "lg" && "size-16",
          className
        )}
      />
    )
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-muted text-foreground/70",
        size === "sm" && "size-9",
        size === "default" && "size-12",
        size === "lg" && "size-16",
        className
      )}
      aria-hidden
    >
      {kind === "initials" || !Ico ? (
        <span className="text-xs font-semibold tracking-wider">{initials(name ?? "")}</span>
      ) : (
        <Ico className={cn(size === "lg" ? "size-6" : "size-4.5")} stroke={1.75} />
      )}
    </span>
  )
}

export function EmptyState({
  icon: Ico,
  children,
  action,
  className,
}: {
  icon: Icon
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <Empty className={cn("bg-background p-10 shadow-sm ring-1 ring-foreground/5", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Ico stroke={1.75} />
        </EmptyMedia>
        <EmptyDescription className="text-foreground/80">{children}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}

/** Inline empty line used inside dashboard sections. */
export function InlineEmpty({ children }: { children: React.ReactNode }) {
  return <p className="bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">{children}</p>
}

/** Single-select horizontally scrolling chips (filters). */
export function FilterChips<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: React.ReactNode; count?: number }[]
  className?: string
  label?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0", className)}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 border px-4 text-[0.6875rem] font-semibold tracking-widest whitespace-nowrap uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              active
                ? "border-foreground/15 bg-background text-foreground shadow-xs"
                : "border-transparent bg-background/60 text-muted-foreground hover:bg-background hover:text-foreground"
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

/** Label/value row, e.g. "Harga setor · Rp9.500". */
export function InfoRow({
  label,
  value,
  className,
}: {
  label: React.ReactNode
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

/** Small uppercase label used above values in tiles. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase", className)}>
      {children}
    </p>
  )
}

/** Confirmation dialog: question title, one-line impact, action-labelled primary button. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
  children?: React.ReactNode
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Floating action button (mobile), sits above the bottom nav. */
export function Fab({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="fixed right-4 bottom-20 z-30 inline-flex h-12 items-center gap-2 bg-primary px-5 text-xs font-semibold tracking-widest text-primary-foreground uppercase shadow-lg outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/40 lg:right-8 lg:bottom-8"
    >
      {children}
    </Link>
  )
}

/** Skeleton list matching card rows. */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 bg-background p-5 shadow-sm">
          <Skeleton className="size-12" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Full-page loading placeholder shaped like a detail page (header + cards). */
export function PageSkeleton() {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-muted">
      <div className="h-16 border-b bg-background" />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 lg:px-8">
        <Skeleton className="h-4 w-24 bg-background" />
        <Skeleton className="h-8 w-3/4 bg-background" />
        <Skeleton className="h-40 w-full bg-background" />
        <Skeleton className="h-64 w-full bg-background" />
      </div>
    </div>
  )
}

/** Detail-page skeleton for use inside <AppShell> while data loads. */
export function PageSkeletonBody() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-4 w-24 bg-background" />
      <Skeleton className="h-8 w-3/4 bg-background" />
      <Skeleton className="h-40 w-full bg-background" />
      <Skeleton className="h-64 w-full bg-background" />
    </div>
  )
}
