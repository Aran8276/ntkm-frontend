"use client"

import * as React from "react"
import Link from "next/link"
import { IconInfoCircle, IconPrinter } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatRupiah } from "@/lib/format"
import type { Application, Role } from "@/lib/types"
import { computeSettlement, type Settlement } from "@/lib/settlement"
import { buttonVariants } from "@/components/ui/button"
import { Section } from "@/components/app/blocks"
import { NumberStepper } from "@/components/app/inputs"

// --- Manual sold estimates (available/out-of-stock mode) ------------------
// The API does not record units sold for items still marked "ada", so the
// viewer can enter an estimate. It is kept in localStorage on this device.

const key = (applicationId: string) => `ntkm:sold-estimates:${applicationId}`
const listeners = new Set<() => void>()
const cache = new Map<string, Record<number, number>>()
const EMPTY: Record<number, number> = {}

function read(applicationId: string): Record<number, number> {
  if (cache.has(applicationId)) return cache.get(applicationId)!
  let value: Record<number, number> = EMPTY
  try {
    const raw = window.localStorage.getItem(key(applicationId))
    if (raw) value = JSON.parse(raw) as Record<number, number>
  } catch {
    // Storage blocked or bad JSON: fall back to no estimates.
  }
  cache.set(applicationId, value)
  return value
}

function write(applicationId: string, value: Record<number, number>) {
  cache.set(applicationId, value)
  try {
    window.localStorage.setItem(key(applicationId), JSON.stringify(value))
  } catch {
    // Keep the in-memory value for this session.
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useSoldEstimates(applicationId: string) {
  const estimates = React.useSyncExternalStore(
    subscribe,
    () => read(applicationId),
    () => EMPTY
  )
  const setEstimate = React.useCallback(
    (itemId: number, sold: number) => write(applicationId, { ...read(applicationId), [itemId]: sold }),
    [applicationId]
  )
  return { estimates, setEstimate }
}

/** Settlement for an application including this device's estimates. */
export function useSettlement(app: Application) {
  const { estimates, setEstimate } = useSoldEstimates(app.id)
  const settlement = React.useMemo(() => computeSettlement(app, estimates), [app, estimates])
  return { settlement, estimates, setEstimate }
}

// --- UI --------------------------------------------------------------------

function Money({ value, className }: { value: number; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{formatRupiah(value)}</span>
}

/** Totals block: one figure per party, plus who pays whom. */
export function SettlementTotals({ s, viewer, compact }: { s: Settlement; viewer?: Role; compact?: boolean }) {
  const tiles: { label: string; value: number; hint: string; you: boolean }[] = [
    { label: "Keuntungan toko", value: s.storeShare, hint: "Komisi dari unit terjual", you: viewer === "store" },
    {
      label: "Pendapatan UMKM",
      value: s.umkmShare,
      hint:
        s.umkmMargin === 0
          ? "Sama dengan harga setor"
          : `${s.umkmMargin > 0 ? "+" : "−"}${formatRupiah(Math.abs(s.umkmMargin))} dibanding harga setor`,
      you: viewer === "umkm",
    },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className={cn("grid gap-px border bg-border text-center", s.unitsUnknown ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3")}>
        {[
          ["Diterima", s.unitsReceived],
          ["Terjual", s.unitsSold],
          ["Sisa", s.unitsUnsold],
          ...(s.unitsUnknown ? [["Belum tercatat", s.unitsUnknown] as const] : []),
        ].map(([l, v]) => (
          <div key={l} className="flex flex-col gap-0.5 bg-card px-2 py-3">
            <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">{l}</span>
            <span className="text-lg font-semibold tabular-nums">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="text-muted-foreground">Total penjualan</span>
        <Money value={s.gross} className="font-medium" />
      </div>
      <div className={cn("grid gap-3", !compact && "sm:grid-cols-2")}>
        {tiles.map((t) => (
          <div key={t.label} className={cn("flex flex-col gap-1 border p-4", t.you && "border-primary/30 bg-primary/5")}>
            <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
              {t.label}
              {t.you && " · Anda"}
            </span>
            <Money value={t.value} className="text-xl font-semibold" />
            <span className="text-xs text-muted-foreground">{t.hint}</span>
          </div>
        ))}
      </div>
      <p className="bg-muted/60 px-3 py-2 text-sm">
        Toko membayar <Money value={s.umkmShare} className="font-semibold" /> ke UMKM
        {s.unitsUnsold > 0 ? ` dan mengembalikan ${s.unitsUnsold} unit sisa` : ""}
        {s.unitsUnknown > 0 ? `, belum termasuk ${s.unitsUnknown} unit yang jumlah terjualnya belum tercatat.` : "."}
      </p>
    </div>
  )
}

/** "Rekap penjualan & bagi hasil" on the collaboration page (P19). */
export function SettlementCard({ app }: { app: Application }) {
  const { settlement: s, estimates, setEstimate } = useSettlement(app)
  const statusMode = app.stock_mode === "boolean"
  const editable = statusMode && !s.final

  return (
    <Section
      title="Rekap penjualan & bagi hasil"
      description={s.final ? "Final, dihitung dari stok saat kerja sama selesai." : "Sementara, mengikuti stok terbaru."}
      action={
        <Link href={`/kerja-sama/${app.id}/tagihan`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          <IconPrinter data-icon="inline-start" /> Tagihan
        </Link>
      }
    >
      <div className="flex flex-col gap-5">
        <SettlementTotals s={s} viewer={app.viewer_role} />

        <div className="flex flex-col divide-y border-y">
          {s.lines.map((l) => (
            <div key={l.item.id} className="flex flex-col gap-2 py-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{l.item.product.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {l.sold == null ? "Belum tercatat" : `${l.sold}/${l.received} terjual`}
                  {l.estimated && " (perkiraan)"}
                </span>
              </div>
              {statusMode && l.item.stock_status !== "out_of_stock" && (editable || estimates[l.item.id] != null) && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Stok masih &quot;Ada&quot;. Perkiraan terjual:</span>
                  {editable ? (
                    <NumberStepper
                      label={`Perkiraan terjual ${l.item.product.name}`}
                      value={estimates[l.item.id] ?? 0}
                      min={0}
                      max={l.received}
                      onChange={(v) => setEstimate(l.item.id, v)}
                    />
                  ) : (
                    <span className="tabular-nums">{estimates[l.item.id]} unit</span>
                  )}
                </div>
              )}
              {l.sold != null && (
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span>
                    Penjualan <Money value={l.gross} className="block text-foreground" />
                  </span>
                  <span>
                    Toko <Money value={l.storeShare} className="block text-foreground" />
                  </span>
                  <span>
                    UMKM <Money value={l.umkmShare} className="block text-foreground" />
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {(s.unknown > 0 || s.estimated) && (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <IconInfoCircle className="mt-px size-3.5 shrink-0" />
            {s.unknown > 0 && `${s.unknown} produk belum punya jumlah terjual dan tidak dihitung. `}
            {statusMode &&
              "Mode stok Ada/habis tidak mencatat jumlah terjual. Perkiraan hanya tersimpan di perangkat ini; produk berstatus Habis dihitung terjual semua."}
          </p>
        )}
      </div>
    </Section>
  )
}
