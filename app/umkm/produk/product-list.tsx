"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconBox, IconPlus, IconSearch } from "@tabler/icons-react"

import { CATEGORIES, MY_PRODUCTS } from "@/lib/mock-data"
import type { Product } from "@/lib/types"
import { buttonVariants } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { useQueryState } from "@/hooks/use-query-state"
import { AppShell } from "@/components/app/app-shell"
import { ConfirmDialog, EmptyState, FilterChips, PageHeading } from "@/components/app/blocks"
import { ProductCard } from "@/components/app/cards"

type Tab = "active" | "archived"

export function ProductList() {
  const router = useRouter()
  const [products, setProducts] = React.useState(MY_PRODUCTS)
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

  const list = products.filter(
    (p) =>
      p.is_active === (tab === "active") &&
      (category === "all" || String(p.category.id) === category) &&
      (!search || p.name.toLowerCase().includes(search))
  )

  const setActive = (p: Product, active: boolean) =>
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: active } : x)))

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
          options={[{ value: "all", label: "Semua kategori" }, ...CATEGORIES.map((c) => ({ value: String(c.id), label: c.name }))]}
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

      {list.length ? (
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
                        onSelect: () => {
                          setActive(p, true)
                          toast.add({ title: "Produk diaktifkan lagi.", type: "success" })
                        },
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
          if (!archiving) return
          // Mock 409: product still in an active application.
          if (archiving.active_placements > 0) setBlocked(true)
          else {
            setActive(archiving, false)
            toast.add({ title: "Produk diarsipkan.", type: "success" })
          }
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
