"use client"

import * as React from "react"
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconExternalLink,
  IconFileTypePdf,
  IconLock,
  IconPhoto,
  IconRotateClockwise,
  IconSearch,
  IconSelector,
  IconX,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import type { FileBrief } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export interface EntityOption {
  value: string
  label: string
  description?: string
  disabledReason?: string
}

/**
 * "Pemilih entitas": searchable combobox (≥ 2 characters) used as table
 * filter and as form field. Ineligible options stay visible but disabled.
 */
export function EntityPicker({
  id,
  options,
  value,
  onChange,
  placeholder = "Cari…",
  locked,
  invalid,
}: {
  id?: string
  options: EntityOption[]
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  /** Read-only display (e.g. owner can't be changed in edit mode). */
  locked?: boolean
  invalid?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const selected = options.find((o) => o.value === value)
  const results = q.length >= 2 ? options.filter((o) => `${o.label} ${o.description ?? ""}`.toLowerCase().includes(q.toLowerCase())) : options.slice(0, 10)

  if (locked) {
    return (
      <div className="flex min-h-10 items-center gap-3 border-b border-dashed border-input py-2 text-sm">
        <IconLock className="size-4 text-muted-foreground" />
        <span className="flex min-w-0 flex-col">
          <span className="font-medium">{selected?.label ?? "—"}</span>
          {selected?.description && <span className="text-xs text-muted-foreground">{selected.description}</span>}
        </span>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        aria-invalid={invalid || undefined}
        className="flex min-h-10 w-full items-center gap-3 border-b border-input py-2 text-left text-sm outline-none focus-visible:border-ring aria-invalid:border-destructive"
      >
        {selected ? (
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate font-medium">{selected.label}</span>
            {selected.description && <span className="truncate text-xs text-muted-foreground">{selected.description}</span>}
          </span>
        ) : (
          <span className="flex-1 text-muted-foreground">{placeholder}</span>
        )}
        {selected ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Kosongkan"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="inline-flex size-6 items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <IconX className="size-3.5" />
          </span>
        ) : (
          <IconSelector className="size-4 text-muted-foreground" />
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) min-w-72 gap-0 p-1.5">
        <label className="mb-1 flex h-9 items-center gap-2 border-b px-2">
          <IconSearch className="size-3.5 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ketik minimal 2 karakter…"
            className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <div className="flex max-h-72 flex-col overflow-y-auto">
          {results.length ? (
            results.map((o) => (
              <button
                key={o.value}
                type="button"
                disabled={!!o.disabledReason}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                  setQ("")
                }}
                className="flex items-start gap-2.5 px-3 py-2 text-left outline-none hover:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm">{o.label}</span>
                  <span className="truncate text-xs text-muted-foreground">{o.disabledReason ?? o.description}</span>
                </span>
                {o.value === value && <IconCheck className="mt-0.5 size-4 text-primary" />}
              </button>
            ))
          ) : (
            <p className="px-3 py-3 text-xs text-muted-foreground">Tidak ditemukan.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Multi-select variant: selected entities appear as removable chips. */
export function EntityMultiPicker({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: EntityOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((v) => {
            const o = options.find((x) => x.value === v)
            return (
              <span key={v} className="inline-flex h-7 items-center gap-1 bg-muted pr-1 pl-2.5 text-xs">
                {o?.label}
                <button
                  type="button"
                  aria-label={`Hapus ${o?.label}`}
                  onClick={() => onChange(value.filter((x) => x !== v))}
                  className="inline-flex size-5 items-center justify-center hover:bg-foreground/10"
                >
                  <IconX className="size-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}
      <EntityPicker
        options={options.map((o) => (value.includes(o.value) ? { ...o, disabledReason: "Sudah dipilih" } : o))}
        value={null}
        onChange={(v) => v && onChange([...value, v])}
        placeholder={placeholder}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Document viewer
// ---------------------------------------------------------------------------

/** "Penampil dokumen": image with zoom & rotate, PDF in an embedded viewer. */
export function DocumentViewer({ files, className }: { files: Pick<FileBrief, "id" | "name" | "mime" | "url">[]; className?: string }) {
  const [index, setIndex] = React.useState(0)
  const [zoom, setZoom] = React.useState(1)
  const [rotate, setRotate] = React.useState(0)
  const file = files[Math.min(index, files.length - 1)]

  if (!file) {
    return (
      <div className={cn("flex aspect-[4/3] items-center justify-center bg-muted text-sm text-muted-foreground", className)}>
        Belum ada dokumen.
      </div>
    )
  }

  const pdf = file.mime === "application/pdf"
  const go = (d: number) => {
    setIndex((i) => (i + d + files.length) % files.length)
    setZoom(1)
    setRotate(0)
  }

  return (
    <div className={cn("flex flex-col border bg-background", className)}>
      <div className="flex items-center gap-1 border-b px-2 py-1.5">
        {files.length > 1 && (
          <>
            <Button variant="ghost" size="icon-sm" onClick={() => go(-1)} aria-label="Dokumen sebelumnya">
              <IconChevronLeft />
            </Button>
            <span className="px-1 text-xs text-muted-foreground tabular-nums">
              {index + 1}/{files.length}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => go(1)} aria-label="Dokumen berikutnya">
              <IconChevronRight />
            </Button>
          </>
        )}
        <span className="mx-2 min-w-0 flex-1 truncate text-xs font-medium">{file.name}</span>
        {!pdf && (
          <>
            <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} aria-label="Perkecil">
              <IconZoomOut />
            </Button>
            <span className="w-10 text-center text-xs text-muted-foreground tabular-nums">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.min(3, z + 0.25))} aria-label="Perbesar">
              <IconZoomIn />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setRotate((r) => (r + 90) % 360)} aria-label="Putar">
              <IconRotateClockwise />
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!file.url}
          render={<a href={file.url ?? undefined} target="_blank" rel="noreferrer" />}
          nativeButton={false}
          aria-label="Buka di tab baru"
        >
          <IconExternalLink />
        </Button>
      </div>
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted">
        {!file.url ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {pdf ? <IconFileTypePdf className="size-10" stroke={1.25} /> : <IconPhoto className="size-10" stroke={1.25} />}
            <span className="text-xs">File sudah dihapus.</span>
          </div>
        ) : pdf ? (
          <iframe src={file.url} title={file.name} className="size-full bg-background" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- uploaded file served by the API
          <img
            src={file.url}
            alt={file.name}
            className="max-h-full max-w-full object-contain transition-transform"
            style={{ transform: `scale(${zoom}) rotate(${rotate}deg)` }}
          />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Side panel (480 px drawer)
// ---------------------------------------------------------------------------

export function SidePanel({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-[480px]">
        <SheetHeader className="border-b pr-14">
          <SheetTitle className="leading-snug">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">{children}</div>
        {footer && <SheetFooter className="border-t">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}
