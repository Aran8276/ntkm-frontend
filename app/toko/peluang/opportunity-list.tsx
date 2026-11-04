"use client"

import Link from "next/link"
import { IconPlus, IconTargetArrow } from "@tabler/icons-react"

import { MY_OPPORTUNITIES } from "@/lib/mock-data"
import type { OpportunityStatus } from "@/lib/types"
import { buttonVariants } from "@/components/ui/button"
import { useQueryState } from "@/hooks/use-query-state"
import { AppShell } from "@/components/app/app-shell"
import { EmptyState, FilterChips, PageHeading } from "@/components/app/blocks"
import { OpportunityCard } from "@/components/app/cards"

type Tab = "all" | OpportunityStatus

export function OpportunityList() {
  const [tab, setTab] = useQueryState<Tab>("tab", "all")
  const items = MY_OPPORTUNITIES.filter((o) => tab === "all" || o.status === tab)
  const count = (s: OpportunityStatus) => MY_OPPORTUNITIES.filter((o) => o.status === s).length

  return (
    <AppShell role="store" title="Peluang" width="wide">
      <PageHeading
        title="Peluang saya"
        actions={
          <Link href="/toko/peluang/baru" className={buttonVariants()}>
            <IconPlus data-icon="inline-start" /> Peluang baru
          </Link>
        }
      />
      <FilterChips
        label="Status peluang"
        value={tab}
        onChange={setTab}
        options={[
          { value: "all", label: "Semua" },
          { value: "open", label: "Dibuka", count: count("open") },
          { value: "full", label: "Kuota penuh" },
          { value: "closed", label: "Ditutup" },
        ]}
      />
      {items.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} side="store" href={`/toko/peluang/${o.id}`} />
          ))}
        </div>
      ) : tab === "all" ? (
        <EmptyState
          icon={IconTargetArrow}
          action={
            <Link href="/toko/peluang/baru" className={buttonVariants()}>
              Pasang peluang
            </Link>
          }
        >
          Belum ada peluang. Pasang peluang agar UMKM sekitar bisa mengajukan produk.
        </EmptyState>
      ) : (
        <EmptyState icon={IconTargetArrow}>Tidak ada peluang dengan status ini.</EmptyState>
      )}
    </AppShell>
  )
}
