import type { Application, ApplicationItem } from "@/lib/types"

/**
 * Sales recap ("rekap bagi hasil") of one collaboration, computed from the
 * item data the API already returns:
 *
 * - count mode: sold = received_quantity − stock_quantity
 * - available/out-of-stock mode: "habis" → every received unit sold;
 *   "ada" → the number sold is not recorded, so the viewer may enter an
 *   estimate (kept on this device only, see `useSoldEstimates`).
 *
 * Money per unit comes from the server (`commission_per_unit`,
 * `umkm_income_per_unit`), so totals match what the app showed when the store
 * approved the products.
 */

export interface SettlementLine {
  item: ApplicationItem
  received: number
  /** Units sold; null when unknown (status mode, still "ada", no estimate). */
  sold: number | null
  /** True when `sold` is a manual estimate rather than recorded stock. */
  estimated: boolean
  unsold: number | null
  sellPrice: number
  gross: number
  storeShare: number
  umkmShare: number
  /** UMKM income compared with the product's "harga setor" (`base_price`). */
  umkmMargin: number
}

export interface Settlement {
  lines: SettlementLine[]
  unitsReceived: number
  unitsSold: number
  unitsUnsold: number
  /** Units received on lines whose sold count is unknown. */
  unitsUnknown: number
  gross: number
  storeShare: number
  umkmShare: number
  umkmMargin: number
  /** Lines whose sold count is unknown (excluded from the totals). */
  unknown: number
  /** Some sold counts are manual estimates. */
  estimated: boolean
  /** The recap is final (collaboration completed). */
  final: boolean
}

/** Statuses that have a recap: goods are (or were) on the shelf. */
export const hasSettlement = (a: Pick<Application, "status">) => a.status === "received" || a.status === "completed"

export function computeSettlement(app: Application, estimates: Record<number, number> = {}): Settlement {
  const lines: SettlementLine[] = app.items
    .filter((it) => it.decision === "approved" && it.received_quantity != null)
    .map((it) => {
      const received = it.received_quantity ?? 0
      let sold: number | null = null
      let estimated = false
      if (app.stock_mode === "count") {
        sold = it.stock_quantity == null ? null : Math.max(0, received - it.stock_quantity)
      } else if (it.stock_status === "out_of_stock") {
        sold = received
      } else if (estimates[it.id] != null) {
        sold = Math.min(received, Math.max(0, estimates[it.id]))
        estimated = true
      }
      const sellPrice = it.sell_price ?? 0
      const commission = it.commission_per_unit ?? 0
      const income = it.umkm_income_per_unit ?? Math.max(0, sellPrice - commission)
      const n = sold ?? 0
      return {
        item: it,
        received,
        sold,
        estimated,
        unsold: sold == null ? null : received - sold,
        sellPrice,
        gross: n * sellPrice,
        storeShare: n * commission,
        umkmShare: n * income,
        umkmMargin: n * (income - it.product.base_price),
      }
    })

  const known = lines.filter((l) => l.sold != null)
  const sum = (f: (l: SettlementLine) => number) => known.reduce((s, l) => s + f(l), 0)
  return {
    lines,
    unitsReceived: lines.reduce((s, l) => s + l.received, 0),
    unitsSold: sum((l) => l.sold ?? 0),
    unitsUnsold: sum((l) => l.unsold ?? 0),
    unitsUnknown: lines.filter((l) => l.sold == null).reduce((s, l) => s + l.received, 0),
    gross: sum((l) => l.gross),
    storeShare: sum((l) => l.storeShare),
    umkmShare: sum((l) => l.umkmShare),
    umkmMargin: sum((l) => l.umkmMargin),
    unknown: lines.length - known.length,
    estimated: lines.some((l) => l.estimated),
    final: app.status === "completed",
  }
}

/** One-line recap, appended to the completion note so both parties keep it in the timeline. */
export function settlementSummary(s: Settlement, rupiah: (n: number) => string) {
  return `Rekap: ${s.unitsSold} dari ${s.unitsReceived} unit terjual · penjualan ${rupiah(s.gross)} · komisi toko ${rupiah(s.storeShare)} · dibayar ke UMKM ${rupiah(s.umkmShare)}${s.unknown ? ` · ${s.unknown} produk belum tercatat` : ""}.`
}
