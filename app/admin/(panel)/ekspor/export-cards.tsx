"use client"

import * as React from "react"
import { IconChevronDown, IconDownload, IconInfoCircle } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { AdminPage } from "@/components/admin/admin-page"
import { categoryOptions, storeOptions, umkmOptions } from "@/components/admin/options"

type FilterKind = "role" | "user_status" | "legal_status" | "opp_status" | "app_status" | "store" | "umkm" | "category" | "active" | "stock_status" | "date_range"

interface ExportDef {
  resource: string
  title: string
  description: string
  columns: string[]
  filters: FilterKind[]
  label?: string
  note?: string
}

const EXPORTS: ExportDef[] = [
  { resource: "users", title: "Pengguna", description: "Satu baris per akun.", columns: ["id", "name", "email", "roles", "status", "is_admin", "admin_role", "last_login_at", "created_at"], filters: ["role", "user_status"] },
  { resource: "stores", title: "Toko", description: "Satu baris per profil toko.", columns: ["id", "owner_email", "name", "phone", "address", "lat", "lng", "opportunities_open", "items_on_shelf", "created_at"], filters: ["user_status"] },
  { resource: "umkms", title: "UMKM", description: "Satu baris per profil UMKM, termasuk status verifikasi.", columns: ["id", "owner_email", "business_name", "owner_name", "phone", "nib", "nib_status", "pirt_number", "pirt_status", "halal_number", "halal_status", "created_at"], filters: ["legal_status"] },
  { resource: "opportunities", title: "Peluang", description: "Satu baris per peluang.", columns: ["id", "store_name", "title", "categories", "commission_type", "commission_value", "quota", "quota_used", "valid_until", "status", "created_at"], filters: ["opp_status", "store", "date_range"] },
  { resource: "products", title: "Produk", description: "Satu baris per produk.", columns: ["id", "umkm_name", "name", "category", "base_price", "suggested_retail_price", "shelf_life_days", "expiry_date", "is_active", "created_at"], filters: ["umkm", "category", "active"] },
  { resource: "applications", title: "Pengajuan", description: "Satu baris per pengajuan.", columns: ["id", "store_name", "umkm_name", "opportunity_title", "status", "items_count", "items_approved", "delivery_date", "created_at", "updated_at"], filters: ["app_status", "store", "umkm", "date_range"] },
  {
    resource: "application-items",
    title: "Produk dalam pengajuan",
    description: "Satu baris per item pengajuan.",
    label: "Dasar bagi hasil",
    note: "Unit terjual = jumlah diterima − stok sekarang (hanya mode angka).",
    columns: ["application_id", "store_name", "umkm_name", "product_name", "decision", "approved_quantity", "sell_price", "commission_per_unit", "umkm_income_per_unit", "received_quantity", "stock_quantity", "units_sold"],
    filters: ["app_status", "store", "umkm", "date_range"],
  },
  { resource: "stock", title: "Stok", description: "Item berstatus diterima toko.", columns: ["application_id", "store_name", "umkm_name", "product_name", "sell_price", "stock_mode", "stock_quantity", "stock_status", "stock_updated_at"], filters: ["store", "umkm", "stock_status"] },
]

const SELECTS: Partial<Record<FilterKind, { label: string; options: { value: string; label: string }[] }>> = {
  role: { label: "Peran", options: [{ value: "store", label: "Toko" }, { value: "umkm", label: "UMKM" }, { value: "none", label: "Tanpa peran" }] },
  user_status: { label: "Status akun", options: [{ value: "invited", label: "Diundang" }, { value: "active", label: "Aktif" }, { value: "suspended", label: "Disuspend" }] },
  legal_status: { label: "Status legalitas", options: [{ value: "pending", label: "Menunggu" }, { value: "verified", label: "Terverifikasi" }, { value: "rejected", label: "Ditolak" }, { value: "unverified", label: "Belum diisi" }] },
  opp_status: { label: "Status", options: [{ value: "open", label: "Dibuka" }, { value: "full", label: "Kuota penuh" }, { value: "closed", label: "Ditutup" }] },
  app_status: {
    label: "Status",
    options: [
      { value: "submitted", label: "Diajukan" },
      { value: "approved", label: "Disetujui" },
      { value: "in_delivery", label: "Dalam pengiriman" },
      { value: "received", label: "Diterima toko" },
      { value: "completed", label: "Selesai" },
      { value: "rejected", label: "Ditolak" },
      { value: "cancelled", label: "Dibatalkan" },
    ],
  },
  store: { label: "Toko", options: storeOptions.map((o) => ({ value: o.value, label: o.label })) },
  umkm: { label: "UMKM", options: umkmOptions.map((o) => ({ value: o.value, label: o.label })) },
  category: { label: "Kategori", options: categoryOptions },
  active: { label: "Aktif", options: [{ value: "true", label: "Aktif" }, { value: "false", label: "Diarsipkan" }] },
  stock_status: { label: "Status stok", options: [{ value: "available", label: "Ada" }, { value: "out_of_stock", label: "Habis" }] },
}

/** A23 · Ekspor. */
export function ExportCards() {
  return (
    <AdminPage title="Ekspor" description="Unduh data pilot sebagai CSV. Setiap unduhan tercatat di audit log.">
      <div className="grid gap-6 lg:grid-cols-2">
        {EXPORTS.map((e) => (
          <ExportCard key={e.resource} def={e} />
        ))}
      </div>
    </AdminPage>
  )
}

function ExportCard({ def }: { def: ExportDef }) {
  const [showCols, setShowCols] = React.useState(false)
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [busy, setBusy] = React.useState(false)
  const [from, setFrom] = React.useState("2026-09-01")
  const [to, setTo] = React.useState("2026-11-04")

  const download = () => {
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      // 400 when > 50.000 rows: only reachable with very wide ranges in this mock.
      if (from < "2020-01-01") toast.add({ title: "Data terlalu banyak. Persempit rentang tanggal atau filter.", type: "error" })
      else toast.add({ title: `${def.resource}.csv diunduh.`, type: "success" })
    }, 900)
  }

  return (
    <section className="flex flex-col gap-5 bg-background p-6 shadow-sm ring-1 ring-foreground/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="flex flex-wrap items-center gap-2 text-base font-semibold tracking-wider uppercase">
            {def.title}
            {def.label && <span className="bg-primary/10 px-1.5 py-1 text-[0.625rem] tracking-widest text-primary">{def.label}</span>}
          </h2>
          <p className="text-sm text-muted-foreground">{def.description}</p>
        </div>
        <code className="shrink-0 font-mono text-xs text-muted-foreground">{def.resource}.csv</code>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {def.filters.map((f) =>
          f === "date_range" ? (
            <div key={f} className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">Rentang tanggal</span>
              <span className="flex items-center gap-2">
                <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} aria-label="Dari" className="w-40" />
                <span className="text-muted-foreground">–</span>
                <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} aria-label="Sampai" className="w-40" />
              </span>
            </div>
          ) : (
            <label key={f} className="flex flex-col gap-1.5">
              <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">{SELECTS[f]!.label}</span>
              <NativeSelect value={values[f] ?? ""} onChange={(e) => setValues((v) => ({ ...v, [f]: e.target.value }))}>
                <NativeSelectOption value="">Semua</NativeSelectOption>
                {SELECTS[f]!.options.map((o) => (
                  <NativeSelectOption key={o.value} value={o.value}>
                    {o.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          )
        )}
      </div>

      {def.note && (
        <p className="flex items-start gap-2 bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <IconInfoCircle className="mt-px size-3.5 shrink-0" /> {def.note}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t pt-4">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowCols((s) => !s)}
            aria-expanded={showCols}
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-muted-foreground uppercase hover:text-foreground"
          >
            {def.columns.length} kolom
            <IconChevronDown className={cn("size-3.5 transition-transform", showCols && "rotate-180")} />
          </button>
          <Button onClick={download} disabled={busy}>
            {busy ? <Spinner data-icon="inline-start" /> : <IconDownload data-icon="inline-start" />}
            Unduh CSV
          </Button>
        </div>
        {showCols && (
          <div className="flex flex-wrap gap-1.5">
            {def.columns.map((c) => (
              <code key={c} className="bg-muted px-1.5 py-0.5 font-mono text-xs">
                {c}
              </code>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
