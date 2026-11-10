"use client"

import * as React from "react"
import {
  IconCopy,
  IconFileText,
  IconGripVertical,
  IconMinus,
  IconPhotoPlus,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconX,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import {
  DAY_LABEL,
  DAYS,
  calcCommission,
  formatRupiah,
} from "@/lib/format"
import type { Commission, Day, FileBrief, OperatingHour, ReceivingSlot } from "@/lib/types"
import { api, errorMessage, validateUploadFile, type ApiClient, type UploadPurpose } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/toast"

// ---------------------------------------------------------------------------
// Rupiah
// ---------------------------------------------------------------------------

/** Numeric keyboard, displays "12.500" with an "Rp" prefix, emits an integer. */
export function RupiahInput({
  value,
  onChange,
  id,
  placeholder = "0",
  className,
  invalid,
  ...rest
}: {
  value: number | null
  onChange: (value: number | null) => void
  id?: string
  placeholder?: string
  className?: string
  invalid?: boolean
} & Omit<React.ComponentProps<"input">, "value" | "onChange">) {
  const display = value == null ? "" : formatRupiah(value).replace("Rp", "")
  return (
    <div
      className={cn(
        "flex h-10 w-full items-center gap-2 border-b border-input transition-colors focus-within:border-ring",
        invalid && "border-destructive",
        className
      )}
    >
      <span className="text-sm text-muted-foreground">Rp</span>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={display}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "")
          onChange(digits ? Number(digits) : null)
        }}
        className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        {...rest}
      />
    </div>
  )
}

/** Number with a trailing unit ("hari", "%"). */
export function SuffixInput({
  suffix,
  className,
  ...props
}: React.ComponentProps<"input"> & { suffix: string }) {
  return (
    <div
      className={cn(
        "flex h-10 w-full items-center gap-2 border-b border-input transition-colors focus-within:border-ring",
        className
      )}
    >
      <input
        inputMode="numeric"
        className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        {...props}
      />
      <span className="text-sm text-muted-foreground">{suffix}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
  className,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label: string
  className?: string
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  return (
    <div className={cn("inline-flex h-10 items-stretch border", className)} role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        className="flex w-10 items-center justify-center outline-none hover:bg-muted focus-visible:bg-muted disabled:opacity-40"
        aria-label="Kurangi"
      >
        <IconMinus className="size-4" />
      </button>
      <input
        inputMode="numeric"
        value={value}
        aria-label={label}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/\D/g, "") || 0)
          onChange(clamp(n))
        }}
        className="w-14 border-x bg-transparent text-center text-sm tabular-nums outline-none focus-visible:bg-muted/50"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        className="flex w-10 items-center justify-center outline-none hover:bg-muted focus-visible:bg-muted disabled:opacity-40"
        aria-label="Tambah"
      >
        <IconPlus className="size-4" />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chips (multi-select)
// ---------------------------------------------------------------------------

export function ChoiceChips<T extends string | number>({
  options,
  value,
  onChange,
  multiple = true,
  label,
}: {
  options: { value: T; label: string }[]
  value: T[]
  onChange: (value: T[]) => void
  multiple?: boolean
  label?: string
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => {
        const active = value.includes(o.value)
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={active}
            onClick={() =>
              onChange(
                multiple
                  ? active
                    ? value.filter((v) => v !== o.value)
                    : [...value, o.value]
                  : [o.value]
              )
            }
            className={cn(
              "inline-flex h-9 items-center gap-1.5 border px-4 text-xs font-semibold tracking-wider uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

const normalizeTag = (t: string) => t.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 30)

export function TagInput({
  value,
  onChange,
  max = 10,
  placeholder = "pedas, oleh-oleh",
  id,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  max?: number
  placeholder?: string
  id?: string
}) {
  const [draft, setDraft] = React.useState("")
  const commit = (raw: string) => {
    const next = raw
      .split(",")
      .map(normalizeTag)
      .filter(Boolean)
      .filter((t, i, arr) => arr.indexOf(t) === i && !value.includes(t))
    if (next.length) onChange([...value, ...next].slice(0, max))
    setDraft("")
  }
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 border-b border-input py-1.5 focus-within:border-ring">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 bg-muted py-1 pr-1 pl-2 text-xs">
          #{t}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== t))}
            className="p-0.5 outline-none hover:bg-foreground/10 focus-visible:bg-foreground/10"
            aria-label={`Hapus tagar ${t}`}
          >
            <IconX className="size-3" />
          </button>
        </span>
      ))}
      {value.length < max && (
        <input
          id={id}
          value={draft}
          placeholder={value.length ? "" : placeholder}
          onChange={(e) => {
            if (e.target.value.includes(",")) commit(e.target.value)
            else setDraft(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commit(draft)
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1))
            }
          }}
          onBlur={() => draft && commit(draft)}
          className="h-7 min-w-24 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
      )}
      <span className="ml-auto text-xs text-muted-foreground tabular-nums">
        {value.length}/{max}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

interface UploadItem {
  key: string
  name: string
  preview: string | null
  progress: number
  failed: boolean
  /** Id from `POST /uploads` (or of an existing file). */
  fileId?: string
  /** Kept for "Ulangi" after a failed upload. */
  file?: File
  /** Viewable URL (existing file or uploaded). */
  url?: string | null
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

/**
 * Photo/document upload: client validation (jpg/png/webp/pdf, ≤ 5 MB) →
 * `POST /uploads` with `purpose` → preview; emits the ordered file ids
 * (`*_file_id(s)`). Drag to reorder; the first photo is marked "Utama".
 */
export function FileUpload({
  purpose,
  client = api,
  initial = [],
  onChange,
  max = 5,
  accept = "image/jpeg,image/png,image/webp",
  variant = "photo",
  label = "Tambah foto",
  markPrimary = true,
  onCountChange,
}: {
  purpose: UploadPurpose
  /** `api` (PWA) or `adminApi` (admin uploads on behalf of an owner). */
  client?: ApiClient
  /** Files already attached (edit forms). */
  initial?: FileBrief[]
  /** Ordered ids of successfully uploaded files. */
  onChange?: (ids: string[]) => void
  max?: number
  accept?: string
  variant?: "photo" | "document"
  label?: string
  markPrimary?: boolean
  onCountChange?: (count: number) => void
}) {
  const [items, setItems] = React.useState<UploadItem[]>(() =>
    initial.map((f) => ({
      key: f.id,
      name: f.name,
      preview: f.url && f.mime?.startsWith("image/") ? f.url : null,
      url: f.url,
      progress: 100,
      failed: false,
      fileId: f.id,
    }))
  )
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dragFrom = React.useRef<number | null>(null)
  const ready = items.filter((i) => i.fileId && !i.failed)
  const count = ready.length
  const idsKey = ready.map((i) => i.fileId).join(",")

  const cbRef = React.useRef({ onChange, onCountChange })
  React.useEffect(() => {
    cbRef.current = { onChange, onCountChange }
  })
  React.useEffect(() => {
    cbRef.current.onCountChange?.(count)
    cbRef.current.onChange?.(idsKey ? idsKey.split(",") : [])
  }, [count, idsKey])

  const patch = (key: string, p: Partial<UploadItem>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...p } : it)))

  const upload = async (key: string, file: File) => {
    patch(key, { progress: 35, failed: false })
    try {
      const res = await client.upload(file, purpose)
      patch(key, { progress: 100, fileId: res.id, url: res.url })
    } catch (e) {
      patch(key, { failed: true })
      toast.add({ title: `${file.name}: ${errorMessage(e, "gagal mengunggah.")}`, type: "error" })
    }
  }

  const onFiles = (files: FileList | null) => {
    if (!files) return
    const room = max - items.length
    const accepted: UploadItem[] = []
    for (const f of Array.from(files).slice(0, room)) {
      if (!ACCEPTED.includes(f.type) || !accept.split(",").includes(f.type)) {
        toast.add({ title: `${f.name}: format tidak didukung.`, type: "error" })
        continue
      }
      const invalid = validateUploadFile(f, purpose)
      if (invalid) {
        toast.add({ title: `${f.name}: ${invalid}`, type: "error" })
        continue
      }
      accepted.push({
        key: `${f.name}-${f.lastModified}-${Math.random()}`,
        name: f.name,
        preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
        progress: 0,
        failed: false,
        file: f,
      })
    }
    setItems((prev) => [...prev, ...accepted])
    accepted.forEach((a) => void upload(a.key, a.file!))
  }

  const retry = (it: UploadItem) => {
    if (it.file) void upload(it.key, it.file)
  }

  const move = (from: number, to: number) =>
    setItems((prev) => {
      const next = [...prev]
      const [it] = next.splice(from, 1)
      next.splice(to, 0, it)
      return next
    })

  if (variant === "document") {
    return (
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <div key={it.key} className="flex items-center gap-3 border p-3">
            <span className="flex size-9 items-center justify-center bg-muted">
              <IconFileText className="size-4.5" stroke={1.75} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="truncate text-sm">{it.name}</span>
              {it.progress < 100 && !it.failed && <Progress value={it.progress} />}
              {it.failed && <span className="text-xs text-destructive">Gagal mengunggah</span>}
            </div>
            {it.failed ? (
              <Button variant="ghost" size="icon-sm" aria-label="Ulangi" onClick={() => retry(it)}>
                <IconRefresh />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="xs"
                disabled={it.progress < 100 || !it.url}
                onClick={() => it.url && window.open(it.url, "_blank", "noopener")}
              >
                Lihat
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Hapus ${it.name}`}
              onClick={() => setItems((p) => p.filter((x) => x.key !== it.key))}
            >
              <IconTrash />
            </Button>
          </div>
        ))}
        {items.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-14 items-center justify-center gap-2 border border-dashed text-xs font-semibold tracking-widest text-muted-foreground uppercase outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <IconPlus className="size-4" />
            {label} ({items.length}/{max})
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={(e) => {
            onFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {items.map((it, i) => (
          <div
            key={it.key}
            draggable={items.length > 1}
            onDragStart={() => (dragFrom.current = i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom.current != null && dragFrom.current !== i) move(dragFrom.current, i)
              dragFrom.current = null
            }}
            className={cn(
              "group relative aspect-square overflow-hidden bg-muted",
              it.failed && "ring-2 ring-destructive"
            )}
          >
            {it.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.preview} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center bg-[repeating-linear-gradient(135deg,var(--muted),var(--muted)_8px,var(--background)_8px,var(--background)_16px)] text-muted-foreground">
                <IconPhotoPlus className="size-6" stroke={1.25} />
              </div>
            )}
            {markPrimary && i === 0 && (
              <span className="absolute top-1.5 left-1.5 bg-foreground px-1.5 py-0.5 text-[0.5625rem] font-semibold tracking-widest text-background uppercase">
                Utama
              </span>
            )}
            {items.length > 1 && (
              <IconGripVertical className="absolute bottom-1.5 left-1.5 size-4 text-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
            )}
            <button
              type="button"
              onClick={() => setItems((p) => p.filter((x) => x.key !== it.key))}
              className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center bg-background/90 outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring/40"
              aria-label="Hapus foto"
            >
              <IconX className="size-3.5" />
            </button>
            {it.progress < 100 && !it.failed && (
              <div className="absolute inset-x-2 bottom-2">
                <Progress value={it.progress} />
              </div>
            )}
            {it.failed && (
              <button
                type="button"
                onClick={() => retry(it)}
                className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-destructive py-1 text-[0.625rem] font-semibold tracking-wider text-white uppercase"
              >
                <IconRefresh className="size-3" /> Ulangi
              </button>
            )}
          </div>
        ))}
        {items.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 border border-dashed text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <IconPlus className="size-5" />
            {label}
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        JPG, PNG, atau WEBP, maks 5 MB. {max > 1 && `${items.length}/${max} foto · seret untuk mengubah urutan.`}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={max > 1}
        hidden
        onChange={(e) => {
          onFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

export { LocationPicker } from "@/components/app/map"

// ---------------------------------------------------------------------------
// Operating hours
// ---------------------------------------------------------------------------

export const DEFAULT_HOURS: OperatingHour[] = DAYS.map((day) => ({
  day,
  open: "08:00",
  close: "21:00",
  is_closed: day === "sun",
}))

export function TimeInput({ className, ...props }: React.ComponentProps<"input">) {
  return <Input type="time" step={900} className={cn("w-[6.5rem] tabular-nums", className)} {...props} />
}

export function OperatingHoursEditor({
  value,
  onChange,
}: {
  value: OperatingHour[]
  onChange: (value: OperatingHour[]) => void
}) {
  const update = (day: Day, patch: Partial<OperatingHour>) =>
    onChange(value.map((h) => (h.day === day ? { ...h, ...patch } : h)))
  const first = value.find((h) => !h.is_closed)

  return (
    <div className="flex flex-col">
      {value.map((h) => {
        const invalid = !h.is_closed && h.close <= h.open
        return (
          <div key={h.day} className="flex flex-col gap-1 border-b py-3 last:border-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="w-16 text-sm font-medium">{DAY_LABEL[h.day]}</span>
              <label className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
                <Switch checked={!h.is_closed} onCheckedChange={(c) => update(h.day, { is_closed: !c })} />
                <span className={cn("w-10", h.is_closed && "text-muted-foreground")}>{h.is_closed ? "Tutup" : "Buka"}</span>
              </label>
              {!h.is_closed && (
                <div className="flex items-center gap-2">
                  <TimeInput
                    value={h.open}
                    onChange={(e) => update(h.day, { open: e.target.value })}
                    aria-label={`Jam buka ${DAY_LABEL[h.day]}`}
                  />
                  <span className="text-muted-foreground">–</span>
                  <TimeInput
                    value={h.close}
                    aria-invalid={invalid || undefined}
                    onChange={(e) => update(h.day, { close: e.target.value })}
                    aria-label={`Jam tutup ${DAY_LABEL[h.day]}`}
                  />
                </div>
              )}
            </div>
            {invalid && <p className="text-sm text-destructive">Jam tutup harus setelah jam buka.</p>}
          </div>
        )
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 self-start"
        disabled={!first}
        onClick={() =>
          first && onChange(value.map((h) => ({ ...h, open: first.open, close: first.close, is_closed: false })))
        }
      >
        <IconCopy data-icon="inline-start" />
        Salin ke semua hari
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Receiving schedule
// ---------------------------------------------------------------------------

export function ReceivingScheduleEditor({
  value,
  onChange,
  hours,
}: {
  value: ReceivingSlot[]
  onChange: (value: ReceivingSlot[]) => void
  hours: OperatingHour[]
}) {
  const hourOf = (d: Day) => hours.find((h) => h.day === d)
  const update = (i: number, patch: Partial<ReceivingSlot>) =>
    onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)))
  const firstOpen = hours.find((h) => !h.is_closed)

  return (
    <div className="flex flex-col gap-3">
      {value.map((s, i) => {
        const h = hourOf(s.day)
        const outside = !h || h.is_closed || s.start < h.open || s.end > h.close || s.end <= s.start
        return (
          <div key={i} className="flex flex-col gap-1.5 bg-muted/50 p-3">
            <div className="flex flex-wrap items-end gap-3">
              <NativeSelect
                value={s.day}
                onChange={(e) => update(i, { day: e.target.value as Day })}
                className="w-32"
                aria-label="Hari"
              >
                {DAYS.map((d) => (
                  <NativeSelectOption key={d} value={d} disabled={hourOf(d)?.is_closed}>
                    {DAY_LABEL[d]}
                    {hourOf(d)?.is_closed ? " (tutup)" : ""}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <TimeInput value={s.start} onChange={(e) => update(i, { start: e.target.value })} aria-label="Jam mulai" />
              <span className="pb-2.5 text-muted-foreground">–</span>
              <TimeInput value={s.end} onChange={(e) => update(i, { end: e.target.value })} aria-label="Jam selesai" />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="ml-auto"
                aria-label="Hapus slot"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              >
                <IconTrash />
              </Button>
            </div>
            {outside && <p className="text-sm text-destructive">Toko tutup pada jam ini.</p>}
          </div>
        )
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() =>
          onChange([...value, { day: firstOpen?.day ?? "mon", start: "08:00", end: "10:00" }])
        }
      >
        <IconPlus data-icon="inline-start" />
        Tambah slot
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Commission calculator
// ---------------------------------------------------------------------------

export function CommissionCalculator({
  commission,
  price,
  onPriceChange,
  compact,
}: {
  commission: Commission
  price: number
  onPriceChange?: (n: number) => void
  compact?: boolean
}) {
  const { commission: c, income } = calcCommission(price, commission)
  if (compact) {
    return (
      <p className="text-sm text-muted-foreground">
        Komisi toko <span className="font-medium text-foreground">{formatRupiah(c)}</span> · UMKM menerima{" "}
        <span className="font-medium text-foreground">{formatRupiah(income)}</span> per unit
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-4 bg-muted/60 p-5">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
            Contoh harga jual
          </span>
          {onPriceChange ? (
            <RupiahInput value={price} onChange={(n) => onPriceChange(n ?? 0)} className="w-40" aria-label="Contoh harga jual" />
          ) : (
            <span className="text-2xl font-medium tabular-nums">{formatRupiah(price)}</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border">
        <div className="flex flex-col gap-1 bg-background p-4">
          <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
            Komisi toko{commission.type === "percent" && ` ${commission.value}%`}
          </span>
          <span className="text-lg font-medium tabular-nums">{formatRupiah(c)}</span>
        </div>
        <div className="flex flex-col gap-1 bg-background p-4">
          <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
            UMKM menerima
          </span>
          <span className="text-lg font-medium text-primary tabular-nums">{formatRupiah(income)}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Per unit terjual. Angka final dihitung oleh sistem.</p>
    </div>
  )
}

/** Character counter shown under textareas. */
export function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <span className={cn("text-xs tabular-nums", value.length > max ? "text-destructive" : "text-muted-foreground")}>
      {value.length}/{max}
    </span>
  )
}
