"use client"

import Link from "next/link"
import { IconAlertTriangle, IconArrowRight, IconCheck } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatToday } from "@/lib/format"
import { FEED_OPPORTUNITIES, MY_PRODUCTS, MY_UMKM, UMKM_APPLICATIONS, UMKM_STOCK } from "@/lib/mock-data"
import { buttonVariants } from "@/components/ui/button"
import { AppShell } from "@/components/app/app-shell"
import { InlineEmpty, PageHeading, Section, SeeAll, StatTile } from "@/components/app/blocks"
import { DeliveryRow, OpportunityCard, StockRowItem } from "@/components/app/cards"

export default function UmkmHomePage() {
  const apps = UMKM_APPLICATIONS
  const by = (s: string) => apps.filter((a) => a.status === s)
  const upcoming = [...by("approved"), ...by("in_delivery")]
    .filter((a) => a.delivery_slot)
    .sort((a, b) => `${a.delivery_slot!.date}${a.delivery_slot!.start}`.localeCompare(`${b.delivery_slot!.date}${b.delivery_slot!.start}`))
  const outOfStock = UMKM_STOCK.filter((s) => s.stock_status === "out_of_stock")
  const matches = FEED_OPPORTUNITIES.filter((o) => o.match?.level === "high")
    .sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0))
    .slice(0, 3)

  const steps = [
    { label: "Lengkapi profil usaha", done: true, href: "/profil/umkm" },
    { label: "Tambah produk pertama", done: MY_PRODUCTS.length > 0, href: "/umkm/produk/baru" },
    { label: "Ajukan ke peluang pertama", done: apps.length > 0, href: "/umkm/peluang" },
  ]
  const showSteps = steps.some((s) => !s.done)
  const legalGap = !MY_UMKM.legal.has_nib || !MY_UMKM.legal.has_pirt

  return (
    <AppShell role="umkm" title="Beranda" width="wide">
      <PageHeading eyebrow={formatToday()} title={`Halo, ${MY_UMKM.business_name}`} />

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
        <StatTile label="Menunggu keputusan" value={by("submitted").length} href="/umkm/pengajuan" />
        <StatTile label="Siap diantar" value={by("approved").length} href="/umkm/pengajuan?tab=approved" highlight={by("approved").length > 0} />
        <StatTile label="Dijual di toko" value={by("received").length} href="/umkm/pengajuan?tab=received" />
        <StatTile label="Stok habis" value={outOfStock.length} href="/umkm/stok?filter=out_of_stock" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Section title="Jadwal antar mendatang" className="self-start">
          {upcoming.length ? (
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
          {matches.length ? (
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
          {outOfStock.slice(0, 3).map((s) => (
            <StockRowItem key={s.item_id} row={s} viewer="umkm" inset />
          ))}
        </Section>
      )}
    </AppShell>
  )
}
