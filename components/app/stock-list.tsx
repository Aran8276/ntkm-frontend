"use client"

import { IconPackage } from "@tabler/icons-react"

import { STORE_STOCK, UMKM_STOCK } from "@/lib/mock-data"
import type { Role } from "@/lib/types"
import { useQueryState } from "@/hooks/use-query-state"
import { AppShell } from "@/components/app/app-shell"
import { EmptyState, FilterChips, PageHeading } from "@/components/app/blocks"
import { StockRowItem } from "@/components/app/cards"

type Filter = "all" | "available" | "out_of_stock"

/** P11 (store, editable) and P18 (UMKM, read-only). */
export function StockList({ viewer }: { viewer: Role }) {
  const [filter, setFilter] = useQueryState<Filter>("filter", "all")
  const rows = viewer === "store" ? STORE_STOCK : UMKM_STOCK
  const out = rows.filter((r) => r.stock_status === "out_of_stock").length
  const list = rows.filter((r) => filter === "all" || r.stock_status === filter)

  return (
    <AppShell
      role={viewer}
      title={viewer === "store" ? "Stok" : "Stok di toko"}
      back={viewer === "umkm" ? "/umkm" : undefined}
      width="wide"
    >
      <PageHeading
        title={viewer === "store" ? "Stok di rak" : "Stok produk saya di toko"}
        description={
          viewer === "store"
            ? `${rows.length} produk UMKM di rak · ${out} habis`
            : `${rows.length} produk dijual di toko · ${out} habis`
        }
      />
      <FilterChips
        label="Filter stok"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "Semua" },
          { value: "available", label: "Ada" },
          { value: "out_of_stock", label: "Habis", count: out },
        ]}
      />
      {list.length ? (
        <div className="flex flex-col gap-3">
          {list.map((r) => (
            <StockRowItem key={r.item_id} row={r} viewer={viewer} />
          ))}
        </div>
      ) : (
        <EmptyState icon={IconPackage}>
          {rows.length === 0
            ? viewer === "store"
              ? "Belum ada produk UMKM di rak. Produk muncul di sini setelah Anda mengonfirmasi barang diterima."
              : "Belum ada produk Anda yang dijual di toko."
            : "Tidak ada produk dengan status ini."}
        </EmptyState>
      )}
    </AppShell>
  )
}
