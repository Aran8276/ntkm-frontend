"use client"

import Link from "next/link"
import { IconPlus, IconTargetArrow } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatToday } from "@/lib/format"
import type { Paginated } from "@/lib/api"
import { useApi, useNow } from "@/lib/use-api"
import type { Application, Opportunity, StockRow } from "@/lib/types"
import { buttonVariants } from "@/components/ui/button"
import { AppShell } from "@/components/app/app-shell"
import { Count, Fab, InlineEmpty, ListSkeleton, PageHeading, Section, SeeAll, StatTile } from "@/components/app/blocks"
import { ApplicationCard, DeliveryRow, StockRowItem } from "@/components/app/cards"
import { LoadError } from "@/components/app/feedback"
import { useSession } from "@/components/app/providers"

/** P06 · Beranda toko. Numbers come from list `count`s (no dashboard endpoint). */
export default function StoreHomePage() {
  const { me } = useSession()
  const now = useNow()
  const submitted = useApi<Paginated<Application>>("user", "/applications", { as: "store", status: "submitted", page_size: 3 })
  const upcoming = useApi<Paginated<Application>>("user", "/applications", {
    as: "store",
    status: "approved,in_delivery",
    ordering: "delivery_slot_start",
    page_size: 100,
  })
  const outOfStock = useApi<Paginated<StockRow>>("user", "/stock", { as: "store", stock_status: "out_of_stock", page_size: 3 })
  const openOpps = useApi<Paginated<Opportunity>>("user", "/me/opportunities", { status: "open", page_size: 1 })
  const anyOpps = useApi<Paginated<Opportunity>>("user", "/me/opportunities", { page_size: 1 })

  const upcomingList = (upcoming.data?.results ?? []).filter((a) => a.delivery_slot)
  const error = [submitted, upcoming, outOfStock, openOpps].find((q) => q.error && !q.data)?.error
  const retry = () => {
    void submitted.reload()
    void upcoming.reload()
    void outOfStock.reload()
    void openOpps.reload()
  }

  return (
    <AppShell role="store" title="Beranda" width="wide">
      <PageHeading eyebrow={now ? formatToday(now) : " "} title={`Halo, ${me?.store_profile?.name ?? me?.name ?? ""}`} />

      {error && <LoadError error={error} onRetry={retry} />}

      {anyOpps.data?.count === 0 && (
        <div className="flex flex-col items-start gap-4 bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center">
          <IconTargetArrow className="size-8 shrink-0" stroke={1.5} />
          <p className="flex-1">Pasang peluang pertama Anda agar UMKM sekitar bisa mengajukan produk.</p>
          <Link href="/toko/peluang/baru" className={cn(buttonVariants({ variant: "secondary" }))}>
            Pasang peluang
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Pengajuan baru"
          value={<Count n={submitted.data?.count} />}
          href="/toko/pengajuan?tab=submitted"
          highlight={(submitted.data?.count ?? 0) > 0}
        />
        <StatTile label="Barang akan datang" value={<Count n={upcoming.data?.count} />} href="/toko/pengajuan?tab=approved" />
        <StatTile label="Stok habis" value={<Count n={outOfStock.data?.count} />} href="/toko/stok?filter=out_of_stock" />
        <StatTile label="Peluang aktif" value={<Count n={openOpps.data?.count} />} href="/toko/peluang?tab=open" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Section title="Perlu ditinjau" action={<SeeAll href="/toko/pengajuan" />} contentClassName="flex flex-col gap-3">
          {submitted.loading ? (
            <ListSkeleton rows={2} />
          ) : submitted.data?.results.length ? (
            submitted.data.results.map((a) => <ApplicationCard key={a.id} application={a} viewer="store" inset />)
          ) : (
            <InlineEmpty>Belum ada pengajuan baru.</InlineEmpty>
          )}
        </Section>

        <Section title="Jadwal antar mendatang">
          {upcoming.loading ? (
            <ListSkeleton rows={2} />
          ) : upcomingList.length ? (
            <div className="-my-4">
              {upcomingList.map((a) => (
                <DeliveryRow key={a.id} application={a} viewer="store" />
              ))}
            </div>
          ) : (
            <InlineEmpty>Belum ada jadwal antar.</InlineEmpty>
          )}
        </Section>
      </div>

      {(outOfStock.data?.count ?? 0) > 0 && (
        <Section title="Stok habis" action={<SeeAll href="/toko/stok?filter=out_of_stock" />} contentClassName="flex flex-col gap-3">
          {outOfStock.data!.results.map((s) => (
            <StockRowItem key={s.item_id} row={s} viewer="store" inset onChanged={() => void outOfStock.reload()} />
          ))}
        </Section>
      )}

      <Fab href="/toko/peluang/baru">
        <IconPlus className="size-4" /> Pasang peluang
      </Fab>
    </AppShell>
  )
}
