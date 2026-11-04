"use client"

import * as React from "react"
import Link from "next/link"
import { IconArrowRight, IconCalendarEvent, IconInfoCircle, IconNote } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import {
  formatCommission,
  formatDateLong,
  formatDateTime,
  formatRelative,
  formatRupiah,
  formatShelfLife,
  formatDate,
  formatTimeRange,
  upcomingDayLabel,
} from "@/lib/format"
import { actionsFor, getApplication, getTimeline, viewerRoleFor } from "@/lib/mock-data"
import type { Application, ApplicationItem, ApplicationStatus, Role } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { toast } from "@/components/ui/toast"
import { AppShell } from "@/components/app/app-shell"
import { ConfirmDialog, InfoRow, Section, Thumb } from "@/components/app/blocks"
import { StockControl } from "@/components/app/cards"
import { FormField } from "@/components/app/form-field"
import { NumberStepper } from "@/components/app/inputs"
import {
  ApplicationStatusChip,
  DecisionChip,
  LegalChips,
  StatusChip,
  StockChip,
} from "@/components/app/status"
import { ReviewForm, type ReviewResult } from "./review-form"

const BANNER: Record<ApplicationStatus, Record<Role, (a: Application) => string>> = {
  submitted: {
    store: () => "Tinjau produk di bawah, lalu setujui atau tolak.",
    umkm: () => "Menunggu keputusan toko.",
  },
  approved: {
    store: (a) => `Menunggu UMKM mengantar pada ${slotText(a)}.`,
    umkm: (a) => `Antar barang ke ${a.store.name} pada ${slotText(a)}. Tekan Tandai dikirim saat berangkat.`,
  },
  in_delivery: {
    store: () => "Barang dalam perjalanan. Konfirmasi saat sudah diterima.",
    umkm: () => "Menunggu toko mengonfirmasi penerimaan.",
  },
  received: {
    store: () => "Produk sedang dijual. Perbarui stok saat terjual.",
    umkm: () => "Produk sedang dijual. Anda akan dikabari saat stok habis.",
  },
  completed: { store: () => "Kerja sama selesai.", umkm: () => "Kerja sama selesai." },
  rejected: {
    store: () => "Anda menolak semua produk.",
    umkm: () => "Toko menolak semua produk. Lihat alasannya di bawah.",
  },
  cancelled: { store: () => "Kerja sama dibatalkan.", umkm: () => "Kerja sama dibatalkan." },
}

function slotText(a: Application) {
  const s = a.delivery_slot
  return s ? `${formatDate(s.date)}, ${formatTimeRange(s.start, s.end)}` : "slot yang dipilih"
}

const DOT: Record<ApplicationStatus, string> = {
  submitted: "bg-muted-foreground",
  approved: "bg-primary",
  in_delivery: "bg-primary",
  received: "bg-success",
  completed: "bg-success",
  rejected: "bg-destructive",
  cancelled: "bg-destructive",
}

type ActionSheet = null | "ship" | "receive" | "cancel" | "complete"

export function ApplicationDetail({ id }: { id: number }) {
  const initial = getApplication(id)!
  const viewer = viewerRoleFor(initial)
  const [app, setApp] = React.useState<Application>(initial)
  const [sheet, setSheet] = React.useState<ActionSheet>(null)

  const timeline = React.useMemo(() => getTimeline(app), [app])
  const actions = app.available_actions
  const reviewing = viewer === "store" && actions.includes("review")
  const canUpdateStock = viewer === "store" && actions.includes("update_stock")
  const cancelReason = app.status === "cancelled" ? timeline.at(-1)?.note : null

  const transition = (status: ApplicationStatus, patch: Partial<Application> = {}, message?: string) => {
    setApp((prev) => ({
      ...prev,
      ...patch,
      status,
      updated_at: "2026-11-04T16:00:00+07:00",
      available_actions: actionsFor(status, viewer),
    }))
    if (message) toast.add({ title: message, type: "success" })
    setSheet(null)
  }

  const onReview = (r: ReviewResult) => {
    const anyApproved = r.items.some((i) => i.decision === "approved")
    transition(
      anyApproved ? "approved" : "rejected",
      {
        items: app.items.map((it) => {
          const d = r.items.find((x) => x.id === it.id)!
          return d.decision === "approved"
            ? {
                ...it,
                decision: "approved",
                approved_quantity: d.approved_quantity,
                sell_price: d.sell_price,
                commission_per_unit: d.commission,
                umkm_income_per_unit: d.income,
              }
            : { ...it, decision: "rejected", reject_reason: d.reject_reason }
        }),
        delivery_slot: r.delivery_slot,
        review_note: r.note,
        stock_mode: r.stock_mode,
      },
      "Keputusan terkirim. UMKM akan dikabari."
    )
  }

  const oppHref = viewer === "store" ? `/toko/peluang/${app.opportunity.id}` : `/umkm/peluang/${app.opportunity.id}`
  const backHref = viewer === "store" ? "/toko/pengajuan" : "/umkm/pengajuan"

  const bottomActions = actions.filter((a) => a !== "review" && a !== "update_stock")

  return (
    <AppShell
      role={viewer}
      title="Kerja sama"
      back={backHref}
      width="wide"
      bottomBar={
        reviewing ? undefined : bottomActions.length ? (
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            {bottomActions.includes("cancel") && (
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setSheet("cancel")}>
                Batalkan
              </Button>
            )}
            {bottomActions.includes("complete") && (
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setSheet("complete")}>
                Selesaikan kerja sama
              </Button>
            )}
            {bottomActions.includes("ship") && (
              <Button className="flex-1 sm:flex-none" onClick={() => setSheet("ship")}>
                Tandai dikirim
              </Button>
            )}
            {bottomActions.includes("receive") && (
              <Button className="flex-1 sm:flex-none" onClick={() => setSheet("receive")}>
                Konfirmasi barang diterima
              </Button>
            )}
          </div>
        ) : undefined
      }
    >
      {/* Section 1 · Head */}
      <div className="flex flex-col gap-4">
        <ApplicationStatusChip status={app.status} />
        <Link href={oppHref} className="group inline-flex items-start gap-2">
          <h2 className="text-2xl leading-snug font-semibold tracking-wide uppercase group-hover:underline">
            {app.opportunity.title}
          </h2>
          <IconArrowRight className="mt-2 size-4 shrink-0" />
        </Link>
        <p className="text-sm text-muted-foreground">
          Diajukan {formatDateTime(app.created_at)} · Diperbarui {formatRelative(app.updated_at)}
        </p>
      </div>

      {/* Section 2 · Next step banner */}
      <div
        className={cn(
          "flex items-start gap-3 p-5 text-sm",
          ["rejected", "cancelled"].includes(app.status)
            ? "bg-destructive/10 text-destructive"
            : ["received", "completed"].includes(app.status)
              ? "bg-success/10"
              : "bg-primary/10"
        )}
      >
        <IconInfoCircle className="mt-0.5 size-4.5 shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="font-medium text-foreground">{BANNER[app.status][viewer](app)}</p>
          {cancelReason && <p className="text-foreground/80">Alasan: {cancelReason}</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          {/* Counterpart */}
          <Section size="sm">
            {viewer === "store" ? (
              <div className="flex items-start gap-4">
                <Thumb kind="umkm" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div>
                    <p className="font-medium">{app.umkm.business_name}</p>
                    <p className="text-sm text-muted-foreground">{app.umkm.owner_name}</p>
                  </div>
                  <LegalChips legal={app.umkm.legal} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Thumb kind="store" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="font-medium">{app.store.name}</p>
                  <p className="text-sm text-muted-foreground">{app.store.address}</p>
                </div>
              </div>
            )}
          </Section>

          {/* Section 5 / 6 · Items or approval form */}
          {reviewing ? (
            <ReviewForm application={app} onSubmit={onReview} />
          ) : (
            <Section title="Produk dalam pengajuan" contentClassName="flex flex-col gap-3">
              {app.items.map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  status={app.status}
                  stockMode={app.stock_mode}
                  editableStock={canUpdateStock}
                  umkmName={app.umkm.business_name}
                />
              ))}
              {app.note && (
                <div className="flex gap-3 border-l-2 border-foreground/20 bg-muted/40 p-4 text-sm">
                  <IconNote className="size-4.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
                      Catatan dari UMKM
                    </p>
                    <p className="mt-1">{app.note}</p>
                  </div>
                </div>
              )}
            </Section>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {/* Section 3 · Delivery slot */}
          {app.delivery_slot && (
            <Section title="Jadwal antar">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center bg-muted">
                    <IconCalendarEvent className="size-5" stroke={1.75} />
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">
                      {formatDateLong(app.delivery_slot.date)} · {formatTimeRange(app.delivery_slot.start, app.delivery_slot.end)}
                    </p>
                    {upcomingDayLabel(app.delivery_slot.date) && (
                      <StatusChip tone="info">{upcomingDayLabel(app.delivery_slot.date)}</StatusChip>
                    )}
                  </div>
                </div>
                {viewer === "umkm" && <InfoRow label="Alamat toko" value={app.store.address} className="border-t pt-3" />}
                {app.review_note && (
                  <div className="bg-muted/60 p-4 text-sm">
                    <p className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
                      Catatan dari toko
                    </p>
                    <p className="mt-1">{app.review_note}</p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Section 4 · Commission */}
          <Section title="Skema komisi">
            <p className="text-sm">{formatCommission(app.opportunity.commission).replace("Komisi", "Komisi toko")}.</p>
          </Section>

          {/* Section 8 · Timeline */}
          <Section title="Timeline status">
            <ol className="relative flex flex-col">
              {timeline.map((e, i) => {
                const latest = i === timeline.length - 1
                return (
                  <li key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {!latest && <span className="absolute top-3 left-[5px] h-full w-px bg-border" aria-hidden />}
                    <span
                      className={cn(
                        "relative mt-1 size-[11px] shrink-0 rounded-full ring-4 ring-card",
                        DOT[e.to_status]
                      )}
                    />
                    <div className={cn("flex flex-1 flex-col gap-0.5", latest && "-m-2 bg-muted/60 p-2")}>
                      <p className={cn("text-sm", latest && "font-semibold")}>{e.label}</p>
                      <p className="text-xs text-muted-foreground">
                        oleh {e.actor.name} ({e.actor.role === "store" ? "Toko" : "UMKM"}) · {formatRelative(e.created_at)}
                      </p>
                      {e.note && <p className="text-sm text-foreground/80 italic">{e.note}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </Section>
        </div>
      </div>

      {/* Section 7 · Action sheets */}
      <ShipSheet
        open={sheet === "ship"}
        onOpenChange={(o) => !o && setSheet(null)}
        onSubmit={() => transition("in_delivery", {}, "Ditandai dalam pengiriman.")}
      />
      <ReceiveSheet
        open={sheet === "receive"}
        onOpenChange={(o) => !o && setSheet(null)}
        items={app.items.filter((i) => i.decision === "approved")}
        onSubmit={(qty) =>
          transition(
            "received",
            {
              items: app.items.map((it) =>
                qty[it.id] != null
                  ? {
                      ...it,
                      received_quantity: qty[it.id],
                      stock_quantity: qty[it.id],
                      stock_status: qty[it.id] > 0 ? "available" : "out_of_stock",
                      stock_updated_at: "2026-11-04T16:00:00+07:00",
                    }
                  : it
              ),
            },
            "Barang diterima. Produk masuk ke Stok di rak."
          )
        }
      />
      <CancelSheet
        open={sheet === "cancel"}
        onOpenChange={(o) => !o && setSheet(null)}
        onSubmit={() => transition("cancelled", {}, "Pengajuan dibatalkan.")}
      />
      <ConfirmDialog
        open={sheet === "complete"}
        onOpenChange={(o) => !o && setSheet(null)}
        title="Selesaikan kerja sama ini?"
        description="Stok tidak bisa diubah lagi."
        confirmLabel="Ya, selesaikan"
        onConfirm={() => transition("completed", {}, "Kerja sama diselesaikan.")}
      >
        <FormField label="Catatan (opsional)" htmlFor="complete-note">
          <Textarea id="complete-note" placeholder="Mis. sisa barang sudah diambil." />
        </FormField>
      </ConfirmDialog>
    </AppShell>
  )
}

function ItemCard({
  item: it,
  status,
  stockMode,
  editableStock,
  umkmName,
}: {
  item: ApplicationItem
  status: ApplicationStatus
  stockMode: Application["stock_mode"]
  editableStock: boolean
  umkmName: string
}) {
  const p = it.product
  const onShelf = ["received", "completed"].includes(status) && it.decision === "approved"
  return (
    <div className="flex flex-col gap-4 bg-muted/50 p-5">
      <div className="flex gap-4">
        <Thumb kind="product" className="bg-background" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">{p.name}</p>
            <DecisionChip decision={it.decision} />
          </div>
          <p className="text-xs text-muted-foreground">
            Setor {formatRupiah(p.base_price)} · Saran jual {formatRupiah(p.suggested_retail_price)} ·{" "}
            {p.shelf_life_days ? formatShelfLife(p.shelf_life_days) : `s.d. ${formatDate(p.expiry_date!, { weekday: false })}`}
          </p>
        </div>
      </div>

      {it.decision === "approved" && it.approved_quantity != null && (
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {[
            ["Jumlah disetujui", String(it.approved_quantity)],
            ["Harga jual", formatRupiah(it.sell_price!)],
            ["Komisi toko", `${formatRupiah(it.commission_per_unit!)}/unit`],
            ["Diterima UMKM", `${formatRupiah(it.umkm_income_per_unit!)}/unit`],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5 bg-background p-3">
              <span className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">{label}</span>
              <span className="text-sm font-medium tabular-nums">{value}</span>
            </div>
          ))}
        </div>
      )}

      {it.decision === "rejected" && it.reject_reason && (
        <p className="text-sm text-destructive">Alasan: {it.reject_reason}</p>
      )}

      {onShelf && it.stock_status && (
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            Diterima: <span className="font-medium">{it.received_quantity} unit</span>
          </p>
          {editableStock && status === "received" ? (
            <StockControl
              row={{
                stock_mode: stockMode,
                stock_quantity: it.stock_quantity,
                stock_status: it.stock_status,
                umkm: { business_name: umkmName } as Application["umkm"],
              }}
            />
          ) : (
            <StockChip status={it.stock_status} quantity={it.stock_quantity} mode={stockMode} />
          )}
        </div>
      )}
    </div>
  )
}

function ShipSheet({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (note: string) => void
}) {
  const [note, setNote] = React.useState("")
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg">
        <SheetHeader>
          <SheetTitle>Tandai dikirim</SheetTitle>
          <SheetDescription>Toko akan dikabari bahwa barang sedang dalam perjalanan.</SheetDescription>
          <div className="mt-6">
            <FormField label="Catatan (opsional)" htmlFor="ship-note">
              <Textarea id="ship-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Mis. nama kurir" />
            </FormField>
          </div>
        </SheetHeader>
        <SheetFooter className="pt-0">
          <Button onClick={() => onSubmit(note)}>Tandai dikirim</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function ReceiveSheet({
  open,
  onOpenChange,
  items,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  items: ApplicationItem[]
  onSubmit: (qty: Record<number, number>) => void
}) {
  const [qty, setQty] = React.useState<Record<number, number>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.approved_quantity ?? 0]))
  )
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[90svh] max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Konfirmasi barang diterima</SheetTitle>
          <SheetDescription>Sesuaikan jumlah bila ada yang kurang atau rusak.</SheetDescription>
          <div className="mt-6 flex flex-col divide-y">
            {items.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{i.product.name}</p>
                  <p className="text-xs text-muted-foreground">Disetujui {i.approved_quantity} unit</p>
                </div>
                <NumberStepper
                  label={`Jumlah diterima ${i.product.name}`}
                  value={qty[i.id] ?? 0}
                  min={0}
                  max={i.approved_quantity ?? 0}
                  onChange={(n) => setQty((q) => ({ ...q, [i.id]: n }))}
                />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <FormField label="Catatan (opsional)" htmlFor="receive-note">
              <Textarea id="receive-note" placeholder="Mis. 2 bungkus kemasan sobek." />
            </FormField>
          </div>
        </SheetHeader>
        <SheetFooter className="pt-0">
          <Button onClick={() => onSubmit(qty)}>Konfirmasi diterima</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

const CANCEL_REASONS = ["Produksi terhambat", "Jadwal tidak cocok", "Lainnya"]

function CancelSheet({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSubmit: (reason: string) => void
}) {
  const [chip, setChip] = React.useState<string | null>(null)
  const [text, setText] = React.useState("")
  const reason = chip === "Lainnya" || !chip ? text.trim() : [chip, text.trim()].filter(Boolean).join(". ")
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg">
        <SheetHeader>
          <SheetTitle>Batalkan pengajuan?</SheetTitle>
          <SheetDescription>Pihak lain akan dikabari. Tindakan ini tidak bisa dibatalkan.</SheetDescription>
          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {CANCEL_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={chip === r}
                  onClick={() => setChip(r)}
                  className={cn(
                    "h-9 border px-4 text-xs font-semibold tracking-wider uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                    chip === r ? "border-foreground bg-foreground text-background" : "hover:bg-muted"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <FormField label="Alasan" htmlFor="cancel-reason" required>
              <Textarea
                id="cancel-reason"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Jelaskan singkat alasan pembatalan."
              />
            </FormField>
          </div>
        </SheetHeader>
        <SheetFooter className="pt-0">
          <Button variant="destructive" disabled={!reason} onClick={() => onSubmit(reason)}>
            Ya, batalkan
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

