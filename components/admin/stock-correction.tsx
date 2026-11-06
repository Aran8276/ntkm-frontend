"use client"

import * as React from "react"

import type { StockMode, StockStatus } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/toast"
import { FormField } from "@/components/app/form-field"
import { RiskyActionModal } from "@/components/admin/risky-action"

export interface StockTarget {
  productName: string
  storeName: string
  mode: StockMode
  quantity: number | null
  status: StockStatus
}

/** Modal "Koreksi stok" (A16, A17). */
export function StockCorrectionModal({
  target,
  onOpenChange,
}: {
  target: StockTarget | null
  onOpenChange: (open: boolean) => void
}) {
  const [qty, setQty] = React.useState("")
  const [status, setStatus] = React.useState<StockStatus>("available")
  const [prev, setPrev] = React.useState<StockTarget | null>(null)
  if (target !== prev) {
    setPrev(target)
    if (target) {
      setQty(String(target.quantity ?? 0))
      setStatus(target.status)
    }
  }
  const qtyOk = target?.mode !== "count" || (qty !== "" && Number(qty) >= 0)

  return (
    <RiskyActionModal
      open={!!target}
      onOpenChange={onOpenChange}
      title={`Koreksi stok ${target?.productName ?? ""}?`}
      impacts={[`Di ${target?.storeName ?? ""}`, "Bila stok jadi habis, UMKM menerima notifikasi stok habis."]}
      notify
      notifyLabel="Kirim notifikasi"
      reasonPlaceholder="Mis. hasil cek fisik rak 10 Nov."
      confirmLabel="Koreksi stok"
      canConfirm={qtyOk}
      onConfirm={() => toast.add({ title: "Stok dikoreksi.", type: "success" })}
    >
      {target?.mode === "count" ? (
        <FormField label="Jumlah stok sekarang" htmlFor="stock-qty" required error={!qtyOk ? "Minimal 0." : undefined}>
          <Input
            id="stock-qty"
            inputMode="numeric"
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))}
            className="sm:max-w-32"
          />
        </FormField>
      ) : (
        <FormField label="Stok sekarang" required>
          <RadioGroup value={status} onValueChange={(v) => setStatus(v as StockStatus)} className="flex gap-6">
            {(
              [
                ["available", "Ada"],
                ["out_of_stock", "Habis"],
              ] as const
            ).map(([v, l]) => (
              <Label key={v} className="flex items-center gap-2.5 normal-case">
                <RadioGroupItem value={v} />
                <span className="text-sm font-normal tracking-normal">{l}</span>
              </Label>
            ))}
          </RadioGroup>
        </FormField>
      )}
    </RiskyActionModal>
  )
}
