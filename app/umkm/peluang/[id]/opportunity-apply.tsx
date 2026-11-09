"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconAlertTriangle, IconChevronDown, IconMapPin, IconPlus } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatCommission, formatDate, formatDistance, formatRupiah } from "@/lib/format"
import { api, isApiError } from "@/lib/api"
import { revalidate, useApi } from "@/lib/use-api"
import type { Application, ApplicationStatus, FeedOpportunityDetail } from "@/lib/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { AppShell } from "@/components/app/app-shell"
import { InfoRow, PageSkeletonBody, Section, Thumb } from "@/components/app/blocks"
import { LoadError, handleApiError } from "@/components/app/feedback"
import { FormField } from "@/components/app/form-field"
import { CharCount, CommissionCalculator } from "@/components/app/inputs"
import { ApplicationStatusChip, MatchBadge, MatchReasons } from "@/components/app/status"
import {
  CategoryChips,
  OperatingHoursList,
  RequirementList,
  ScheduleList,
} from "@/components/app/opportunity-details"

/** Statuses that count as "already applied" (mirrors ACTIVE_APPLICATION_STATUSES in the API). */
const ACTIVE_STATUSES: ApplicationStatus[] = ["submitted", "approved", "in_delivery", "received"]

const PREVIOUS_TITLE: Partial<Record<ApplicationStatus, string>> = {
  rejected: "Pengajuan sebelumnya ditolak",
  cancelled: "Pengajuan sebelumnya dibatalkan",
  completed: "Kerja sama sebelumnya selesai",
}

/** P16 · Detail peluang + ajukan. */
export function OpportunityApply({ id }: { id: string }) {
  const q = useApi<FeedOpportunityDetail>("user", `/opportunities/${id}`)
  if (!q.data)
    return (
      <AppShell role="umkm" title="Detail peluang" back="/umkm/peluang" width="wide">
        {q.error ? (
          <LoadError
            error={q.error}
            onRetry={q.reload}
            backHref="/umkm/peluang"
            backLabel="Kembali ke daftar peluang"
          />
        ) : (
          <PageSkeletonBody />
        )}
      </AppShell>
    )
  return <ApplyView o={q.data} reload={q.reload} />
}

function ApplyView({ o, reload }: { o: FeedOpportunityDetail; reload: () => Promise<void> }) {
  const router = useRouter()
  const products = o.my_products.map((p) => ({ product: p, eligible: p.eligible, ineligible_reasons: p.ineligible_reasons }))
  const firstEligible = products.find((p) => p.eligible)?.product

  const [selected, setSelected] = React.useState<string[]>([])
  const [note, setNote] = React.useState("")
  const [confirm, setConfirm] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [legalError, setLegalError] = React.useState<string | null>(null)
  const [gone, setGone] = React.useState(false)

  const max = o.max_products_per_umkm
  const unavailable = gone || !o.is_available || o.quota_remaining === 0 || o.status !== "open"
  // Only an active application blocks a new one (the API's rule). After a
  // rejected, cancelled or completed application the UMKM may apply again,
  // e.g. with different products.
  const previous = o.my_application ?? null
  const applied = !!previous && ACTIVE_STATUSES.includes(previous.status)
  const legalMissing = !!legalError

  const toggle = (pid: string, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, pid] : prev.filter((x) => x !== pid)))

  const submit = async () => {
    setSending(true)
    try {
      const app = await api.post<Application>("/applications", { opportunity_id: o.id, product_ids: selected, note })
      toast.add({ title: "Pengajuan terkirim.", type: "success" })
      void revalidate("user", "/applications", "/opportunities", "/notifications")
      router.push(`/kerja-sama/${app.id}`)
    } catch (e) {
      setSending(false)
      setConfirm(false)
      if (isApiError(e) && e.code === "validation_error" && e.field("legal")) {
        setLegalError(e.field("legal")!)
        return
      }
      // 409 already_applied: another active application exists → reload shows it.
      if (isApiError(e) && e.code === "conflict" && e.details?.reason === "already_applied") {
        void reload()
        void revalidate("user", "/opportunities", "/applications")
      } else if (isApiError(e) && (e.code === "not_found" || e.code === "conflict")) setGone(true)
      handleApiError(e, { onReload: reload })
    }
  }

  return (
    <AppShell
      role="umkm"
      title="Detail peluang"
      back="/umkm/peluang"
      width="wide"
      bottomBar={
        !applied && (
          <div className="flex items-center justify-between gap-4">
            <p className="hidden text-sm text-muted-foreground sm:block">
              {selected.length} dari maks {max} dipilih
            </p>
            <Button
              className="w-full sm:w-auto"
              disabled={selected.length === 0 || unavailable}
              onClick={() => setConfirm(true)}
            >
              Ajukan {selected.length || ""} produk
            </Button>
          </div>
        )
      }
    >
      {unavailable && (
        <Alert variant="destructive">
          <IconAlertTriangle />
          <AlertDescription>Peluang ini sudah penuh atau ditutup.</AlertDescription>
        </Alert>
      )}

      {/* Store header */}
      <Section>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <Thumb kind="store" size="lg" src={o.store.photo_url} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-lg font-medium">{o.store.name}</p>
              <p className="text-sm text-muted-foreground">{o.store.address}</p>
              {o.store.distance_km != null && (
                <p className="flex items-center gap-1 text-sm">
                  <IconMapPin className="size-4 text-muted-foreground" />
                  {formatDistance(o.store.distance_km)}
                </p>
              )}
            </div>
          </div>
          <Collapsible className="border-t pt-2">
            <CollapsibleTrigger className="group flex w-full items-center justify-between py-2 text-[0.6875rem] font-semibold tracking-widest uppercase outline-none focus-visible:underline">
              Jam operasional
              <IconChevronDown className="size-4 transition-transform group-data-panel-open:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <OperatingHoursList hours={o.store.operating_hours} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-6">
          {/* Summary */}
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl leading-snug font-semibold tracking-wide uppercase">{o.title}</h2>
            <CategoryChips categories={o.categories} />
            <p className="text-sm text-muted-foreground">
              Sisa {o.quota_remaining} dari {o.quota} UMKM · Berlaku sampai {formatDate(o.valid_until)}
            </p>
          </div>

          {o.match && (
            <Section title="Kecocokan">
              <div className="flex flex-col gap-5">
                <MatchBadge match={o.match} size="lg" interactive={false} />
                <MatchReasons reasons={o.match.reasons} />
              </div>
            </Section>
          )}

          <Section title="Detail & syarat">
            <div className="flex flex-col gap-5">
              {o.description && <p className="text-sm leading-relaxed">{o.description}</p>}
              <RequirementList opportunity={o} />
            </div>
          </Section>

          <Section title="Komisi" description={formatCommission(o.commission)}>
            <CommissionCalculator commission={o.commission} price={firstEligible?.suggested_retail_price ?? 10000} />
          </Section>

          <Section title="Jadwal terima barang" description="Toko akan memilih salah satu slot saat menyetujui.">
            <ScheduleList slots={o.receiving_schedule} />
          </Section>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {applied ? (
            <Section title="Anda sudah mengajukan">
              <div className="flex flex-col gap-4">
                <ApplicationStatusChip status={previous!.status} />
                <Link href={`/kerja-sama/${previous!.id}`} className={cn(buttonVariants({ variant: "outline" }), "self-start")}>
                  Lihat pengajuan
                </Link>
              </div>
            </Section>
          ) : (
            <>
              {previous && (
                <Alert>
                  <IconAlertTriangle />
                  <AlertDescription className="flex flex-col gap-2">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{PREVIOUS_TITLE[previous.status] ?? "Pengajuan sebelumnya"}</span>
                      <ApplicationStatusChip status={previous.status} />
                    </span>
                    <span>Anda bisa mengajukan lagi, misalnya dengan produk lain.</span>
                    <Link href={`/kerja-sama/${previous.id}`} className="self-start text-primary hover:underline">
                      Lihat pengajuan sebelumnya
                    </Link>
                  </AlertDescription>
                </Alert>
              )}
              <Section
                title="Pilih produk"
                action={
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {selected.length} dari maks {max} dipilih
                  </span>
                }
              >
                <div className="flex flex-col gap-4">
                  {legalMissing && (
                    <Alert variant="destructive">
                      <IconAlertTriangle />
                      <AlertDescription>
                        {legalError}{" "}
                        <Link href="/profil/umkm">Lengkapi legalitas</Link>
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="flex flex-col gap-2">
                    {products.map(({ product: p, eligible, ineligible_reasons }) => {
                      const checked = selected.includes(p.id)
                      const locked = !eligible || unavailable || (!checked && selected.length >= max)
                      return (
                        <label
                          key={p.id}
                          className={cn(
                            "flex items-start gap-3 border p-4 transition-colors",
                            checked && "border-primary/30 bg-primary/5",
                            locked && !checked ? "opacity-60" : "cursor-pointer hover:bg-muted/40"
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={locked && !checked}
                            onCheckedChange={(c) => toggle(p.id, c)}
                            className="mt-0.5"
                          />
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="text-sm font-medium">{p.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {p.category.name} · Harga jual {formatRupiah(p.suggested_retail_price)}
                            </span>
                            {!eligible &&
                              ineligible_reasons.map((r) => (
                                <span key={r} className="text-xs text-destructive">
                                  {r}
                                </span>
                              ))}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  <Link
                    href={`/umkm/produk/baru?return=/umkm/peluang/${o.id}`}
                    className="inline-flex items-center gap-1.5 self-start text-[0.6875rem] font-semibold tracking-widest text-primary uppercase hover:underline"
                  >
                    <IconPlus className="size-3.5" /> Tambah produk baru
                  </Link>
                </div>
              </Section>

              <Section title="Catatan untuk toko">
                <FormField label="Catatan" htmlFor="note" aside={<CharCount value={note} max={300} />}>
                  <Textarea
                    id="note"
                    value={note}
                    maxLength={300}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Mis. kapasitas produksi, hari antar yang bisa."
                  />
                </FormField>
              </Section>
            </>
          )}
        </div>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kirim pengajuan?</DialogTitle>
            <DialogDescription>Periksa ringkasan sebelum dikirim ke toko.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col divide-y">
            <InfoRow label="Toko" value={o.store.name} />
            <div className="flex flex-col gap-1 py-2 text-sm">
              <span className="text-muted-foreground">Produk terpilih</span>
              {products
                .filter((p) => selected.includes(p.product.id))
                .map((p) => (
                  <span key={p.product.id} className="font-medium">
                    {p.product.name}
                  </span>
                ))}
            </div>
            <InfoRow label="Komisi" value={formatCommission(o.commission)} />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
            <Button onClick={() => void submit()} disabled={sending}>
              {sending ? (
                <>
                  <Spinner data-icon="inline-start" /> Mengirim…
                </>
              ) : (
                `Ajukan ${selected.length} produk`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
