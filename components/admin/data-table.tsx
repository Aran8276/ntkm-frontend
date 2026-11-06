"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconDots,
  IconDownload,
  IconFilterOff,
  IconSearch,
  IconX,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { useUrlParams } from "@/hooks/use-url-params"

export interface Column<T> {
  key: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  /** Makes the column sortable (ordering=<key> / -<key>). */
  sort?: (row: T) => string | number | null
  className?: string
}

export interface FilterOption {
  value: string
  label: string
  description?: string
}

export interface FilterDef<T> {
  /** URL param name (e.g. "status", "store_id"). */
  key: string
  label: string
  options: FilterOption[]
  multiple?: boolean
  /** Shows a search box (entity picker filters). */
  searchable?: boolean
  match: (row: T, value: string) => boolean
}

export interface ToggleDef<T> {
  key: string
  label: string
  match: (row: T) => boolean
}

export interface RowAction {
  label: string
  onSelect: () => void
  destructive?: boolean
}

export interface QuickTab<T> {
  value: string
  label: string
  match: (row: T) => boolean
  count?: boolean
}

interface DataTableProps<T> {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  rowHref?: (row: T) => string
  /** Alternative to rowHref, e.g. open a side panel. */
  onRowClick?: (row: T) => void
  rowMenu?: (row: T) => (RowAction | false | null | undefined)[]
  search?: { placeholder: string; text: (row: T) => string }
  filters?: FilterDef<T>[]
  toggles?: ToggleDef<T>[]
  /** Rows with a deleted_at are hidden unless "Tampilkan yang dihapus" is on. */
  isDeleted?: (row: T) => boolean
  quickTabs?: QuickTab<T>[]
  defaultOrdering?: string
  /** CSV resource name(s) for "Ekspor CSV". */
  exportResources?: string[]
  createAction?: React.ReactNode
  emptyText: React.ReactNode
  emptyAction?: React.ReactNode
  /** Extra controls rendered at the end of the toolbar. */
  toolbarExtra?: React.ReactNode
  loading?: boolean
  pageSizes?: number[]
}

/** Admin data table: toolbar, filter bar, sortable header, row menu, pagination — all URL-backed. */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  rowHref,
  onRowClick,
  rowMenu,
  search,
  filters = [],
  toggles = [],
  isDeleted,
  quickTabs,
  defaultOrdering = "-created_at",
  exportResources,
  createAction,
  emptyText,
  emptyAction,
  toolbarExtra,
  loading,
  pageSizes = [25, 50, 100],
}: DataTableProps<T>) {
  const router = useRouter()
  const { get, set } = useUrlParams()

  // --- URL state ---------------------------------------------------------
  const query = get("search") ?? ""
  const ordering = get("ordering") ?? defaultOrdering
  const page = Math.max(1, Number(get("page") ?? 1))
  const pageSize = Number(get("page_size") ?? pageSizes[0])
  const includeDeleted = get("include_deleted") === "true"
  const quick = get("view") ?? quickTabs?.[0]?.value
  const filterValues = Object.fromEntries(filters.map((f) => [f.key, get(f.key)?.split(",").filter(Boolean) ?? []]))
  const toggleValues = Object.fromEntries(toggles.map((t) => [t.key, get(t.key) === "true"]))

  const activeFilterCount =
    Object.values(filterValues).filter((v) => v.length).length +
    Object.values(toggleValues).filter(Boolean).length +
    (includeDeleted ? 1 : 0) +
    (query ? 1 : 0)

  // --- Search input with 400 ms debounce + "/" shortcut ------------------
  const [draft, setDraft] = React.useState(query)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [prevQuery, setPrevQuery] = React.useState(query)
  if (prevQuery !== query) {
    setPrevQuery(query)
    setDraft(query)
  }
  React.useEffect(() => {
    if (draft === query) return
    const t = setTimeout(() => set({ search: draft.trim() || null, page: null }), 400)
    return () => clearTimeout(t)
  }, [draft, query, set])
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key !== "/" || el.closest("input, textarea, [contenteditable=true]")) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // --- Filtering, sorting, paging ---------------------------------------
  const quickTab = quickTabs?.find((q) => q.value === quick)
  const base = rows.filter((r) => includeDeleted || !isDeleted?.(r))
  const filtered = base.filter((r) => {
    if (quickTab && !quickTab.match(r)) return false
    if (query && search && !search.text(r).toLowerCase().includes(query.toLowerCase())) return false
    for (const f of filters) {
      const vals = filterValues[f.key]
      if (vals.length && !vals.some((v) => f.match(r, v))) return false
    }
    for (const t of toggles) if (toggleValues[t.key] && !t.match(r)) return false
    return true
  })

  const desc = ordering.startsWith("-")
  const sortKey = ordering.replace(/^-/, "")
  const sortCol = columns.find((c) => c.key === sortKey && c.sort)
  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const va = sortCol.sort!(a)
        const vb = sortCol.sort!(b)
        if (va == null) return 1
        if (vb == null) return -1
        const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "id")
        return desc ? -cmp : cmp
      })
    : filtered

  const total = sorted.length
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(page, pages)
  const visible = sorted.slice((current - 1) * pageSize, current * pageSize)

  const clearAll = () =>
    set({
      search: null,
      include_deleted: null,
      page: null,
      ...Object.fromEntries(filters.map((f) => [f.key, null])),
      ...Object.fromEntries(toggles.map((t) => [t.key, null])),
    })

  const toggleSort = (key: string) =>
    set({ ordering: sortKey === key ? (desc ? key : `-${key}`) : key, page: null })

  const exportCsv = (resource: string) =>
    toast.add({ title: `Ekspor dimulai: ${resource}.csv`, description: "Memakai filter yang sedang aktif.", type: "info" })

  const hasMenu = !!rowMenu

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {search && (
          <label className="flex h-10 min-w-0 flex-1 items-center gap-3 border-b border-input bg-transparent focus-within:border-ring sm:max-w-md">
            <IconSearch className="size-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={search.placeholder}
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden border px-1.5 py-0.5 font-mono text-[0.625rem] text-muted-foreground sm:inline">/</kbd>
          </label>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {toolbarExtra}
          {exportResources?.length === 1 && (
            <Button variant="outline" onClick={() => exportCsv(exportResources[0])}>
              <IconDownload data-icon="inline-start" /> Ekspor CSV
            </Button>
          )}
          {exportResources && exportResources.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" />}>
                <IconDownload data-icon="inline-start" /> Ekspor CSV <IconChevronDown data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {exportResources.map((r) => (
                  <DropdownMenuItem key={r} onClick={() => exportCsv(r)}>
                    {r}.csv
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {createAction}
        </div>
      </div>

      {/* Quick views */}
      {quickTabs && (
        <div className="flex gap-1 overflow-x-auto border-b [scrollbar-width:none]">
          {quickTabs.map((q) => {
            const active = q.value === quick
            const n = q.count ? base.filter(q.match).length : null
            return (
              <button
                key={q.value}
                type="button"
                onClick={() => set({ view: q.value === quickTabs[0].value ? null : q.value, page: null })}
                aria-pressed={active}
                className={cn(
                  "relative -mb-px flex shrink-0 items-center gap-2 px-4 py-3 text-xs font-semibold tracking-widest whitespace-nowrap uppercase outline-none focus-visible:bg-background",
                  active ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {q.label}
                {n != null && n > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center bg-destructive px-1 text-[0.625rem] text-white">{n}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Filter bar */}
      {(filters.length > 0 || toggles.length > 0 || isDeleted) && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((f) => (
              <FilterButton
                key={f.key}
                def={f}
                values={filterValues[f.key]}
                onChange={(vals) => set({ [f.key]: vals.join(",") || null, page: null })}
              />
            ))}
            {toggles.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={toggleValues[t.key]}
                onClick={() => set({ [t.key]: toggleValues[t.key] ? null : "true", page: null })}
                className={filterTrigger(toggleValues[t.key])}
              >
                {toggleValues[t.key] && <IconCheck className="size-3.5" />}
                {t.label}
              </button>
            ))}
            {isDeleted && (
              <label className="ml-auto flex items-center gap-2.5 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                <Switch
                  size="sm"
                  checked={includeDeleted}
                  onCheckedChange={(v) => set({ include_deleted: v ? "true" : null, page: null })}
                />
                Tampilkan yang dihapus
              </label>
            )}
          </div>
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {query && <ActiveChip label={`Cari: “${query}”`} onRemove={() => set({ search: null, page: null })} />}
              {filters.flatMap((f) =>
                filterValues[f.key].map((v) => (
                  <ActiveChip
                    key={`${f.key}-${v}`}
                    label={`${f.label}: ${f.options.find((o) => o.value === v)?.label ?? v}`}
                    onRemove={() =>
                      set({ [f.key]: filterValues[f.key].filter((x) => x !== v).join(",") || null, page: null })
                    }
                  />
                ))
              )}
              {toggles
                .filter((t) => toggleValues[t.key])
                .map((t) => (
                  <ActiveChip key={t.key} label={t.label} onRemove={() => set({ [t.key]: null, page: null })} />
                ))}
              {includeDeleted && <ActiveChip label="Termasuk yang dihapus" onRemove={() => set({ include_deleted: null })} />}
              <Button variant="link" size="xs" onClick={clearAll} className="px-1">
                Hapus semua filter
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="min-w-0 bg-background shadow-sm ring-1 ring-foreground/5">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((c) => (
                <TableHead key={c.key} className={cn(c.className, "first:pl-5")}>
                  {c.sort ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-1.5 uppercase outline-none hover:text-foreground focus-visible:underline"
                      aria-label={`Urutkan menurut ${typeof c.header === "string" ? c.header : c.key}`}
                    >
                      {c.header}
                      {sortKey === c.key ? (
                        desc ? (
                          <IconArrowDown className="size-3.5 text-foreground" />
                        ) : (
                          <IconArrowUp className="size-3.5 text-foreground" />
                        )
                      ) : (
                        <IconArrowsSort className="size-3.5 opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </TableHead>
              ))}
              {hasMenu && <TableHead className="w-12 pr-5" aria-label="Aksi" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {columns.map((c) => (
                      <TableCell key={c.key} className="first:pl-5">
                        <Skeleton className="h-4 w-full max-w-32" />
                      </TableCell>
                    ))}
                    {hasMenu && <TableCell />}
                  </TableRow>
                ))
              : visible.map((row) => {
                  const href = rowHref?.(row)
                  const deleted = isDeleted?.(row)
                  const menu = rowMenu?.(row).filter(Boolean) as RowAction[] | undefined
                  return (
                    <TableRow
                      key={rowKey(row)}
                      data-deleted={deleted || undefined}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("a, button, [role=menu], [data-slot=dropdown-menu-content]")) return
                        if (onRowClick) return onRowClick(row)
                        if (!href) return
                        if (e.metaKey || e.ctrlKey) window.open(href, "_blank")
                        else router.push(href)
                      }}
                      onAuxClick={(e) => {
                        if (href && e.button === 1) window.open(href, "_blank")
                      }}
                      className={cn((href || onRowClick) && "cursor-pointer", "data-deleted:bg-muted/40 data-deleted:text-muted-foreground")}
                    >
                      {columns.map((c) => (
                        <TableCell key={c.key} className={cn(c.className, "first:pl-5")}>
                          {c.cell(row)}
                        </TableCell>
                      ))}
                      {hasMenu && (
                        <TableCell className="w-12 pr-5 text-right">
                          {menu && menu.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={<Button variant="ghost" size="icon-sm" aria-label="Aksi baris" />}
                              >
                                <IconDots className="size-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {menu.map((m, i) => (
                                  <React.Fragment key={m.label}>
                                    {m.destructive && i > 0 && !menu[i - 1].destructive && <DropdownMenuSeparator />}
                                    <DropdownMenuItem variant={m.destructive ? "destructive" : "default"} onClick={m.onSelect}>
                                      {m.label}
                                    </DropdownMenuItem>
                                  </React.Fragment>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
          </TableBody>
        </Table>

        {!loading && total === 0 && (
          <div className="flex flex-col items-center gap-4 border-t px-6 py-14 text-center">
            {activeFilterCount > 0 || quickTab !== quickTabs?.[0] ? (
              <>
                <IconFilterOff className="size-8 text-muted-foreground" stroke={1.5} />
                <p className="text-sm text-foreground/80">Tidak ada data yang cocok dengan filter.</p>
                {activeFilterCount > 0 && (
                  <Button variant="outline" onClick={clearAll}>
                    Hapus semua filter
                  </Button>
                )}
              </>
            ) : (
              <>
                <p className="max-w-md text-sm text-foreground/80">{emptyText}</p>
                {emptyAction}
              </>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t px-5 py-3 text-sm">
            <span className="text-muted-foreground tabular-nums">
              Menampilkan {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, total)} dari {total}
            </span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Per halaman
                <select
                  value={pageSize}
                  onChange={(e) => set({ page_size: e.target.value === String(pageSizes[0]) ? null : e.target.value, page: null })}
                  className="h-8 border-b border-input bg-transparent pr-1 text-sm text-foreground outline-none focus:border-ring"
                >
                  {pageSizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <nav aria-label="Paginasi" className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={current <= 1}
                  onClick={() => set({ page: current - 1 <= 1 ? null : String(current - 1) })}
                  aria-label="Halaman sebelumnya"
                >
                  <IconChevronLeft />
                </Button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === current ? "outline" : "ghost"}
                    size="icon-sm"
                    aria-current={p === current ? "page" : undefined}
                    onClick={() => set({ page: p === 1 ? null : String(p) })}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={current >= pages}
                  onClick={() => set({ page: String(current + 1) })}
                  aria-label="Halaman berikutnya"
                >
                  <IconChevronRight />
                </Button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const filterTrigger = (active: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 items-center gap-2 border px-3.5 text-[0.6875rem] font-semibold tracking-widest whitespace-nowrap uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
    active
      ? "border-foreground/20 bg-background text-foreground"
      : "border-transparent bg-background/70 text-muted-foreground hover:bg-background hover:text-foreground"
  )

function FilterButton<T>({
  def,
  values,
  onChange,
}: {
  def: FilterDef<T>
  values: string[]
  onChange: (values: string[]) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const options = def.options.filter(
    (o) => !q || `${o.label} ${o.description ?? ""}`.toLowerCase().includes(q.toLowerCase())
  )
  const pick = (v: string) => {
    if (def.multiple) onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v])
    else {
      onChange(values[0] === v ? [] : [v])
      setOpen(false)
    }
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={filterTrigger(values.length > 0)}>
        {def.label}
        {values.length > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center bg-foreground px-1 text-[0.625rem] text-background">
            {values.length}
          </span>
        )}
        <IconChevronDown className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-0 p-1.5">
        {def.searchable && (
          <label className="mb-1 flex h-9 items-center gap-2 border-b px-2">
            <IconSearch className="size-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Cari ${def.label.toLowerCase()}…`}
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>
        )}
        <div className="flex max-h-72 flex-col overflow-y-auto">
          {def.searchable && q.length > 0 && q.length < 2 ? (
            <p className="px-3 py-3 text-xs text-muted-foreground">Ketik minimal 2 karakter.</p>
          ) : options.length ? (
            options.map((o) => {
              const checked = values.includes(o.value)
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => pick(o.value)}
                  className="flex items-start gap-2.5 px-3 py-2 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center border",
                      !def.multiple && "rounded-full",
                      checked && "border-primary bg-primary text-primary-foreground"
                    )}
                  >
                    {checked && <IconCheck className="size-3" />}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{o.label}</span>
                    {o.description && <span className="truncate text-xs text-muted-foreground">{o.description}</span>}
                  </span>
                </button>
              )
            })
          ) : (
            <p className="px-3 py-3 text-xs text-muted-foreground">Tidak ada pilihan.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 bg-primary/10 pr-1 pl-2.5 text-xs text-primary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Hapus filter ${label}`}
        className="inline-flex size-5 items-center justify-center outline-none hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <IconX className="size-3" />
      </button>
    </span>
  )
}

/** Fallback for Suspense around URL-backed tables. */
export function TableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-full max-w-md bg-background" />
      <div className="bg-background p-5 shadow-sm">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-6 border-b py-3.5 last:border-0">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
