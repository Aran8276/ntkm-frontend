"use client"

import * as React from "react"

import { formatRupiah } from "@/lib/format"
import { ADMIN_STOCK } from "@/lib/admin-mock"
import type { AdminStockRow } from "@/lib/admin-types"
import { Button } from "@/components/ui/button"
import { Thumb } from "@/components/app/blocks"
import { StockChip } from "@/components/app/status"
import { AdminPage } from "@/components/admin/admin-page"
import { DateTime, OverrideMark } from "@/components/admin/admin-ui"
import { DataTable } from "@/components/admin/data-table"
import { storeOptions, umkmOptions } from "@/components/admin/options"
import { StockCorrectionModal, type StockTarget } from "@/components/admin/stock-correction"

/** A17 · Stok. */
export function StockTable() {
  const [target, setTarget] = React.useState<StockTarget | null>(null)
  const out = ADMIN_STOCK.filter((s) => s.stock_status === "out_of_stock").length

  return (
    <AdminPage title="Stok" description={`${ADMIN_STOCK.length} item di rak · ${out} habis`}>
      <DataTable<AdminStockRow>
        rows={ADMIN_STOCK}
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
                <Thumb size="sm" />
                <span className="font-medium">{s.product.name}</span>
              </span>
            ),
          },
          { key: "umkm", header: "UMKM", cell: (s) => s.umkm.business_name },
          { key: "store", header: "Toko", cell: (s) => s.store.name },
          { key: "price", header: "Harga jual", className: "text-right", cell: (s) => <span className="tabular-nums">{formatRupiah(s.sell_price)}</span> },
          { key: "mode", header: "Mode", cell: (s) => (s.stock_mode === "count" ? "Angka" : "Ada-habis") },
          { key: "stock", header: "Stok", sort: (s) => (s.stock_status === "out_of_stock" ? -1 : (s.stock_quantity ?? 0)), cell: (s) => <StockChip status={s.stock_status} quantity={s.stock_quantity} mode={s.stock_mode} /> },
          {
            key: "updated",
            header: "Diperbarui",
            sort: (s) => s.stock_updated_at,
            cell: (s) => (
              <span className="flex flex-col gap-1">
                <DateTime value={s.stock_updated_at} />
                {s.stock_updated_by && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <OverrideMark label={false} /> {s.stock_updated_by}
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
