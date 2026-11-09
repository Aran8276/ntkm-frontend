"use client"

import * as React from "react"
import { IconPrinter } from "@tabler/icons-react"

import { formatCommission, formatDateLong, formatDateTime, formatRupiah } from "@/lib/format"
import { useApi } from "@/lib/use-api"
import { hasSettlement } from "@/lib/settlement"
import type { Application, TimelineEvent } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { AppShell } from "@/components/app/app-shell"
import { PageSkeletonBody, Section } from "@/components/app/blocks"
import { LoadError } from "@/components/app/feedback"
import { useRole } from "@/components/app/providers"
import { useSettlement } from "@/components/app/settlement"
import { ApplicationStatusChip } from "@/components/app/status"

/** Printable bill ("tagihan bagi hasil") for one collaboration. */
export function SettlementBill({ id }: { id: string }) {
  const { role } = useRole()
  const q = useApi<Application>("user", `/applications/${id}`, { as: role })
  const tq = useApi<TimelineEvent[]>("user", `/applications/${id}/timeline`, { as: role })
  const back = `/kerja-sama/${id}`

  if (!q.data)
    return (
      <AppShell title="Tagihan" back={back} width="wide">
        {q.error ? <LoadError error={q.error} onRetry={q.reload} backHref={back} backLabel="Kembali ke kerja sama" /> : <PageSkeletonBody />}
      </AppShell>
    )

  const app = q.data
  if (!hasSettlement(app))
    return (
      <AppShell role={app.viewer_role} title="Tagihan" back={back} width="wide">
        <Section title="Belum ada tagihan">
          <p className="text-sm text-muted-foreground">Tagihan tersedia setelah toko menerima barang.</p>
        </Section>
      </AppShell>
    )

  const completedAt = tq.data?.findLast((e) => e.to_status === "completed")?.created_at ?? null
  return <Bill app={app} completedAt={completedAt} back={back} />
}

function Bill({ app, completedAt, back }: { app: Application; completedAt: string | null; back: string }) {
  const { settlement: s } = useSettlement(app)
  const [printedAt] = React.useState(() => new Date().toISOString())

  return (
    <AppShell role={app.viewer_role} title="Tagihan" back={back} width="wide">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">Cetak atau simpan sebagai PDF untuk dibagikan ke pihak lain.</p>
        <Button onClick={() => window.print()}>
          <IconPrinter data-icon="inline-start" /> Cetak / simpan PDF
        </Button>
      </div>

      <article className="flex flex-col gap-6 bg-background p-6 shadow-sm ring-1 ring-foreground/5 sm:p-8 print:p-0 print:shadow-none print:ring-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
          <div className="flex flex-col gap-1">
            <p className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
              {s.final ? "Tagihan bagi hasil" : "Rekap sementara"}
            </p>
            <h1 className="text-xl font-semibold tracking-wide uppercase">{app.opportunity.title}</h1>
            <p className="font-mono text-xs text-muted-foreground">No. {app.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right text-sm">
            <ApplicationStatusChip status={app.status} />
            {completedAt && <span>Selesai {formatDateLong(completedAt)}</span>}
            <span className="text-xs text-muted-foreground">Dicetak {formatDateTime(printedAt)}</span>
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">Toko</span>
            <span className="font-medium">{app.store.name}</span>
            <span className="text-muted-foreground">{app.store.address}</span>
            <span className="text-muted-foreground">{app.store.phone}</span>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">UMKM</span>
            <span className="font-medium">{app.umkm.business_name}</span>
            <span className="text-muted-foreground">{app.umkm.owner_name}</span>
            <span className="text-muted-foreground">{app.umkm.phone}</span>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full min-w-[40rem] text-sm print:min-w-0 print:text-xs">
            <thead>
              <tr className="border-b text-left text-xs tracking-wider text-muted-foreground uppercase">
                <th className="py-2 pr-3 font-medium">Produk</th>
                <th className="py-2 pr-3 text-right font-medium">Diterima</th>
                <th className="py-2 pr-3 text-right font-medium">Terjual</th>
                <th className="py-2 pr-3 text-right font-medium">Sisa</th>
                <th className="py-2 pr-3 text-right font-medium">Harga jual</th>
                <th className="py-2 pr-3 text-right font-medium">Penjualan</th>
                <th className="py-2 pr-3 text-right font-medium">Komisi toko</th>
                <th className="py-2 text-right font-medium">Untuk UMKM</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {s.lines.map((l) => (
                <tr key={l.item.id} className="border-b">
                  <td className="py-2.5 pr-3">{l.item.product.name}</td>
                  <td className="py-2.5 pr-3 text-right">{l.received}</td>
                  <td className="py-2.5 pr-3 text-right">
                    {l.sold ?? "—"}
                    {l.estimated && "*"}
                  </td>
                  <td className="py-2.5 pr-3 text-right">{l.unsold ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-right">{formatRupiah(l.sellPrice)}</td>
                  <td className="py-2.5 pr-3 text-right">{formatRupiah(l.gross)}</td>
                  <td className="py-2.5 pr-3 text-right">{formatRupiah(l.storeShare)}</td>
                  <td className="py-2.5 text-right">{formatRupiah(l.umkmShare)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="font-semibold tabular-nums">
              <tr>
                <td className="py-3 pr-3">Total</td>
                <td className="py-3 pr-3 text-right">{s.unitsReceived}</td>
                <td className="py-3 pr-3 text-right">{s.unitsSold}</td>
                <td className="py-3 pr-3 text-right">{s.unitsUnsold}</td>
                <td />
                <td className="py-3 pr-3 text-right">{formatRupiah(s.gross)}</td>
                <td className="py-3 pr-3 text-right">{formatRupiah(s.storeShare)}</td>
                <td className="py-3 text-right">{formatRupiah(s.umkmShare)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1 border p-4">
            <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">Keuntungan toko</span>
            <span className="text-xl font-semibold tabular-nums">{formatRupiah(s.storeShare)}</span>
            <span className="text-xs text-muted-foreground">{formatCommission(app.opportunity.commission)}</span>
          </div>
          <div className="flex flex-col gap-1 border p-4">
            <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">Pendapatan UMKM</span>
            <span className="text-xl font-semibold tabular-nums">{formatRupiah(s.umkmShare)}</span>
            <span className="text-xs text-muted-foreground">
              {s.umkmMargin >= 0 ? "+" : "−"}
              {formatRupiah(Math.abs(s.umkmMargin))} dibanding harga setor
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1 border-2 border-foreground p-4">
          <span className="text-[0.6875rem] font-semibold tracking-widest uppercase">Jumlah yang dibayar toko ke UMKM</span>
          <span className="text-2xl font-semibold tabular-nums">{formatRupiah(s.umkmShare)}</span>
          {s.unitsUnsold > 0 && <span className="text-sm">Ditambah pengembalian {s.unitsUnsold} unit barang sisa.</span>}
        </div>

        {(s.estimated || s.unknown > 0 || !s.final) && (
          <ul className="flex list-disc flex-col gap-1 pl-5 text-xs text-muted-foreground">
            {!s.final && <li>Kerja sama belum selesai; angka bisa berubah mengikuti stok.</li>}
            {s.estimated && <li>* Jumlah terjual berupa perkiraan (mode stok Ada/habis).</li>}
            {s.unknown > 0 && <li>{s.unknown} produk ({s.unitsUnknown} unit) belum punya jumlah terjual dan tidak dihitung.</li>}
          </ul>
        )}

        <div className="mt-6 grid grid-cols-2 gap-8 text-center text-sm">
          {[app.store.name, app.umkm.business_name].map((n) => (
            <div key={n} className="flex flex-col gap-12">
              <span className="text-muted-foreground">Mengetahui,</span>
              <span className="border-t pt-2 font-medium">{n}</span>
            </div>
          ))}
        </div>
      </article>
    </AppShell>
  )
}
