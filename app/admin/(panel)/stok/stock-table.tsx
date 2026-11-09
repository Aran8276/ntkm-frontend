"use client"

import * as React from "react"

import { formatRupiah } from "@/lib/format"
import type { Paginated } from "@/lib/api"
import { useApi } from "@/lib/use-api"
import type { AdminStockRow } from "@/lib/admin-types"
import { Button } from "@/components/ui/button"
import { Thumb } from "@/components/app/blocks"
import { StockChip } from "@/components/app/status"
import { AdminPage } from "@/components/admin/admin-page"
import { DateTime, OverrideMark } from "@/components/admin/admin-ui"
import { DataTable } from "@/components/admin/data-table"
import { useStoreOptions, useUmkmOptions } from "@/components/admin/options"
import { StockCorrectionModal, type StockTarget } from "@/components/admin/stock-correction"

/** A17 · Stok. */
export function StockTable() {
  const [target, setTarget] = React.useState<StockTarget | null>(null)
  const storeOptions = useStoreOptions()
  const umkmOptions = useUmkmOptions()
  // Summary counts: "<count> item di rak · <n> habis".
  const all = useApi<Paginated<AdminStockRow>>("admin", "/admin/stock", { page_size: 1 })
  const outQ = useApi<Paginated<AdminStockRow>>("admin", "/admin/stock", { stock_status: "out_of_stock", page_size: 1 })

  return (
    <AdminPage
      title="Stok"
      description={all.data && outQ.data ? `${all.data.count} item di rak · ${outQ.data.count} habis` : "Memuat…"}
    >
      <DataTable<AdminStockRow>
        endpoint="/admin/stock"
        rowKey={(s) => `${s.application_id}-${s.item_id}`}
        rowHref={(s) => `/admin/pengajuan/${s.application_id}`}
        defaultOrdering="-updated"
        filters={[
          { key: "store_id", label: "Toko", searchable: true, options: storeOptions, match: (s, v) => s.store.id === v },
          { key: "umkm_id", label: "UMKM", searchable: true, options: umkmOptions, match: (s, v) => s.umkm.id === v },
          {
            key: "stock_status",
            label: "Stok",
            options: [
              { value: "available", label: "Ada" },
              { value: "out_of_stock", label: "Habis" },
            ],
            match: (s, v) => s.stock_status === v,
          },
        ]}
        exportResources={["stock"]}
        columns={[
          {
            key: "product",
            header: "Produk",
            cell: (s) => (
              <span className="flex items-center gap-3">
                <Thumb size="sm" src={s.product.photo_url} />
                <span className="font-medium">{s.product.name}</span>
              </span>
            ),
          },
          { key: "umkm", header: "UMKM", cell: (s) => s.umkm.business_name },
          { key: "store", header: "Toko", cell: (s) => s.store.name },
          { key: "price", header: "Harga jual", className: "text-right", cell: (s) => <span className="tabular-nums">{s.sell_price != null ? formatRupiah(s.sell_price) : "—"}</span> },
          { key: "mode", header: "Mode", cell: (s) => (s.stock_mode === "count" ? "Angka" : "Ada-habis") },
          { key: "stock", header: "Stok", cell: (s) => <StockChip status={s.stock_status} quantity={s.stock_quantity} mode={s.stock_mode} /> },
          {
            key: "updated",
            header: "Diperbarui",
            cell: (s) => (
              <span className="flex flex-col gap-1">
                <DateTime value={s.stock_updated_at} />
                {s.stock_updated_by && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {s.stock_updated_by.is_admin && <OverrideMark label={false} />} {s.stock_updated_by.name}
                  </span>
                )}
              </span>
            ),
          },
          {
            key: "action",
            header: "Aksi",
            cell: (s) => (
              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  setTarget({
                    applicationId: s.application_id,
                    itemId: s.item_id,
                    productName: s.product.name,
                    storeName: s.store.name,
                    mode: s.stock_mode,
                    quantity: s.stock_quantity,
                    status: s.stock_status,
                  })
                }
              >
                Koreksi
              </Button>
            ),
          },
        ]}
        emptyText="Belum ada produk yang sedang dijual di toko."
      />
      <StockCorrectionModal target={target} onOpenChange={(o) => !o && setTarget(null)} />
    </AdminPage>
  )
}
