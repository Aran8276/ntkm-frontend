"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconBox, IconPlus, IconSearch } from "@tabler/icons-react"

import { api, isApiError, type Paginated } from "@/lib/api"
import { revalidate, useApi } from "@/lib/use-api"
import type { Category, Product } from "@/lib/types"
import { buttonVariants } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { useQueryState } from "@/hooks/use-query-state"
import { AppShell } from "@/components/app/app-shell"
import { ConfirmDialog, EmptyState, FilterChips, ListSkeleton, PageHeading } from "@/components/app/blocks"
import { LoadError, handleApiError } from "@/components/app/feedback"
import { ProductCard } from "@/components/app/cards"

type Tab = "active" | "archived"

/** P13 · Produk saya: `GET /me/products?search=&category=` (both tabs at once for the counts). */
export function ProductList() {
  const router = useRouter()
  const [tab, setTab] = useQueryState<Tab>("tab", "active")
  const [category, setCategory] = useQueryState<string>("kategori", "all")
  const [query, setQuery] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [archiving, setArchiving] = React.useState<Product | null>(null)
  const [blocked, setBlocked] = React.useState(false)

  // Search after the user stops typing for 400 ms.
  React.useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim().toLowerCase()), 400)
    return () => clearTimeout(t)
  }, [query])

  const categoriesQ = useApi<Category[]>("user", "/categories")
  const CATEGORIES = categoriesQ.data ?? []
  const q = useApi<Paginated<Product>>("user", "/me/products", {
    search: search || undefined,
    category: category === "all" ? undefined : category,
    page_size: 100,
  })
  const products = q.data?.results ?? []
  const list = products.filter((p) => p.is_active === (tab === "active"))

  const setActive = async (p: Product, active: boolean) => {
    try {
      if (active) await api.patch(`/me/products/${p.id}`, { is_active: true })
      else await api.del(`/me/products/${p.id}`)
      toast.add({ title: active ? "Produk diaktifkan lagi." : "Produk diarsipkan.", type: "success" })
      await q.reload()
      void revalidate("user", "/me/products")
    } catch (e) {
      if (isApiError(e) && (e.code === "conflict" || e.code === "has_active_relations")) setBlocked(true)
      else handleApiError(e, { onReload: q.reload })
    }
  }

  return (
    <AppShell role="umkm" title="Produk" width="wide">
      <PageHeading
        title="Produk saya"
        actions={
          <Link href="/umkm/produk/baru" className={buttonVariants()}>
            <IconPlus data-icon="inline-start" /> Produk
          </Link>
        }
      />

      <div className="flex flex-col gap-4">
        <label className="flex h-11 items-center gap-3 border-b border-input bg-transparent focus-within:border-ring">
          <IconSearch className="size-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama produk…"
            className="h-full flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
          />
        </label>
        <FilterChips
          label="Kategori"
          value={category}
          onChange={setCategory}
          options={[{ value: "all", label: "Semua kategori" }, ...CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))]}
        />
      </div>

      <div className="flex border-b">
        {(
          [
            ["active", "Aktif"],
            ["archived", "Diarsipkan"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={
              "relative -mb-px px-5 py-3 text-xs font-semibold tracking-widest uppercase outline-none focus-visible:bg-background " +
              (tab === value ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground")
            }
          >
            {label} ({products.filter((p) => p.is_active === (value === "active")).length})
          </button>
        ))}
      </div>

      {q.error && !q.data ? (
        <LoadError error={q.error} onRetry={q.reload} />
      ) : q.loading ? (
        <ListSkeleton rows={4} />
      ) : list.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {list.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              href={`/umkm/produk/${p.id}/ubah`}
              menu={
                p.is_active
                  ? [
                      { label: "Ubah", onSelect: () => router.push(`/umkm/produk/${p.id}/ubah`) },
                      { label: "Arsipkan", onSelect: () => setArchiving(p), destructive: true },
                    ]
                  : [
                      {
                        label: "Aktifkan lagi",
                        onSelect: () => void setActive(p, true),
                      },
                    ]
              }
            />
          ))}
        </div>
      ) : tab === "active" && !search && category === "all" ? (
        <EmptyState
          icon={IconBox}
          action={
            <Link href="/umkm/produk/baru" className={buttonVariants()}>
              Tambah produk
            </Link>
          }
        >
          Belum ada produk. Tambahkan produk agar bisa mengajukan ke toko.
        </EmptyState>
      ) : (
        <EmptyState icon={IconBox}>
          {tab === "archived" ? "Tidak ada produk yang diarsipkan." : "Tidak ada produk yang cocok dengan pencarian."}
        </EmptyState>
      )}

      <ConfirmDialog
        open={!!archiving}
        onOpenChange={(o) => !o && setArchiving(null)}
        title={`Arsipkan ${archiving?.name ?? ""}?`}
        description="Produk tidak bisa dipilih untuk pengajuan baru."
        confirmLabel="Ya, arsipkan"
        destructive
        onConfirm={() => {
          if (archiving) void setActive(archiving, false)
          setArchiving(null)
        }}
      />
      <ConfirmDialog
        open={blocked}
        onOpenChange={setBlocked}
        title="Tidak bisa diarsipkan"
        description="Produk masih ada di pengajuan aktif."
        confirmLabel="Mengerti"
        onConfirm={() => {}}
      />
    </AppShell>
  )
}
