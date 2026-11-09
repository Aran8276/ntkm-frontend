"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconAlertTriangle, IconCalendarEvent, IconEdit, IconShieldCheck, IconTrash } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { calcCommission, formatCommission, formatDateTime, formatRupiah } from "@/lib/format"
import { adminApi } from "@/lib/api"
import { revalidate, useApi } from "@/lib/use-api"
import type { AdminApplication } from "@/lib/admin-types"
import { LoadError, handleApiError } from "@/components/app/feedback"
import { TableSkeleton } from "@/components/admin/data-table"
import type { ApplicationItem, ApplicationStatus, StockMode } from "@/lib/types"
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
import { APPLICATION_STATUS, ApplicationStatusChip, DecisionChip, StockChip } from "@/components/app/status"
import { useAdmin } from "@/components/admin/admin-context"
import { AdminPage } from "@/components/admin/admin-page"
import {
  AdminHistoryCard,
  DataList,
  DetailColumns,
  Dash,
  IdCell,
  LegalStatusChips,
  OverrideMark,
  PhoneLink,
} from "@/components/admin/admin-ui"
import { slotLabel } from "@/components/admin/embedded"
import { RiskyActionModal } from "@/components/admin/risky-action"
import { StockCorrectionModal, type StockTarget } from "@/components/admin/stock-correction"
import { AdminReviewForm } from "./admin-review-form"
import { parseSlot, upcomingSlots } from "./slot-options"

type Modal = "slot" | "notes" | "stock_mode" | "hard_delete" | null

/** Effect text shown when picking a forced transition (spec A16). */
const TRANSITION_EFFECT: Partial<Record<`${ApplicationStatus}>${ApplicationStatus}`, string>> = {
  "submitted>cancelled": "Pengajuan dibatalkan.",
  "approved>submitted": "Persetujuan dibatalkan; semua keputusan produk dan slot antar dikosongkan; kuota peluang dikembalikan 1.",
  "approved>cancelled": "Pengajuan dibatalkan; kuota peluang dikembalikan 1.",
  "in_delivery>approved": "UMKM dianggap belum berangkat; slot tetap.",
  "in_delivery>received": "Barang dianggap sudah diterima; isi jumlah diterima per produk.",
  "in_delivery>cancelled": "Pengajuan dibatalkan; kuota peluang dikembalikan 1.",
  "received>in_delivery": "Konfirmasi terima dibatalkan; jumlah diterima dan stok dikosongkan.",
  "received>completed": "Kerja sama diselesaikan.",
  "received>cancelled": "Barang ditarik; stok jadi habis tanpa notifikasi stok habis; kuota dikembalikan 1.",
  "rejected>submitted": "Peninjauan dibuka ulang; keputusan dan alasan tolak dikosongkan.",
  "cancelled>submitted": "Pengajuan dibuka ulang; keputusan dikosongkan.",
  "completed>received": "Kerja sama dibuka kembali; stok bisa diubah lagi.",
}

const ACTOR_LABEL: Record<string, string> = { store: "Toko", umkm: "UMKM", admin: "Admin" }

/** Every action ends with a reload of `GET /admin/applications/{id}` (+ lists, badges). */
const refreshAll = () => revalidate("admin", "/admin/applications", "/admin/stock", "/admin/opportunities", "/admin/audit-logs", "/admin/dashboard")

/** A16 · Detail pengajuan: `GET /admin/applications/{id}`. */
export function ApplicationAdminDetail({ id }: { id: string }) {
  const q = useApi<AdminApplication>("admin", `/admin/applications/${id}`)
  if (!q.data)
    return (
      <AdminPage breadcrumb={[{ label: "Pengajuan", href: "/admin/pengajuan" }]} title="Detail pengajuan">
        {q.error ? <LoadError error={q.error} onRetry={q.reload} backHref="/admin/pengajuan" backLabel="Kembali ke Pengajuan" /> : <TableSkeleton />}
      </AdminPage>
    )
  return <DetailView a={q.data} />
}

function DetailView({ a }: { a: AdminApplication }) {
  const { isSuperadmin } = useAdmin()
  const router = useRouter()
  const [modal, setModal] = React.useState<Modal>(null)
  const [numbers, setNumbers] = React.useState<ApplicationItem | null>(null)
  const [stock, setStock] = React.useState<StockTarget | null>(null)
  const close = (o: boolean) => !o && setModal(null)
  const canNumbers = ["approved", "in_delivery", "received", "completed"].includes(a.status)

  return (
    <AdminPage
      breadcrumb={[{ label: "Pengajuan", href: "/admin/pengajuan" }]}
      title={`${a.umkm.business_name} → ${a.store.name}`}
      meta={
        <span className="flex flex-wrap items-center gap-2">
          <ApplicationStatusChip status={a.status} />
          {a.has_override && <OverrideMark />}
        </span>
      }
      description={`Diajukan ${formatDateTime(a.created_at)} · Diperbarui ${formatDateTime(a.updated_at)}`}
    >
      <DetailColumns
        main={
          <>
            <Section title="Para pihak">
              <div className="flex flex-col gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <PartyCard
                    label="Toko"
                    name={a.store.name}
                    href={`/admin/pengguna/${a.store.owner_id}?tab=toko`}
                    phone={a.store.phone}
                    kind="store"
                    image={a.store.photo_url}
                  />
                  <PartyCard
                    label="UMKM"
                    name={a.umkm.business_name}
                    href={`/admin/pengguna/${a.umkm.owner_id}?tab=umkm`}
                    phone={a.umkm.phone}
                    kind="umkm"
                    image={a.umkm.logo_url}
                    extra={<LegalStatusChips verification={a.umkm.legal.verification} />}
                  />
                </div>
                <DataList
                  items={[
                    {
                      label: "Peluang",
                      value: (
                        <Link href={`/admin/peluang/${a.opportunity.id}`} className="text-primary hover:underline">
                          {a.opportunity.title}
                        </Link>
                      ),
                    },
                    { label: "Skema komisi", value: formatCommission(a.opportunity.commission) },
                  ]}
                />
              </div>
            </Section>

            {a.delivery_slot && (
              <Section
                title="Jadwal antar"
                action={
                  ["approved", "in_delivery"].includes(a.status) ? (
                    <Button variant="outline" size="sm" onClick={() => setModal("slot")}>
                      <IconCalendarEvent data-icon="inline-start" /> Ubah slot
                    </Button>
                  ) : undefined
                }
              >
                <DataList items={[{ label: "Slot", value: slotLabel(a) }, { label: "Catatan toko", value: a.review_note || null }]} />
              </Section>
            )}

            <Section title="Produk">
              <div className="-mx-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs tracking-wider whitespace-nowrap text-muted-foreground uppercase">
                      {["Produk", "Keputusan", "Alasan tolak", "Disetujui", "Harga jual", "Komisi/unit", "UMKM/unit", "Diterima", "Stok", ""].map((h, i) => (
                        <th key={i} className="px-3 py-2 font-medium first:pl-6 last:pr-6">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {a.items.map((i) => (
                      <tr key={i.id} className="border-b align-middle last:border-0">
                        <td className="px-3 py-3 pl-6">
                          <span className="flex items-center gap-3">
                            <Thumb size="sm" src={i.product.photo_url} />
                            <span className="flex flex-col">
                              <span className="font-medium">{i.product.name}</span>
                              <span className="text-xs text-muted-foreground">Setor {formatRupiah(i.product.base_price)}</span>
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <DecisionChip decision={i.decision} />
                        </td>
                        <td className="max-w-40 px-3 py-3 text-muted-foreground">{i.reject_reason ?? "—"}</td>
                        <td className="px-3 py-3 tabular-nums">{i.approved_quantity ?? "—"}</td>
                        <td className="px-3 py-3 tabular-nums">{i.sell_price ? formatRupiah(i.sell_price) : "—"}</td>
                        <td className="px-3 py-3 tabular-nums">{i.commission_per_unit != null ? formatRupiah(i.commission_per_unit) : "—"}</td>
                        <td className="px-3 py-3 tabular-nums">{i.umkm_income_per_unit != null ? formatRupiah(i.umkm_income_per_unit) : "—"}</td>
                        <td className="px-3 py-3 tabular-nums">{i.received_quantity ?? "—"}</td>
                        <td className="px-3 py-3">
                          {i.stock_status ? <StockChip status={i.stock_status} quantity={i.stock_quantity} mode={a.stock_mode} /> : <Dash />}
                        </td>
                        <td className="px-3 py-3 pr-6">
                          <span className="flex justify-end gap-1">
                            {canNumbers && i.decision === "approved" && (
                              <Button variant="ghost" size="xs" onClick={() => setNumbers(i)}>
                                Koreksi angka
                              </Button>
                            )}
                            {a.status === "received" && i.stock_status && (
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() =>
                                  setStock({
                                    applicationId: a.id,
                                    itemId: i.id,
                                    productName: i.product.name,
                                    storeName: a.store.name,
                                    mode: a.stock_mode,
                                    quantity: i.stock_quantity,
                                    status: i.stock_status!,
                                  })
                                }
                              >
                                Koreksi stok
                              </Button>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <div className="grid gap-6 md:grid-cols-2">
              <Section
                title="Catatan"
                action={
                  <Button variant="ghost" size="sm" onClick={() => setModal("notes")}>
                    <IconEdit data-icon="inline-start" /> Ubah
                  </Button>
                }
              >
                <DataList
                  columns={1}
                  items={[
                    { label: "Catatan UMKM", value: a.note || null },
                    { label: "Catatan toko", value: a.review_note || null },
                  ]}
                />
              </Section>
              <Section
                title="Mode stok"
                action={
                  ["approved", "in_delivery", "received"].includes(a.status) ? (
                    <Button variant="ghost" size="sm" onClick={() => setModal("stock_mode")}>
                      <IconEdit data-icon="inline-start" /> Ubah
                    </Button>
                  ) : undefined
                }
              >
                <p className="text-sm">{a.stock_mode === "count" ? "Catat jumlah (angka)" : "Ada/habis"}</p>
              </Section>
            </div>

            {a.admin_can_review && <AdminReviewForm application={a} onDone={() => void refreshAll()} />}

            <Section title="Timeline">
              <ol className="relative flex flex-col gap-1 border-l pl-6">
                {a.timeline.map((e) => (
                  <li
                    key={e.id}
                    className={cn("relative py-3", e.is_admin_override && "-ml-6 border-l-2 border-warning bg-warning/10 pr-4 pl-6")}
                  >
                    <span
                      className={cn(
                        "absolute top-4.5 -left-[1.6875rem] size-2.5 rounded-full border-2 border-background bg-foreground/40",
                        e.is_admin_override && "-left-[0.4375rem] bg-warning"
                      )}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{e.label}</span>
                      {e.is_admin_override && <OverrideMark />}
                      <span className="text-xs text-muted-foreground tabular-nums">{formatDateTime(e.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {e.actor.name}
                      {e.actor.role ? ` (${ACTOR_LABEL[e.actor.role] ?? e.actor.role})` : ""}
                      {e.from_status && e.from_status !== e.to_status && (
                        <> · {APPLICATION_STATUS[e.from_status].label} → {APPLICATION_STATUS[e.to_status].label}</>
                      )}
                    </p>
                    {e.note && <p className="mt-1 text-sm text-foreground/80">“{e.note}”</p>}
                    {e.admin_reason && <p className="mt-1 text-sm">Alasan: {e.admin_reason}</p>}
                  </li>
                ))}
              </ol>
            </Section>
          </>
        }
        aside={
          <>
            <ForceStatusCard application={a} />
            <Section title="Info">
              <DataList
                columns={1}
                items={[
                  { label: "ID", value: <IdCell id={a.id} /> },
                  { label: "ID peluang", value: <IdCell id={a.opportunity.id} /> },
                  { label: "Event override", value: a.override_count },
                ]}
              />
            </Section>
            <AdminHistoryCard type="application" id={a.id} />
            {isSuperadmin && (
              <section className="flex flex-col gap-3 border border-destructive/30 bg-destructive/[0.03] p-6">
                <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-destructive uppercase">
                  <IconAlertTriangle className="size-4" /> Zona berbahaya
                </p>
                <p className="text-sm text-muted-foreground">Hapus permanen pengajuan ini beserta produk, timeline, dan notifikasi terkait.</p>
                <Button variant="destructive" className="w-full justify-start" onClick={() => setModal("hard_delete")}>
                  <IconTrash data-icon="inline-start" /> Hapus permanen pengajuan
                </Button>
              </section>
            )}
          </>
        }
      />

      <SlotModal application={a} open={modal === "slot"} onOpenChange={close} />
      <NotesModal key={`notes-${a.updated_at}`} application={a} open={modal === "notes"} onOpenChange={close} />
      <StockModeModal key={`mode-${a.updated_at}`} application={a} open={modal === "stock_mode"} onOpenChange={close} />
      <NumbersModal application={a} item={numbers} onOpenChange={(o) => !o && setNumbers(null)} />
      <StockCorrectionModal target={stock} onOpenChange={(o) => !o && setStock(null)} />
      <RiskyActionModal
        open={modal === "hard_delete"}
        onOpenChange={close}
        title="Hapus permanen pengajuan ini?"
        impacts={["Pengajuan, produk di dalamnya, timeline, dan notifikasi terkait dihapus permanen. Kuota peluang dikoreksi."]}
        confirmText={a.id.slice(0, 8)}
        destructive
        confirmLabel="Hapus permanen"
        onConfirm={async ({ reason }) => {
          await adminApi.del(`/admin/applications/${a.id}`, { query: { hard: true }, body: { admin_reason: reason } })
          toast.add({ title: "Pengajuan dihapus permanen.", type: "success" })
          void refreshAll()
          router.push("/admin/pengajuan")
        }}
      />
    </AdminPage>
  )
}

function PartyCard({
  label,
  name,
  href,
  phone,
  kind,
  image,
  extra,
}: {
  label: string
  name: string
  href: string
  phone: string
  kind: "store" | "umkm"
  image?: string | null
  extra?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4 border p-4">
      <Thumb kind={kind} src={image} />
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">{label}</span>
        <Link href={href} className="font-medium hover:text-primary hover:underline">
          {name}
        </Link>
        <PhoneLink phone={phone} />
        {extra}
      </div>
    </div>
  )
}

function ForceStatusCard({ application: a }: { application: AdminApplication }) {
  const [to, setTo] = React.useState<ApplicationStatus | "">("")
  const [received, setReceived] = React.useState<Record<number, number>>({})
  const [reason, setReason] = React.useState("")
  const [notify, setNotify] = React.useState(true)
  const [confirm, setConfirm] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const approved = a.items.filter((i) => i.decision === "approved")
  const effect = to ? TRANSITION_EFFECT[`${a.status}>${to}`] : null

  return (
    <Section title="Ubah status paksa">
      {a.admin_transitions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada perubahan status yang diizinkan dari status ini.</p>
      ) : (
        <div className="flex flex-col gap-5">
          <FormField label="Status tujuan" htmlFor="force-to">
            <NativeSelect id="force-to" value={to} onChange={(e) => setTo(e.target.value as ApplicationStatus)}>
              <NativeSelectOption value="">Pilih status</NativeSelectOption>
              {a.admin_transitions.map((s) => (
                <NativeSelectOption key={s} value={s}>
                  {APPLICATION_STATUS[a.status].label} → {APPLICATION_STATUS[s].label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FormField>
          {effect && <p className="border-l-2 border-warning bg-warning/10 px-3 py-2 text-sm">{effect}</p>}
          {to === "received" &&
            approved.map((i) => (
              <FormField key={i.id} label={`Diterima · ${i.product.name}`}>
                <NumberStepper
                  label={`Jumlah diterima ${i.product.name}`}
                  value={received[i.id] ?? i.approved_quantity ?? 0}
                  onChange={(n) => setReceived((p) => ({ ...p, [i.id]: n }))}
                  min={0}
                  max={i.approved_quantity ?? 0}
                />
              </FormField>
            ))}
          <FormField label="Alasan" htmlFor="force-reason" required aside={<CharCount value={reason} max={500} />}>
            <Textarea id="force-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-16" />
          </FormField>
          <Label className="flex items-center gap-2.5 normal-case">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(!!v)} />
            <span className="text-sm font-normal tracking-normal">Beri tahu toko dan UMKM</span>
          </Label>
          <Button data-save disabled={!to || reason.trim().length < 5 || busy} onClick={() => setConfirm(true)}>
            <IconShieldCheck data-icon="inline-start" /> Ubah status
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={to ? `Ubah status ke ${APPLICATION_STATUS[to].label}?` : ""}
        description={effect ?? undefined}
        confirmLabel="Ubah status"
        onConfirm={async () => {
          if (!to) return
          setBusy(true)
          try {
            await adminApi.post(`/admin/applications/${a.id}/force-status`, {
              to_status: to,
              received_items:
                to === "received"
                  ? approved.map((i) => ({ item_id: i.id, received_quantity: received[i.id] ?? i.approved_quantity ?? 0 }))
                  : [],
              admin_reason: reason.trim(),
              notify_user: notify,
            })
            toast.add({ title: "Status diubah.", type: "success" })
            setTo("")
            setReason("")
            setReceived({})
            void refreshAll()
          } catch (e) {
            handleApiError(e, { admin: true, onReload: () => void refreshAll() })
          } finally {
            setBusy(false)
          }
        }}
      />
    </Section>
  )
}

function SlotModal({ application: a, open, onOpenChange }: { application: AdminApplication; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [options] = React.useState(() => upcomingSlots(a.opportunity.receiving_schedule))
  const [value, setValue] = React.useState("")
  return (
    <RiskyActionModal
      open={open}
      onOpenChange={onOpenChange}
      title="Ubah slot antar?"
      impacts={[`Slot sekarang: ${slotLabel(a) ?? "—"}`, "Hanya hari yang ada di jadwal terima barang peluang."]}
      notify
      notifyLabel="Beri tahu toko dan UMKM"
      confirmLabel="Ubah slot"
      canConfirm={!!value}
      onConfirm={async ({ reason, notify }) => {
        await adminApi.patch(`/admin/applications/${a.id}`, { delivery_slot: parseSlot(value), admin_reason: reason, notify_user: notify })
        toast.add({ title: "Slot antar diubah.", type: "success" })
        void refreshAll()
      }}
    >
      <FormField label="Slot baru" htmlFor="slot-new" required>
        <NativeSelect id="slot-new" value={value} onChange={(e) => setValue(e.target.value)}>
          <NativeSelectOption value="">Pilih tanggal & jam</NativeSelectOption>
          {options.map((o) => (
            <NativeSelectOption key={o.value} value={o.value}>
              {o.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
    </RiskyActionModal>
  )
}

function NotesModal({ application: a, open, onOpenChange }: { application: AdminApplication; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [note, setNote] = React.useState(a.note)
  const [review, setReview] = React.useState(a.review_note)
  return (
    <RiskyActionModal
      open={open}
      onOpenChange={onOpenChange}
      title="Ubah catatan"
      reason="optional"
      confirmLabel="Simpan catatan"
      canConfirm={note.length <= 300 && review.length <= 300}
      onConfirm={async ({ reason }) => {
        await adminApi.patch(`/admin/applications/${a.id}`, { note, review_note: review, admin_reason: reason || undefined })
        toast.add({ title: "Catatan disimpan.", type: "success" })
        void refreshAll()
      }}
    >
      <FormField label="Catatan UMKM" htmlFor="n-note" aside={<CharCount value={note} max={300} />}>
        <Textarea id="n-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-16" />
      </FormField>
      <FormField label="Catatan toko" htmlFor="n-review" aside={<CharCount value={review} max={300} />}>
        <Textarea id="n-review" value={review} onChange={(e) => setReview(e.target.value)} className="min-h-16" />
      </FormField>
    </RiskyActionModal>
  )
}

function StockModeModal({ application: a, open, onOpenChange }: { application: AdminApplication; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [mode, setMode] = React.useState<StockMode>(a.stock_mode)
  return (
    <RiskyActionModal
      open={open}
      onOpenChange={onOpenChange}
      title="Ubah mode stok"
      reason="optional"
      confirmLabel="Simpan"
      onConfirm={async ({ reason }) => {
        await adminApi.patch(`/admin/applications/${a.id}`, { stock_mode: mode, admin_reason: reason || undefined })
        toast.add({ title: "Mode stok diubah.", type: "success" })
        void refreshAll()
      }}
    >
      <RadioGroup value={mode} onValueChange={(v) => setMode(v as StockMode)} className="flex flex-col gap-3">
        {(
          [
            ["count", "Catat jumlah (angka)"],
            ["boolean", "Ada/habis"],
          ] as const
        ).map(([v, l]) => (
          <Label key={v} className="flex items-center gap-3 border p-4 normal-case has-data-checked:border-primary/30 has-data-checked:bg-primary/5">
            <RadioGroupItem value={v} />
            <span className="text-sm font-normal tracking-normal">{l}</span>
          </Label>
        ))}
      </RadioGroup>
    </RiskyActionModal>
  )
}

function NumbersModal({
  application: a,
  item,
  onOpenChange,
}: {
  application: AdminApplication
  item: ApplicationItem | null
  onOpenChange: (o: boolean) => void
}) {
  const [qty, setQty] = React.useState(0)
  const [price, setPrice] = React.useState<number | null>(null)
  const [recv, setRecv] = React.useState(0)
  const [prev, setPrev] = React.useState<ApplicationItem | null>(null)
  if (item !== prev) {
    setPrev(item)
    if (item) {
      setQty(item.approved_quantity ?? 0)
      setPrice(item.sell_price)
      setRecv(item.received_quantity ?? 0)
    }
  }
  const base = item?.product.base_price ?? 0
  const priceOk = price != null && price >= base
  const calc = priceOk ? calcCommission(price!, a.opportunity.commission) : null
  const showReceived = ["received", "completed"].includes(a.status)

  return (
    <RiskyActionModal
      open={!!item}
      onOpenChange={onOpenChange}
      title={`Koreksi angka ${item?.product.name ?? ""}?`}
      impacts={["Memengaruhi perhitungan bagi hasil toko dan UMKM."]}
      notify
      notifyLabel="Beri tahu toko dan UMKM"
      confirmLabel="Simpan koreksi"
      canConfirm={priceOk}
      onConfirm={async ({ reason, notify }) => {
        await adminApi.patch(`/admin/applications/${a.id}`, {
          items: [
            {
              item_id: item!.id,
              approved_quantity: qty,
              sell_price: price,
              ...(showReceived ? { received_quantity: recv } : {}),
            },
          ],
          admin_reason: reason,
          notify_user: notify,
        })
        toast.add({ title: "Angka produk dikoreksi.", type: "success" })
        void refreshAll()
      }}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Jumlah disetujui">
          <NumberStepper label="Jumlah disetujui" value={qty} onChange={setQty} min={1} max={999} />
        </FormField>
        <FormField label="Harga jual" error={!priceOk ? `Minimal harga setor ${formatRupiah(base)}.` : undefined}>
          <RupiahInput value={price} onChange={setPrice} invalid={!priceOk} />
        </FormField>
        {showReceived && (
          <FormField label="Jumlah diterima">
            <NumberStepper label="Jumlah diterima" value={recv} onChange={setRecv} min={0} max={qty} />
          </FormField>
        )}
      </div>
      {calc && (
        <p className="bg-muted/60 px-4 py-3 text-sm">
          Komisi toko {formatRupiah(calc.commission)}/unit · UMKM terima {formatRupiah(calc.income)}/unit
        </p>
      )}
    </RiskyActionModal>
  )
}
