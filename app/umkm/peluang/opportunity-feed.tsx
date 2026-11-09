"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  IconAdjustmentsHorizontal,
  IconChevronDown,
  IconCurrentLocation,
  IconMapPin,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import type { Paginated } from "@/lib/api"
import { useApi } from "@/lib/use-api"
import type { Category, MatchLevel, Opportunity, Product } from "@/lib/types"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useQueryState } from "@/hooks/use-query-state"
import { AppShell } from "@/components/app/app-shell"
import { EmptyState, ListSkeleton, PageHeading } from "@/components/app/blocks"
import { LoadError } from "@/components/app/feedback"
import { OpportunityCard } from "@/components/app/cards"
import { ChoiceChips } from "@/components/app/inputs"

const RADII = ["1", "3", "5", "10", "25"] as const
type Radius = (typeof RADII)[number]
type MatchFilter = "all" | MatchLevel
type Sort = "match" | "distance" | "newest"

const MATCH_LABEL: Record<MatchFilter, string> = {
  all: "Semua",
  high: "Sangat cocok",
  medium: "Cocok",
  low: "Kurang cocok",
}
const SORT_LABEL: Record<Sort, string> = { match: "Paling cocok", distance: "Terdekat", newest: "Terbaru" }

/** P15 · Cari peluang: `GET /opportunities` with filters kept in the URL. */
export function OpportunityFeed() {
  const productsQ = useApi<Paginated<Product>>("user", "/me/products", { is_active: true, page_size: 100 })
  const categoriesQ = useApi<Category[]>("user", "/categories")
  const CATEGORIES = categoriesQ.data ?? []
  const myProducts = productsQ.data?.results ?? []
  /** Default category filter = categories (slugs) of my active products. */
  const DEFAULT_CATEGORIES = [...new Set(myProducts.map((p) => p.category.slug))].sort().join(",")
  const router = useRouter()
  const pathname = usePathname()
  const [radius, setRadius] = useQueryState<Radius>("radius_km", "5")
  const [categoryParam, setCategoryParam] = useQueryState<string>("category", DEFAULT_CATEGORIES)
  const [match, setMatch] = useQueryState<MatchFilter>("match", "all")
  const [sort, setSort] = useQueryState<Sort>("sort", "match")
  const [source, setSource] = React.useState<"business" | "gps">("business")
  const [catSheet, setCatSheet] = React.useState(false)
  const [draftCats, setDraftCats] = React.useState<string[]>([])
  const [gps, setGps] = React.useState<{ lat: number; lng: number } | null>(null)

  const categories = categoryParam ? categoryParam.split(",") : []
  const hasActiveProducts = myProducts.length > 0

  const locate = () => {
    if (!("geolocation" in navigator)) {
      toast.add({ title: "Perangkat ini tidak mendukung lokasi.", type: "error" })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setSource("gps")
      },
      () => toast.add({ title: "Izin lokasi ditolak. Memakai lokasi usaha.", type: "error" })
    )
  }

  // Wait for products so the default category filter is known before the first request.
  const ready = !productsQ.loading
  const feedQ = useApi<Paginated<Opportunity>>("user", ready ? "/opportunities" : null, {
    radius_km: radius,
    category: categories,
    match: match === "all" ? undefined : match,
    sort,
    lat: source === "gps" ? gps?.lat : undefined,
    lng: source === "gps" ? gps?.lng : undefined,
    page_size: 100,
  })
  const results = feedQ.data?.results ?? []

  const nextRadius = RADII[RADII.indexOf(radius) + 1]
  const isDefault = radius === "5" && categoryParam === DEFAULT_CATEGORIES && match === "all" && sort === "match"

  // Clear every filter param in a single navigation.
  const reset = () => router.replace(pathname, { scroll: false })

  return (
    <AppShell role="umkm" title="Cari peluang" width="wide">
      <PageHeading
        title="Cari peluang"
        description={
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:underline">
              {source === "business" ? <IconMapPin className="size-4" /> : <IconCurrentLocation className="size-4" />}
              {source === "business" ? "Dari lokasi usaha Anda" : "Dari lokasi saat ini"}
              <IconChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuItem onClick={() => setSource("business")}>
                <IconMapPin /> Lokasi usaha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={locate}>
                <IconCurrentLocation /> Gunakan lokasi saat ini
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Filter bar */}
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0">
        <FilterMenu
          label="Jarak"
          value={`${radius} km`}
          active={radius !== "5"}
          options={RADII.map((r) => ({ label: `${r} km`, onSelect: () => setRadius(r) }))}
        />
        <button
          type="button"
          onClick={() => {
            setDraftCats(categories)
            setCatSheet(true)
          }}
          className={filterBtn(categoryParam !== DEFAULT_CATEGORIES)}
        >
          Kategori{categories.length ? ` · ${categories.length}` : ""}
          <IconChevronDown className="size-3.5" />
        </button>
        <FilterMenu
          label="Kecocokan"
          value={MATCH_LABEL[match]}
          active={match !== "all"}
          options={(Object.keys(MATCH_LABEL) as MatchFilter[]).map((m) => ({ label: MATCH_LABEL[m], onSelect: () => setMatch(m) }))}
        />
        <FilterMenu
          label="Urutkan"
          value={SORT_LABEL[sort]}
          active={sort !== "match"}
          options={(Object.keys(SORT_LABEL) as Sort[]).map((s) => ({ label: SORT_LABEL[s], onSelect: () => setSort(s) }))}
        />
        {!isDefault && (
          <Button variant="ghost" size="sm" onClick={reset} className="shrink-0">
            <IconRefresh data-icon="inline-start" /> Atur ulang
          </Button>
        )}
      </div>

      {!hasActiveProducts && (
        <Link href="/umkm/produk/baru?return=/umkm/peluang" className="flex items-center justify-between gap-4 bg-primary p-5 text-sm text-primary-foreground">
          Tambahkan produk dulu agar bisa mengajukan.
          <span className="text-xs font-semibold tracking-widest uppercase">Tambah produk →</span>
        </Link>
      )}

      {feedQ.error && !feedQ.data ? (
        <LoadError error={feedQ.error} onRetry={feedQ.reload} />
      ) : feedQ.loading ? (
        <ListSkeleton rows={4} />
      ) : results.length ? (
        <>
          <p className="text-sm text-muted-foreground">{feedQ.data?.count ?? results.length} peluang ditemukan</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {results.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} side="umkm" href={`/umkm/peluang/${o.id}`} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={IconSearch}
          action={
            nextRadius ? (
              <Button variant="outline" onClick={() => setRadius(nextRadius)}>
                Perluas ke {nextRadius} km
              </Button>
            ) : undefined
          }
        >
          Belum ada peluang dalam radius {radius} km.
        </EmptyState>
      )}

      <Sheet open={catSheet} onOpenChange={setCatSheet}>
        <SheetContent side="bottom" className="mx-auto max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <IconAdjustmentsHorizontal className="size-5" /> Kategori
            </SheetTitle>
            <SheetDescription>Default mengikuti kategori produk Anda.</SheetDescription>
            <div className="mt-4">
              <ChoiceChips
                label="Kategori"
                options={CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
                value={draftCats}
                onChange={setDraftCats}
              />
            </div>
          </SheetHeader>
          <SheetFooter className="flex-row pt-0">
            <Button variant="outline" onClick={() => setDraftCats([])}>
              Kosongkan
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setCategoryParam([...draftCats].sort().join(","))
                setCatSheet(false)
              }}
            >
              Terapkan
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </AppShell>
  )
}

const filterBtn = (active: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 items-center gap-2 border px-4 text-[0.6875rem] font-semibold tracking-widest whitespace-nowrap uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
    active ? "border-foreground/20 bg-background text-foreground" : "border-transparent bg-background/60 text-muted-foreground hover:bg-background"
  )

function FilterMenu({
  label,
  value,
  active,
  options,
}: {
  label: string
  value: string
  active: boolean
  options: { label: string; onSelect: () => void }[]
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={filterBtn(active)}>
        <span className="text-muted-foreground">{label}:</span> {value}
        <IconChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        {options.map((o) => (
          <DropdownMenuItem key={o.label} onClick={o.onSelect}>
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

