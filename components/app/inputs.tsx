"use client"

import * as React from "react"
import {
  IconCopy,
  IconCurrentLocation,
  IconFileText,
  IconGripVertical,
  IconMapPinFilled,
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
import type { Commission, Day, OperatingHour, ReceivingSlot } from "@/lib/types"
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
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const MAX_BYTES = 5 * 1024 * 1024

/**
 * Photo/document upload: client validation (jpg/png/webp/pdf, ≤ 5 MB),
 * simulated progress, drag to reorder, first photo marked "Utama".
 */
export function FileUpload({
  max = 5,
  accept = "image/jpeg,image/png,image/webp",
  variant = "photo",
  initialCount = 0,
  label = "Tambah foto",
  markPrimary = true,
  onCountChange,
}: {
  max?: number
  accept?: string
  variant?: "photo" | "document"
  initialCount?: number
  label?: string
  markPrimary?: boolean
  onCountChange?: (count: number) => void
}) {
  const [items, setItems] = React.useState<UploadItem[]>(() =>
    Array.from({ length: initialCount }, (_, i) => ({
      key: `existing-${i}`,
      name: variant === "document" ? `dokumen-${i + 1}.pdf` : `foto-${i + 1}.jpg`,
      preview: null,
      progress: 100,
      failed: false,
    }))
  )
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dragFrom = React.useRef<number | null>(null)
  const count = items.filter((i) => !i.failed).length

  React.useEffect(() => {
    onCountChange?.(count)
  }, [count, onCountChange])

  const simulate = (key: string, fail = false) => {
    let p = 0
    const t = setInterval(() => {
      p += 20
      setItems((prev) =>
        prev.map((it) =>
          it.key === key ? { ...it, progress: Math.min(p, 100), failed: fail && p >= 60 } : it
        )
      )
      if (p >= 100 || (fail && p >= 60)) clearInterval(t)
    }, 180)
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
      if (f.size > MAX_BYTES) {
        toast.add({ title: `${f.name}: ukuran melebihi 5 MB.`, type: "error" })
        continue
      }
      accepted.push({
        key: `${f.name}-${f.lastModified}-${Math.random()}`,
        name: f.name,
        preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
        progress: 0,
        failed: false,
      })
    }
    setItems((prev) => [...prev, ...accepted])
    accepted.forEach((a) => simulate(a.key))
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
              <Button variant="ghost" size="icon-sm" aria-label="Ulangi" onClick={() => simulate(it.key)}>
                <IconRefresh />
              </Button>
            ) : (
              <Button variant="ghost" size="xs" disabled={it.progress < 100}>
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
                onClick={() => simulate(it.key)}
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

/**
 * Map placeholder with a draggable pin. Swap the canvas for Leaflet/OSM when
 * wiring real data; the lat/lng contract stays the same.
 */
export function LocationPicker({
  lat: initialLat = -7.9467,
  lng: initialLng = 112.6159,
}: {
  lat?: number
  lng?: number
}) {
  const [pos, setPos] = React.useState({ x: 0.5, y: 0.5 })
  const [center, setCenter] = React.useState({ lat: initialLat, lng: initialLng })
  const [locating, setLocating] = React.useState(false)
  const boxRef = React.useRef<HTMLDivElement>(null)
  const dragging = React.useRef(false)

  const SPAN = 0.02
  const lat = center.lat + (0.5 - pos.y) * SPAN
  const lng = center.lng + (pos.x - 0.5) * SPAN

  const moveTo = (clientX: number, clientY: number) => {
    const r = boxRef.current?.getBoundingClientRect()
    if (!r) return
    setPos({
      x: Math.min(0.97, Math.max(0.03, (clientX - r.left) / r.width)),
      y: Math.min(0.95, Math.max(0.08, (clientY - r.top) / r.height)),
    })
  }

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.add({ title: "Perangkat tidak mendukung lokasi.", type: "error" })
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCenter({ lat: p.coords.latitude, lng: p.coords.longitude })
        setPos({ x: 0.5, y: 0.5 })
        setLocating(false)
      },
      () => {
        setLocating(false)
        toast.add({ title: "Izin lokasi ditolak. Geser pin secara manual.", type: "error" })
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={boxRef}
        className="relative h-56 touch-none overflow-hidden bg-[#e8ece9] select-none dark:bg-[#1f2624]"
        onPointerDown={(e) => {
          dragging.current = true
          ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
          moveTo(e.clientX, e.clientY)
        }}
        onPointerMove={(e) => dragging.current && moveTo(e.clientX, e.clientY)}
        onPointerUp={() => (dragging.current = false)}
        role="application"
        aria-label="Peta lokasi. Seret pin ke posisi yang tepat."
      >
        <svg className="absolute inset-0 size-full" aria-hidden preserveAspectRatio="none" viewBox="0 0 400 220">
          <g className="stroke-background" strokeWidth="10" fill="none">
            <path d="M-10 70 L410 50" />
            <path d="M-10 170 C120 160 260 190 410 150" />
            <path d="M120 -10 L140 230" />
            <path d="M290 -10 C280 80 300 140 270 230" />
          </g>
          <g className="stroke-background/70" strokeWidth="4" fill="none">
            <path d="M-10 120 L410 115" />
            <path d="M60 -10 L50 230" />
            <path d="M210 -10 L220 230" />
            <path d="M340 -10 L360 230" />
          </g>
          <rect x="150" y="80" width="50" height="25" className="fill-success/15" />
          <rect x="300" y="160" width="70" height="40" className="fill-primary/10" />
        </svg>
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full text-primary drop-shadow-md"
          style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
        >
          <IconMapPinFilled className="size-9" />
        </div>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="absolute right-3 bottom-3 bg-background"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={useMyLocation}
          disabled={locating}
        >
          <IconCurrentLocation data-icon="inline-start" />
          {locating ? "Mencari…" : "Gunakan lokasi saya"}
        </Button>
      </div>
      <p className="font-mono text-xs text-muted-foreground tabular-nums">
        {lat.toFixed(5)}, {lng.toFixed(5)}
      </p>
    </div>
  )
}

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
