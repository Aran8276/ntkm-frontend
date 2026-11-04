"use client"

import * as React from "react"
import Link from "next/link"
import { IconCheck, IconChevronDown, IconInbox, IconPackage, IconSend } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { MY_OPPORTUNITIES, applicationsAs } from "@/lib/mock-data"
import type { Application, ApplicationStatus, Role } from "@/lib/types"
import { buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useQueryState } from "@/hooks/use-query-state"
import { AppShell } from "@/components/app/app-shell"
import { EmptyState, FilterChips, PageHeading } from "@/components/app/blocks"
import { ApplicationCard } from "@/components/app/cards"

type Tab = "submitted" | "approved" | "in_delivery" | "received" | "history"

const STATUSES: Record<Tab, ApplicationStatus[]> = {
  submitted: ["submitted"],
  approved: ["approved"],
  in_delivery: ["in_delivery"],
  received: ["received"],
  history: ["rejected", "completed", "cancelled"],
}

const LABELS: Record<Role, Record<Tab, string>> = {
  store: { submitted: "Baru", approved: "Disetujui", in_delivery: "Dalam pengiriman", received: "Aktif", history: "Riwayat" },
  umkm: { submitted: "Menunggu", approved: "Disetujui", in_delivery: "Dalam pengiriman", received: "Dijual", history: "Riwayat" },
}

const slotKey = (a: Application) => (a.delivery_slot ? `${a.delivery_slot.date}${a.delivery_slot.start}` : "9999")

/** P10 (store inbox) and P17 (UMKM submissions). */
export function ApplicationInbox({ viewer }: { viewer: Role }) {
  const [tab, setTab] = useQueryState<Tab>("tab", "submitted")
  const [oppFilter, setOppFilter] = useQueryState<string>("peluang", "all")
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const all = applicationsAs(viewer).filter(
    (a) => viewer === "umkm" || oppFilter === "all" || String(a.opportunity.id) === oppFilter
  )
  const list = all
    .filter((a) => STATUSES[tab].includes(a.status))
    .sort((a, b) =>
      tab === "approved" || tab === "in_delivery"
        ? slotKey(a).localeCompare(slotKey(b))
        : b.updated_at.localeCompare(a.updated_at)
    )
  const badgeTab: Tab = viewer === "store" ? "submitted" : "approved"
  const selectedOpp = MY_OPPORTUNITIES.find((o) => String(o.id) === oppFilter)

  const empty =
    tab === "submitted"
      ? viewer === "store"
        ? "Belum ada pengajuan baru. UMKM yang tertarik dengan peluang Anda akan muncul di sini."
        : "Belum ada pengajuan. Temukan peluang yang cocok untuk produk Anda."
      : "Tidak ada pengajuan di sini."

  return (
    <AppShell role={viewer} title="Pengajuan" width="wide">
      <PageHeading
        title={viewer === "store" ? "Pengajuan" : "Pengajuan saya"}
        actions={
          viewer === "store" ? (
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex h-9 max-w-64 items-center gap-2 border bg-background px-4 text-[0.6875rem] font-semibold tracking-widest uppercase outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <span className="truncate">{selectedOpp ? selectedOpp.title : "Semua peluang"}</span>
              <IconChevronDown className="size-3.5 shrink-0" />
            </button>
          ) : (
            <Link href="/umkm/stok" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <IconPackage data-icon="inline-start" />
              Stok di toko
            </Link>
          )
        }
      />

      <FilterChips
        label="Status pengajuan"
        value={tab}
        onChange={setTab}
        options={(Object.keys(STATUSES) as Tab[]).map((t) => ({
          value: t,
          label: LABELS[viewer][t],
          count: t === badgeTab ? all.filter((a) => STATUSES[t].includes(a.status)).length : undefined,
        }))}
      />

      {list.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {list.map((a) => (
            <ApplicationCard key={a.id} application={a} viewer={viewer} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={viewer === "store" ? IconInbox : IconSend}
          action={
            viewer === "umkm" && tab === "submitted" ? (
              <Link href="/umkm/peluang" className={buttonVariants()}>
                Cari peluang
              </Link>
            ) : undefined
          }
        >
          {empty}
        </EmptyState>
      )}

      {viewer === "store" && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="mx-auto max-w-lg">
            <SheetHeader>
              <SheetTitle>Filter peluang</SheetTitle>
              <SheetDescription>Tampilkan pengajuan untuk satu peluang saja.</SheetDescription>
              <div className="mt-4 flex flex-col">
                {[{ id: "all", title: "Semua peluang" }, ...MY_OPPORTUNITIES.map((o) => ({ id: String(o.id), title: o.title }))].map(
                  (o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setOppFilter(o.id)
                        setSheetOpen(false)
                      }}
                      className={cn(
                        "flex items-center justify-between gap-4 border-b py-4 text-left text-sm outline-none last:border-0 hover:bg-muted/50 focus-visible:bg-muted",
                        o.id === oppFilter && "font-medium"
                      )}
                    >
                      {o.title}
                      {o.id === oppFilter && <IconCheck className="size-4 text-primary" />}
                    </button>
                  )
                )}
              </div>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      )}
    </AppShell>
  )
}
