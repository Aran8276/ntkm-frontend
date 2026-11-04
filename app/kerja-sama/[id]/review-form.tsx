"use client"

import * as React from "react"
import Link from "next/link"
import { IconCheck, IconX } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { DAYS, DAY_LABEL_SHORT, NOW, calcCommission, formatRupiah, formatShelfLife, formatTimeRange } from "@/lib/format"
import type { Application, DeliverySlot, Day, StockMode } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ConfirmDialog, Section, Thumb } from "@/components/app/blocks"
import { FormField } from "@/components/app/form-field"
import { CharCount, CommissionCalculator, NumberStepper, RupiahInput } from "@/components/app/inputs"

export interface ReviewResult {
  items: {
    id: number
    decision: "approved" | "rejected"
    approved_quantity: number
    sell_price: number
    commission: number
    income: number
    reject_reason: string
  }[]
  delivery_slot: DeliverySlot | null
  stock_mode: StockMode
  note: string
}

interface ItemState {
  decision: "approved" | "rejected" | null
  qty: number
  price: number | null
  reasonChip: string | null
  reasonText: string
}

const REJECT_REASONS = ["Kategori sudah penuh", "Harga tidak sesuai", "Kemasan belum memenuhi syarat", "Lainnya"]

/** Next 14 days starting tomorrow (Asia/Jakarta), keyed by weekday. */
function nextDates() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(NOW.getTime() + (i + 1) * 86_400_000 + 7 * 3_600_000)
    const day: Day = DAYS[(d.getUTCDay() + 6) % 7]
    return { iso: d.toISOString().slice(0, 10), day, date: d.getUTCDate() }
  })
}

/** P19 Section 6 · per-product approval form (store, status submitted). */
export function ReviewForm({
  application: a,
  onSubmit,
}: {
  application: Application
  onSubmit: (r: ReviewResult) => void
}) {
  const [items, setItems] = React.useState<Record<number, ItemState>>(() =>
    Object.fromEntries(
      a.items.map((it) => [
        it.id,
        { decision: null, qty: 12, price: it.product.suggested_retail_price, reasonChip: null, reasonText: "" },
      ])
    )
  )
  const [date, setDate] = React.useState<string | null>(null)
  const [slotIdx, setSlotIdx] = React.useState<number | null>(null)
  const [stockMode, setStockMode] = React.useState<StockMode>("count")
  const [note, setNote] = React.useState("")
  const [confirm, setConfirm] = React.useState(false)
  const [quotaFull, setQuotaFull] = React.useState(false)

  const update = (id: number, patch: Partial<ItemState>) =>
    setItems((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const dates = nextDates().filter((d) => a.opportunity.receiving_schedule.some((s) => s.day === d.day))
  const selectedDay = dates.find((d) => d.iso === date)?.day
  const daySlots = a.opportunity.receiving_schedule.filter((s) => s.day === selectedDay)

  const values = Object.values(items)
  const approved = values.filter((v) => v.decision === "approved").length
  const rejected = values.filter((v) => v.decision === "rejected").length
  const allDecided = values.every((v) => v.decision)

  const itemValid = (id: number) => {
    const s = items[id]
    const it = a.items.find((x) => x.id === id)!
    if (s.decision === "approved") return s.qty >= 1 && (s.price ?? 0) >= it.product.base_price
    if (s.decision === "rejected") return !!(s.reasonChip && s.reasonChip !== "Lainnya") || !!s.reasonText.trim()
    return false
  }
  const slotValid = approved === 0 || (date && slotIdx != null)
  const canSubmit = allDecided && a.items.every((it) => itemValid(it.id)) && slotValid && note.length <= 300

  const send = () => {
    // Mock 409 for demo: never triggered; kept to show the dialog wiring.
    if (quotaFull) return
    const slot = slotIdx != null ? daySlots[slotIdx] : null
    onSubmit({
      items: a.items.map((it) => {
        const s = items[it.id]
        const calc = calcCommission(s.price ?? 0, a.opportunity.commission)
        return {
          id: it.id,
          decision: s.decision!,
          approved_quantity: s.qty,
          sell_price: s.price ?? 0,
          commission: calc.commission,
          income: calc.income,
          reject_reason: [s.reasonChip !== "Lainnya" ? s.reasonChip : null, s.reasonText.trim()].filter(Boolean).join(". "),
        }
      }),
      delivery_slot: approved && date && slot ? { date, start: slot.start, end: slot.end } : null,
      stock_mode: stockMode,
      note,
    })
  }

  return (
    <>
      <Section title="Tinjau produk" description="Putuskan setiap produk. Keputusan tidak bisa diubah setelah dikirim.">
        <div className="flex flex-col gap-4">
          {a.items.map((it) => {
            const s = items[it.id]
            const p = it.product
            const priceLow = s.price != null && s.price < p.base_price
            return (
              <div key={it.id} className="flex flex-col gap-5 bg-muted/50 p-5">
                <div className="flex gap-4">
                  <Thumb kind="product" className="bg-background" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Setor {formatRupiah(p.base_price)} · Saran jual {formatRupiah(p.suggested_retail_price)}
                      {p.shelf_life_days && ` · ${formatShelfLife(p.shelf_life_days)}`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 border bg-background" role="radiogroup" aria-label={`Keputusan ${p.name}`}>
                  {(
                    [
                      ["approved", "Setujui", IconCheck],
                      ["rejected", "Tolak", IconX],
                    ] as const
                  ).map(([value, label, Ico]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={s.decision === value}
                      onClick={() => update(it.id, { decision: value })}
                      className={cn(
                        "flex h-10 items-center justify-center gap-2 text-xs font-semibold tracking-widest uppercase outline-none first:border-r focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-inset",
                        s.decision === value
                          ? value === "approved"
                            ? "bg-success text-white"
                            : "bg-destructive text-white"
                          : "hover:bg-muted"
                      )}
                    >
                      <Ico className="size-4" /> {label}
                    </button>
                  ))}
                </div>

                {s.decision === "approved" && (
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <FormField label="Jumlah yang diterima" required>
                        <NumberStepper label="Jumlah yang diterima" value={s.qty} min={1} max={999} onChange={(n) => update(it.id, { qty: n })} />
                      </FormField>
                      <FormField
                        label="Harga jual di toko"
                        required
                        error={priceLow ? `Harga jual minimal ${formatRupiah(p.base_price)}.` : undefined}
                      >
                        <RupiahInput value={s.price} onChange={(n) => update(it.id, { price: n })} invalid={priceLow} />
                      </FormField>
                    </div>
                    {s.price != null && !priceLow && (
                      <CommissionCalculator commission={a.opportunity.commission} price={s.price} compact />
                    )}
                  </div>
                )}

                {s.decision === "rejected" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2">
                      {REJECT_REASONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          aria-pressed={s.reasonChip === r}
                          onClick={() => update(it.id, { reasonChip: r })}
                          className={cn(
                            "h-8 border px-3 text-[0.6875rem] font-semibold tracking-wider uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                            s.reasonChip === r ? "border-foreground bg-foreground text-background" : "bg-background hover:bg-muted"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <FormField label="Alasan" required>
                      <Textarea
                        value={s.reasonText}
                        onChange={(e) => update(it.id, { reasonText: e.target.value })}
                        placeholder="Tambahkan penjelasan untuk UMKM."
                      />
                    </FormField>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Section>

      {approved > 0 && (
        <Section title="Slot antar" description="Pilih tanggal dalam 14 hari ke depan sesuai jadwal terima barang.">
          <div className="flex flex-col gap-6">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              {dates.map((d) => (
                <button
                  key={d.iso}
                  type="button"
                  aria-pressed={date === d.iso}
                  onClick={() => {
                    setDate(d.iso)
                    setSlotIdx(0)
                  }}
                  className={cn(
                    "flex w-16 shrink-0 flex-col items-center gap-0.5 border py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                    date === d.iso ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <span className="text-[0.625rem] font-semibold tracking-widest uppercase opacity-80">{DAY_LABEL_SHORT[d.day]}</span>
                  <span className="text-lg font-medium tabular-nums">{d.date}</span>
                </button>
              ))}
            </div>
            {date && (
              <div className="flex flex-wrap gap-2">
                {daySlots.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={slotIdx === i}
                    onClick={() => setSlotIdx(i)}
                    className={cn(
                      "h-10 border px-5 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                      slotIdx === i ? "border-foreground bg-foreground text-background" : "hover:bg-muted"
                    )}
                  >
                    {formatTimeRange(s.start, s.end)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      <Section title="Pencatatan stok & catatan">
        <div className="flex flex-col gap-8">
          <RadioGroup value={stockMode} onValueChange={(v) => setStockMode(v as StockMode)} className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["count", "Catat jumlah (angka)"],
                ["boolean", "Cukup ada atau habis"],
              ] as const
            ).map(([value, label]) => (
              <Label
                key={value}
                className="flex items-center gap-3 border p-4 normal-case has-data-checked:border-primary/30 has-data-checked:bg-primary/5"
              >
                <RadioGroupItem value={value} />
                <span className="text-sm font-medium tracking-normal">{label}</span>
              </Label>
            ))}
          </RadioGroup>
          <FormField label="Catatan untuk UMKM" htmlFor="review-note" aside={<CharCount value={note} max={300} />}>
            <Textarea
              id="review-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mis. bawa nota serah terima."
            />
          </FormField>
        </div>
      </Section>

      {/* Sticky summary */}
      <div className="sticky bottom-20 z-20 flex items-center justify-between gap-4 bg-foreground p-4 text-background shadow-lg lg:bottom-4">
        <p className="text-sm">
          <span className="font-semibold">{approved}</span> disetujui · <span className="font-semibold">{rejected}</span> ditolak
          {!allDecided && <span className="text-background/60"> · {a.items.length - approved - rejected} belum</span>}
        </p>
        <Button variant="secondary" disabled={!canSubmit} onClick={() => setConfirm(true)}>
          Kirim keputusan
        </Button>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={approved === 0 ? "Tolak semua produk?" : "Kirim keputusan?"}
        description="Keputusan tidak bisa diubah setelah dikirim."
        confirmLabel={approved === 0 ? "Ya, tolak semua" : "Ya, kirim"}
        destructive={approved === 0}
        onConfirm={send}
      />
      <ConfirmDialog
        open={quotaFull}
        onOpenChange={setQuotaFull}
        title="Kuota peluang sudah penuh"
        description="Tambah kuota di peluang atau tolak pengajuan ini."
        confirmLabel="Mengerti"
        onConfirm={() => {}}
      >
        <Link href={`/toko/peluang/${a.opportunity.id}/ubah`} className="text-sm text-primary underline">
          Ubah peluang
        </Link>
      </ConfirmDialog>
    </>
  )
}
