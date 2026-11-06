"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { calcCommission, formatRupiah } from "@/lib/format"
import type { AdminApplication } from "@/lib/admin-types"
import type { StockMode } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ConfirmDialog, Section, Thumb } from "@/components/app/blocks"
import { FormField } from "@/components/app/form-field"
import { CharCount, NumberStepper, RupiahInput } from "@/components/app/inputs"
import { upcomingSlots } from "./slot-options"

interface ItemDecision {
  decision: "approved" | "rejected" | null
  qty: number
  price: number | null
  reason: string
}

/** "Review atas nama toko" (A16) — same shape as the P19 approval form plus admin reason. */
export function AdminReviewForm({ application: a }: { application: AdminApplication }) {
  const [items, setItems] = React.useState<Record<number, ItemDecision>>(() =>
    Object.fromEntries(a.items.map((i) => [i.id, { decision: null, qty: 12, price: i.product.suggested_retail_price, reason: "" }]))
  )
  const [slot, setSlot] = React.useState("")
  const [mode, setMode] = React.useState<StockMode>("count")
  const [note, setNote] = React.useState("")
  const [reason, setReason] = React.useState("")
  const [notify, setNotify] = React.useState(true)
  const [confirm, setConfirm] = React.useState(false)
  const slots = upcomingSlots(a.opportunity.receiving_schedule)

  const update = (id: number, patch: Partial<ItemDecision>) => setItems((p) => ({ ...p, [id]: { ...p[id], ...patch } }))
  const all = Object.values(items)
  const anyApproved = all.some((d) => d.decision === "approved")
  const valid =
    all.every((d) => d.decision) &&
    all.every((d) => d.decision !== "rejected" || d.reason.trim()) &&
    a.items.every((i) => items[i.id].decision !== "approved" || (items[i.id].price ?? 0) >= i.product.base_price) &&
    (!anyApproved || !!slot) &&
    reason.trim().length >= 5

  return (
    <Section title="Review atas nama toko" description="Pengajuan ini belum ditinjau toko. Admin bisa memutuskannya atas nama toko.">
      <div className="flex flex-col gap-8">
        <ul className="flex flex-col divide-y border-y">
          {a.items.map((i) => {
            const d = items[i.id]
            const calc = d.price ? calcCommission(d.price, a.opportunity.commission) : null
            return (
              <li key={i.id} className="flex flex-col gap-4 py-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <Thumb size="sm" />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">{i.product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Setor {formatRupiah(i.product.base_price)} · saran jual {formatRupiah(i.product.suggested_retail_price)}
                      </span>
                    </span>
                  </span>
                  <div className="flex">
                    {(
                      [
                        ["approved", "Setujui"],
                        ["rejected", "Tolak"],
                      ] as const
                    ).map(([v, l]) => (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={d.decision === v}
                        onClick={() => update(i.id, { decision: v })}
                        className={cn(
                          "-ml-px h-9 border px-4 text-[0.6875rem] font-semibold tracking-widest uppercase outline-none first:ml-0 focus-visible:ring-2 focus-visible:ring-ring/30",
                          d.decision === v
                            ? v === "approved"
                              ? "z-10 border-success bg-success/10 text-success"
                              : "z-10 border-destructive bg-destructive/10 text-destructive"
                            : "text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {d.decision === "approved" && (
                  <div className="grid gap-6 sm:grid-cols-3">
                    <FormField label="Jumlah">
                      <NumberStepper label="Jumlah" value={d.qty} onChange={(n) => update(i.id, { qty: n })} min={1} max={500} />
                    </FormField>
                    <FormField
                      label="Harga jual"
                      error={(d.price ?? 0) < i.product.base_price ? "Tidak boleh di bawah harga setor." : undefined}
                    >
                      <RupiahInput value={d.price} onChange={(n) => update(i.id, { price: n })} />
                    </FormField>
                    {calc && (
                      <p className="self-end pb-2 text-xs text-muted-foreground">
                        Komisi {formatRupiah(calc.commission)} · UMKM {formatRupiah(calc.income)} /unit
                      </p>
                    )}
                  </div>
                )}
                {d.decision === "rejected" && (
                  <FormField label="Alasan tolak" required>
                    <Textarea value={d.reason} onChange={(e) => update(i.id, { reason: e.target.value })} className="min-h-14" placeholder="Mis. harga terlalu tinggi untuk rak ini." />
                  </FormField>
                )}
              </li>
            )
          })}
        </ul>

        {anyApproved && (
          <div className="grid gap-8 sm:grid-cols-2">
            <FormField label="Slot antar" htmlFor="rv-slot" required>
              <NativeSelect id="rv-slot" value={slot} onChange={(e) => setSlot(e.target.value)}>
                <NativeSelectOption value="">Pilih tanggal & jam</NativeSelectOption>
                {slots.map((s) => (
                  <NativeSelectOption key={s.value} value={s.value}>
                    {s.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Mode stok">
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as StockMode)} className="flex flex-wrap gap-6 pt-2">
                {(
                  [
                    ["count", "Angka"],
                    ["boolean", "Ada/habis"],
                  ] as const
                ).map(([v, l]) => (
                  <Label key={v} className="flex items-center gap-2.5 normal-case">
                    <RadioGroupItem value={v} />
                    <span className="text-sm font-normal tracking-normal">{l}</span>
                  </Label>
                ))}
              </RadioGroup>
            </FormField>
          </div>
        )}

        <FormField label="Catatan untuk UMKM" htmlFor="rv-note" aside={<CharCount value={note} max={300} />}>
          <Textarea id="rv-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-16" />
        </FormField>
        <FormField label="Alasan" htmlFor="rv-reason" required description="Minimal 5 karakter. Tercatat di audit log.">
          <Textarea id="rv-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-16" placeholder="Mis. toko konfirmasi lewat telepon." />
        </FormField>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Label className="flex items-center gap-2.5 normal-case">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(!!v)} />
            <span className="text-sm font-normal tracking-normal">Beri tahu toko dan UMKM</span>
          </Label>
          <Button data-save disabled={!valid} onClick={() => setConfirm(true)}>
            Kirim keputusan
          </Button>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Kirim keputusan atas nama toko?"
        description={`${all.filter((d) => d.decision === "approved").length} produk disetujui, ${all.filter((d) => d.decision === "rejected").length} ditolak.`}
        confirmLabel="Kirim keputusan"
        onConfirm={() => toast.add({ title: "Keputusan dikirim.", type: "success" })}
      />
    </Section>
  )
}
