"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconPlus } from "@tabler/icons-react"

import { formatDate, formatRupiah } from "@/lib/format"
import { ADMIN_PRODUCTS, slugify } from "@/lib/admin-mock"
import type { AdminProduct } from "@/lib/admin-types"
import { Button } from "@/components/ui/button"
import { Thumb } from "@/components/app/blocks"
import { AdminPage } from "@/components/admin/admin-page"
import { ActiveChip, CellLink, CreatorChip, DateTime, DeletedChip } from "@/components/admin/admin-ui"
import { DataTable } from "@/components/admin/data-table"
import { categoryOptions, umkmOptions } from "@/components/admin/options"
import { productMenu, useProductActions } from "@/components/admin/product-actions"

export const shelfLabel = (p: Pick<AdminProduct, "shelf_life_days" | "expiry_date">) =>
  p.shelf_life_days ? `${p.shelf_life_days} hari` : p.expiry_date ? `s.d. ${formatDate(p.expiry_date, { weekday: false })}` : "—"

/** A12 · Produk. */
export function ProductsTable() {
  const router = useRouter()
  const { open, modals } = useProductActions()
  const create = (
    <Button render={<Link href="/admin/produk/baru" />} nativeButton={false}>
      <IconPlus data-icon="inline-start" /> Produk
    </Button>
  )
  return (
    <AdminPage title="Produk" description="Produk UMKM peserta pilot.">
      <DataTable<AdminProduct>
        rows={ADMIN_PRODUCTS}
        rowKey={(p) => p.id}
        rowHref={(p) => `/admin/produk/${p.id}`}
        isDeleted={(p) => !!p.deleted_at}
        search={{ placeholder: "Cari nama produk, tagar, atau nama usaha", text: (p) => `${p.name} ${p.tags.join(" ")} ${p.umkm.business_name}` }}
        filters={[
          { key: "umkm_id", label: "UMKM", searchable: true, options: umkmOptions, match: (p, v) => p.umkm.id === v },
          { key: "category", label: "Kategori", options: categoryOptions, match: (p, v) => slugify(p.category.name) === v },
          {
            key: "is_active",
            label: "Status",
            options: [
              { value: "true", label: "Aktif" },
              { value: "false", label: "Diarsipkan" },
            ],
            match: (p, v) => String(p.is_active) === v,
          },
        ]}
        toggles={[{ key: "has_placements", label: "Sedang dijual di toko", match: (p) => p.active_placements > 0 }]}
        exportResources={["products"]}
        createAction={create}
        columns={[
          { key: "photo", header: "Foto", cell: () => <Thumb size="sm" /> },
          {
            key: "name",
            header: "Nama",
            sort: (p) => p.name,
            cell: (p) => (
              <span className="flex items-center gap-2">
                <span className="font-medium">{p.name}</span>
                {p.deleted_at && <DeletedChip />}
              </span>
            ),
          },
          { key: "umkm", header: "UMKM", cell: (p) => <CellLink href={`/admin/pengguna/${p.umkm.owner_id}?tab=umkm`}>{p.umkm.business_name}</CellLink> },
          { key: "category", header: "Kategori", cell: (p) => p.category.name },
          { key: "base_price", header: "Harga setor", sort: (p) => p.base_price, className: "text-right", cell: (p) => <span className="tabular-nums">{formatRupiah(p.base_price)}</span> },
          { key: "srp", header: "Harga jual saran", className: "text-right", cell: (p) => <span className="tabular-nums">{formatRupiah(p.suggested_retail_price)}</span> },
          { key: "shelf", header: "Masa simpan", cell: (p) => shelfLabel(p) },
          { key: "placements", header: "Toko aktif", className: "text-right", cell: (p) => p.active_placements },
          { key: "status", header: "Status", cell: (p) => <ActiveChip active={p.is_active} /> },
          { key: "creator", header: "Dibuat oleh", cell: (p) => <CreatorChip createdBy={p.created_by} kind="UMKM" /> },
          { key: "created_at", header: "Dibuat", sort: (p) => p.created_at, cell: (p) => <DateTime value={p.created_at} /> },
        ]}
        rowMenu={(p) => productMenu(p, open, (h) => router.push(h))}
        emptyText="Belum ada produk."
        emptyAction={create}
      />
      {modals}
    </AdminPage>
  )
}
