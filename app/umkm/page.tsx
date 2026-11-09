"use client"

import Link from "next/link"
import { IconAlertTriangle, IconArrowRight, IconCheck } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatToday } from "@/lib/format"
import type { Paginated } from "@/lib/api"
import { useApi, useNow } from "@/lib/use-api"
import type { Application, Opportunity, Product, StockRow, UmkmProfile } from "@/lib/types"
import { buttonVariants } from "@/components/ui/button"
import { AppShell } from "@/components/app/app-shell"
import { Count, InlineEmpty, ListSkeleton, PageHeading, Section, SeeAll, StatTile } from "@/components/app/blocks"
import { DeliveryRow, OpportunityCard, StockRowItem } from "@/components/app/cards"
import { LoadError } from "@/components/app/feedback"
import { useSession } from "@/components/app/providers"

type Apps = Paginated<Application>

/** P12 · Beranda UMKM. */
export default function UmkmHomePage() {
  const { me } = useSession()
  const now = useNow()
  const all = useApi<Apps>("user", "/applications", { as: "umkm", page_size: 1 })
  const submitted = useApi<Apps>("user", "/applications", { as: "umkm", status: "submitted", page_size: 1 })
  const approved = useApi<Apps>("user", "/applications", { as: "umkm", status: "approved", page_size: 1 })
  const received = useApi<Apps>("user", "/applications", { as: "umkm", status: "received", page_size: 1 })
  const upcomingQ = useApi<Apps>("user", "/applications", {
    as: "umkm",
    status: "approved,in_delivery",
    ordering: "delivery_slot_start",
    page_size: 100,
  })
  const outQ = useApi<Paginated<StockRow>>("user", "/stock", { as: "umkm", stock_status: "out_of_stock", page_size: 3 })
  const matchesQ = useApi<Paginated<Opportunity>>("user", "/opportunities", { match: "high", sort: "match", page_size: 3 })
  const products = useApi<Paginated<Product>>("user", "/me/products", { page_size: 1 })
  const profile = useApi<UmkmProfile>("user", "/me/umkm-profile")

  const upcoming = (upcomingQ.data?.results ?? []).filter((a) => a.delivery_slot)
  const outOfStock = outQ.data?.results ?? []
  const matches = matchesQ.data?.results ?? []

  const steps = [
    { label: "Lengkapi profil usaha", done: true, href: "/profil/umkm" },
    { label: "Tambah produk pertama", done: (products.data?.count ?? 1) > 0, href: "/umkm/produk/baru" },
    { label: "Ajukan ke peluang pertama", done: (all.data?.count ?? 1) > 0, href: "/umkm/peluang" },
  ]
  const showSteps = steps.some((s) => !s.done)
  const legal = profile.data?.legal
  const legalGap = !!legal && (!legal.has_nib || !legal.has_pirt)
  const error = [submitted, upcomingQ, matchesQ, outQ].find((q) => q.error && !q.data)?.error

  return (
    <AppShell role="umkm" title="Beranda" width="wide">
      <PageHeading
        eyebrow={now ? formatToday(now) : " "}
        title={`Halo, ${me?.umkm_profile?.business_name ?? me?.name ?? ""}`}
      />

      {error && (
        <LoadError
          error={error}
          onRetry={() => [submitted, approved, received, upcomingQ, matchesQ, outQ].forEach((q) => void q.reload())}
        />
      )}

      {showSteps && (
        <Section title="Langkah awal" description="Selesaikan tiga langkah ini untuk mulai berjualan di toko.">
          <ol className="flex flex-col">
            {steps.map((s, i) => (
              <li key={s.label} className="border-b last:border-0">
                <Link href={s.href} className="flex items-center gap-4 py-4 hover:bg-muted/40">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center border text-xs font-semibold",
                      s.done && "border-primary bg-primary text-primary-foreground"
                    )}
                  >
                    {s.done ? <IconCheck className="size-4" /> : i + 1}
                  </span>
                  <span className={cn("flex-1 text-sm", s.done && "text-muted-foreground line-through")}>{s.label}</span>
                  {!s.done && <IconArrowRight className="size-4" />}
                </Link>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {legalGap && (
        <Link
          href="/profil/umkm"
          className="flex items-center gap-4 bg-warning/15 p-5 ring-1 ring-warning/30 transition-colors hover:bg-warning/20"
        >
          <IconAlertTriangle className="size-5 shrink-0 text-[color-mix(in_oklch,var(--warning),var(--foreground)_35%)]" />
          <span className="flex-1 text-sm">Lengkapi NIB dan PIRT untuk membuka lebih banyak peluang.</span>
          <IconArrowRight className="size-4" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Menunggu keputusan" value={<Count n={submitted.data?.count} />} href="/umkm/pengajuan" />
        <StatTile
          label="Siap diantar"
          value={<Count n={approved.data?.count} />}
          href="/umkm/pengajuan?tab=approved"
          highlight={(approved.data?.count ?? 0) > 0}
        />
        <StatTile label="Dijual di toko" value={<Count n={received.data?.count} />} href="/umkm/pengajuan?tab=received" />
        <StatTile label="Stok habis" value={<Count n={outQ.data?.count} />} href="/umkm/stok?filter=out_of_stock" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Section title="Jadwal antar mendatang" className="self-start">
          {upcomingQ.loading ? (
            <ListSkeleton rows={2} />
          ) : upcoming.length ? (
            <div className="-my-4">
              {upcoming.map((a) => (
                <DeliveryRow key={a.id} application={a} viewer="umkm" />
              ))}
            </div>
          ) : (
            <InlineEmpty>Belum ada jadwal antar.</InlineEmpty>
          )}
        </Section>

        <Section title="Peluang cocok untuk Anda" action={<SeeAll href="/umkm/peluang" />}>
          {matchesQ.loading ? (
            <ListSkeleton rows={2} />
          ) : matches.length ? (
            <div className="flex flex-col gap-3 [&>a]:bg-muted/50 [&>a]:shadow-none [&>a]:ring-0">
              {matches.map((o) => (
                <OpportunityCard key={o.id} opportunity={o} side="umkm" href={`/umkm/peluang/${o.id}`} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <InlineEmpty>Belum ada peluang yang sangat cocok di sekitar Anda.</InlineEmpty>
              <Link href="/umkm/peluang" className={buttonVariants({ variant: "outline" })}>
                Cari peluang
              </Link>
            </div>
          )}
        </Section>
      </div>

      {outOfStock.length > 0 && (
        <Section title="Stok habis" action={<SeeAll href="/umkm/stok?filter=out_of_stock" />} contentClassName="flex flex-col gap-3">
          {outOfStock.map((s) => (
            <StockRowItem key={s.item_id} row={s} viewer="umkm" inset />
          ))}
        </Section>
      )}
    </AppShell>
  )
}
