"use client"

import Link from "next/link"
import { IconPlus, IconTargetArrow } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatToday } from "@/lib/format"
import { MY_OPPORTUNITIES, MY_STORE, STORE_APPLICATIONS, STORE_STOCK } from "@/lib/mock-data"
import { buttonVariants } from "@/components/ui/button"
import { AppShell } from "@/components/app/app-shell"
import { Fab, InlineEmpty, PageHeading, Section, SeeAll, StatTile } from "@/components/app/blocks"
import { ApplicationCard, DeliveryRow, StockRowItem } from "@/components/app/cards"

export default function StoreHomePage() {
  const submitted = STORE_APPLICATIONS.filter((a) => a.status === "submitted")
  const upcoming = STORE_APPLICATIONS.filter((a) => ["approved", "in_delivery"].includes(a.status))
    .filter((a) => a.delivery_slot)
    .sort((a, b) => `${a.delivery_slot!.date}${a.delivery_slot!.start}`.localeCompare(`${b.delivery_slot!.date}${b.delivery_slot!.start}`))
  const outOfStock = STORE_STOCK.filter((s) => s.stock_status === "out_of_stock")
  const openOpps = MY_OPPORTUNITIES.filter((o) => o.status === "open")
  const hasOpportunities = MY_OPPORTUNITIES.length > 0

  return (
    <AppShell role="store" title="Beranda" width="wide">
      <PageHeading eyebrow={formatToday()} title={`Halo, ${MY_STORE.name}`} />

      {!hasOpportunities && (
        <div className="flex flex-col items-start gap-4 bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center">
          <IconTargetArrow className="size-8 shrink-0" stroke={1.5} />
          <p className="flex-1">Pasang peluang pertama Anda agar UMKM sekitar bisa mengajukan produk.</p>
          <Link href="/toko/peluang/baru" className={cn(buttonVariants({ variant: "secondary" }))}>
            Pasang peluang
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Pengajuan baru" value={submitted.length} href="/toko/pengajuan?tab=submitted" highlight={submitted.length > 0} />
        <StatTile label="Barang akan datang" value={upcoming.length} href="/toko/pengajuan?tab=approved" />
        <StatTile label="Stok habis" value={outOfStock.length} href="/toko/stok?filter=out_of_stock" />
        <StatTile label="Peluang aktif" value={openOpps.length} href="/toko/peluang?tab=open" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Section title="Perlu ditinjau" action={<SeeAll href="/toko/pengajuan" />} contentClassName="flex flex-col gap-3">
          {submitted.length ? (
            submitted.slice(0, 3).map((a) => (
              <ApplicationCard key={a.id} application={a} viewer="store" inset />
            ))
          ) : (
            <InlineEmpty>Belum ada pengajuan baru.</InlineEmpty>
          )}
        </Section>

        <Section title="Jadwal antar mendatang">
          {upcoming.length ? (
            <div className="-my-4">
              {upcoming.map((a) => (
                <DeliveryRow key={a.id} application={a} viewer="store" />
              ))}
            </div>
          ) : (
            <InlineEmpty>Belum ada jadwal antar.</InlineEmpty>
          )}
        </Section>
      </div>

      {outOfStock.length > 0 && (
        <Section title="Stok habis" action={<SeeAll href="/toko/stok?filter=out_of_stock" />} contentClassName="flex flex-col gap-3">
          {outOfStock.slice(0, 3).map((s) => (
            <StockRowItem key={s.item_id} row={s} viewer="store" inset />
          ))}
        </Section>
      )}

      <Fab href="/toko/peluang/baru">
        <IconPlus className="size-4" /> Pasang peluang
      </Fab>
    </AppShell>
  )
}
