"use client"

import { IconPackage } from "@tabler/icons-react"

import type { Paginated } from "@/lib/api"
import { useApi } from "@/lib/use-api"
import type { Role, StockRow } from "@/lib/types"
import { useQueryState } from "@/hooks/use-query-state"
import { AppShell } from "@/components/app/app-shell"
import { EmptyState, FilterChips, ListSkeleton, PageHeading } from "@/components/app/blocks"
import { LoadError } from "@/components/app/feedback"
import { StockRowItem } from "@/components/app/cards"

type Filter = "all" | "available" | "out_of_stock"

/** P11 (store, editable) and P18 (UMKM, read-only). */
export function StockList({ viewer }: { viewer: Role }) {
  const [filter, setFilter] = useQueryState<Filter>("filter", "all")
  // One request for the whole shelf (pilot scale); counts and filter are computed from it.
  const q = useApi<Paginated<StockRow>>("user", "/stock", { as: viewer, page_size: 100 })
  const rows = q.data?.results ?? []
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
          q.loading
            ? "Memuat…"
            : viewer === "store"
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
      {q.error && !q.data ? (
        <LoadError error={q.error} onRetry={q.reload} />
      ) : q.loading ? (
        <ListSkeleton rows={4} />
      ) : list.length ? (
        <div className="flex flex-col gap-3">
          {list.map((r) => (
            <StockRowItem
              key={r.item_id}
              row={r}
              viewer={viewer}
              onChanged={(next) => {
                if (next && q.data)
                  q.mutate({ ...q.data, results: q.data.results.map((x) => (x.item_id === next.item_id ? next : x)) })
                else void q.reload()
              }}
            />
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
