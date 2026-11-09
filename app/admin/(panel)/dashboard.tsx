"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconBox,
  IconInbox,
  IconRefresh,
  IconTargetArrow,
  IconUser,
  type Icon,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { addDaysIso, formatDateTime, formatRelative, todayIso } from "@/lib/format"
import { useApi } from "@/lib/use-api"
import type { ApplicationStatus } from "@/lib/types"
import type { ActivityItem, Dashboard as DashboardData } from "@/lib/admin-types"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadError } from "@/components/app/feedback"
import { useAdmin } from "@/components/admin/admin-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { useQueryState } from "@/hooks/use-query-state"
import { Eyebrow, InlineEmpty, Section } from "@/components/app/blocks"
import { APPLICATION_STATUS } from "@/components/app/status"
import { AdminPage } from "@/components/admin/admin-page"
import { StatCard } from "@/components/admin/admin-ui"

type Period = "7" | "30" | "pilot" | "custom"
const PERIODS: { value: Period; label: string }[] = [
  { value: "7", label: "7 hari" },
  { value: "30", label: "30 hari" },
  { value: "pilot", label: "Sejak pilot" },
  { value: "custom", label: "Rentang custom" },
]

const FLOW: ApplicationStatus[] = ["submitted", "approved", "in_delivery", "received", "completed"]
const TARGET_HREF: Record<string, string> = {
  application: "/admin/pengajuan/",
  user: "/admin/pengguna/",
  opportunity: "/admin/peluang/",
  product: "/admin/produk/",
}

const ACTIVITY_ICON: Record<ActivityItem["kind"], Icon> = {
  application: IconInbox,
  user: IconUser,
  opportunity: IconTargetArrow,
  product: IconBox,
}

/** A02 · Dashboard: `GET /admin/dashboard?from=&to=`. */
export function Dashboard() {
  const [TODAY] = React.useState(() => todayIso())
  const [period, setPeriod] = useQueryState<Period>("periode", "30")
  const [from, setFrom] = useQueryState<string>("from", addDaysIso(-30, new Date(`${TODAY}T12:00:00+07:00`)))
  const [to, setTo] = useQueryState<string>("to", TODAY)
  const [refreshing, setRefreshing] = React.useState(false)
  const { refreshBadges } = useAdmin()

  const range =
    period === "7"
      ? { from: addDaysIso(-7, new Date(`${TODAY}T12:00:00+07:00`)) }
      : period === "pilot"
        ? { from: "2020-01-01" }
        : period === "custom"
          ? { from, to }
          : {}
  const q = useApi<DashboardData>("admin", "/admin/dashboard", range)

  const refresh = async () => {
    setRefreshing(true)
    await q.reload()
    refreshBadges()
    setRefreshing(false)
    toast.add({ title: "Data diperbarui.", type: "success" })
  }

  if (!q.data)
    return (
      <AdminPage title="Dashboard">
        {q.error ? (
          <LoadError error={q.error} onRetry={q.reload} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-28 bg-background" />
            ))}
          </div>
        )}
      </AdminPage>
    )

  const d = q.data
  const a = d.attention
  const by = d.applications.by_status
  const max = Math.max(1, ...Object.values(by).map((n) => n ?? 0))
  const hasActivity = Object.values(by).some((n) => (n ?? 0) > 0)

  return (
    <AdminPage
      title="Dashboard"
      description={
        <span className="inline-flex items-center gap-2">
          Diperbarui {formatDateTime(d.updated_at)}
          <Button variant="ghost" size="icon-xs" onClick={() => void refresh()} aria-label="Muat ulang" disabled={refreshing}>
            {refreshing ? <Spinner /> : <IconRefresh />}
          </Button>
        </span>
      }
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Periode" className="flex bg-background p-1 shadow-xs ring-1 ring-foreground/5">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={period === p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "h-8 px-3 text-[0.6875rem] font-semibold tracking-widest whitespace-nowrap uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                  period === p.value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex items-center gap-2">
              <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="w-36" aria-label="Dari" />
              <span className="text-muted-foreground">–</span>
              <Input type="date" value={to} min={from} max={TODAY} onChange={(e) => setTo(e.target.value)} className="w-36" aria-label="Sampai" />
            </div>
          )}
        </div>
      }
    >
      <Group title="Perlu perhatian">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Legalitas menunggu verifikasi" value={a.legal_pending} href="/admin/verifikasi" tone={a.legal_pending ? "alert" : "muted"} />
          <StatCard
            label="Pengajuan menunggu > 48 jam"
            value={a.applications_waiting_over_48h}
            href="/admin/pengajuan?view=waiting"
            tone={a.applications_waiting_over_48h ? "alert" : "muted"}
          />
          <StatCard label="Antar hari ini" value={a.deliveries_today} href="/admin/pengajuan?view=today" tone={a.deliveries_today ? "alert" : "muted"} />
          <StatCard
            label="Email gagal 24 jam"
            value={a.emails_failed_24h}
            href="/admin/notifikasi?email_status=failed"
            tone={a.emails_failed_24h ? "alert" : "muted"}
          />
        </div>
      </Group>

      <Group title="Pengguna">
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total akun" value={d.users.total} href="/admin/pengguna" />
          <StatCard label="Toko" value={d.users.store} href="/admin/toko" />
          <StatCard label="UMKM" value={d.users.umkm} href="/admin/umkm" />
          <StatCard label="Diundang" value={d.users.invited} href="/admin/pengguna?status=invited" hint="Belum pernah masuk" />
          <StatCard label="Disuspend" value={d.users.suspended} href="/admin/pengguna?status=suspended" />
        </div>
      </Group>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,2fr)]">
        <Group title="Peluang & produk">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Peluang dibuka" value={d.opportunities.open} href="/admin/peluang?status=open" />
            <StatCard label="Kuota penuh" value={d.opportunities.full} href="/admin/peluang?status=full" />
            <StatCard label="Ditutup" value={d.opportunities.closed} href="/admin/peluang?status=closed" />
            <StatCard label="Produk aktif" value={d.products.active} href="/admin/produk?is_active=true" />
            <StatCard label="Diarsipkan" value={d.products.archived} href="/admin/produk?is_active=false" />
          </div>
        </Group>
        <Group title="Stok">
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Item di rak" value={d.stock.items_on_shelf} href="/admin/stok" />
            <StatCard label="Stok habis" value={d.stock.out_of_stock} href="/admin/stok?stock_status=out_of_stock" />
          </div>
        </Group>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Section title="Corong pengajuan" description="Jumlah pengajuan per status, urut alur kerja sama.">
          {hasActivity ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_12rem]">
              <div className="flex flex-col gap-1">
                {FLOW.map((s) => (
                  <FunnelBar key={s} status={s} value={by[s] ?? 0} max={max} />
                ))}
                <div className="my-2 border-t border-dashed" />
                {(["rejected", "cancelled"] as const).map((s) => (
                  <FunnelBar key={s} status={s} value={by[s] ?? 0} max={max} muted />
                ))}
              </div>
              <dl className="grid grid-cols-3 gap-4 lg:grid-cols-1 lg:content-start lg:border-l lg:pl-8">
                <Metric label="Pengajuan baru" value={String(d.applications.created_in_period)} hint="dalam periode" />
                <Metric label="Tingkat persetujuan" value={d.applications.approval_rate == null ? "—" : `${d.applications.approval_rate}%`} />
                <Metric
                  label="Median waktu tinjau"
                  value={
                    d.applications.median_hours_to_review == null
                      ? "—"
                      : `${String(Math.round(d.applications.median_hours_to_review * 10) / 10).replace(".", ",")} jam`
                  }
                />
              </dl>
            </div>
          ) : (
            <InlineEmpty>Belum ada aktivitas pada periode ini.</InlineEmpty>
          )}
        </Section>

        <Section title="Aktivitas terbaru">
          {d.recent_activity.length ? (
            <ul className="-my-2 flex flex-col divide-y">
              {d.recent_activity.map((item, i) => {
                const Ico = ACTIVITY_ICON[item.kind] ?? IconInbox
                const href = TARGET_HREF[item.target.type] ? `${TARGET_HREF[item.target.type]}${item.target.id}` : "/admin"
                return (
                  <li key={`${item.target.id}-${item.created_at}-${i}`}>
                    <Link href={href} className="flex items-start gap-3 py-3 outline-none hover:bg-muted/40 focus-visible:bg-muted">
                      <span className="flex size-8 shrink-0 items-center justify-center bg-muted">
                        <Ico className="size-4" stroke={1.75} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-sm">{item.label}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatDateTime(item.created_at)} · {formatRelative(item.created_at)}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <InlineEmpty>Belum ada aktivitas pada periode ini.</InlineEmpty>
          )}
        </Section>
      </div>
    </AdminPage>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <Eyebrow>{title}</Eyebrow>
      {children}
    </section>
  )
}

function FunnelBar({ status, value, max, muted }: { status: ApplicationStatus; value: number; max: number; muted?: boolean }) {
  return (
    <Link
      href={`/admin/pengajuan?status=${status}`}
      className="group grid grid-cols-[9rem_minmax(0,1fr)_2.5rem] items-center gap-3 py-1.5 outline-none focus-visible:bg-muted"
    >
      <span className="truncate text-sm text-foreground/80 group-hover:text-foreground">{APPLICATION_STATUS[status].label}</span>
      <span className="h-6 bg-muted">
        <span
          className={cn("block h-full transition-colors", muted ? "bg-muted-foreground/40" : "bg-primary group-hover:bg-primary/80")}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </span>
      <span className="text-right text-sm font-medium tabular-nums">{value}</span>
    </Link>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">{label}</dt>
      <dd className="text-2xl font-medium tabular-nums">{value}</dd>
      {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
    </div>
  )
}
