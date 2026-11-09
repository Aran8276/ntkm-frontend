"use client"

import * as React from "react"
import Link from "next/link"
import { IconShieldCheck } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatDateTime, formatRelative } from "@/lib/format"
import { adminApi, type Paginated } from "@/lib/api"
import { revalidate, useApi } from "@/lib/use-api"
import type { AdminUmkm, LegalKind, LegalQueueItem } from "@/lib/admin-types"
import { LoadError, handleApiError } from "@/components/app/feedback"
import { useAdmin } from "@/components/admin/admin-context"
import { TableSkeleton } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { EmptyState, Section } from "@/components/app/blocks"
import { useUrlParams } from "@/hooks/use-url-params"
import { AdminPage } from "@/components/admin/admin-page"
import { IdCell, PhoneLink, TabBar, VerificationChip } from "@/components/admin/admin-ui"
import { DocumentViewer } from "@/components/admin/pickers"

type Tab = "pending" | "verified" | "rejected"
type Decision = "verify" | "reject" | "keep"

const KINDS: { key: LegalKind; label: string; field: keyof AdminUmkm["legal"] }[] = [
  { key: "nib", label: "NIB", field: "nib" },
  { key: "pirt", label: "PIRT", field: "pirt_number" },
  { key: "halal", label: "Halal", field: "halal_number" },
]

const KIND_LABEL: Record<LegalKind, string> = { nib: "NIB", pirt: "PIRT", halal: "Halal" }

function waitingLabel(since: string | null) {
  if (!since) return null
  const days = Math.floor((Date.now() - new Date(since).getTime()) / 86_400_000)
  return days >= 1 ? `Menunggu ${days} hari` : `Menunggu sejak ${formatRelative(since)}`
}

/** A18 · Verifikasi legalitas: queue `GET /admin/legal-verifications?status=`, detail `GET /admin/umkms/{id}`. */
export function LegalVerification() {
  const { get, set } = useUrlParams()
  const { refreshBadges } = useAdmin()
  const tab = (get("status") as Tab | null) ?? "pending"
  const listQ = useApi<Paginated<LegalQueueItem>>("admin", "/admin/legal-verifications", { status: tab, page_size: 100 })
  const pendingQ = useApi<Paginated<LegalQueueItem>>("admin", "/admin/legal-verifications", { status: "pending", page_size: 1 })
  const list = listQ.data?.results ?? []
  const selectedId = get("umkm") ?? list[0]?.umkm.id ?? null
  // The right panel loads even when ?umkm= is not in the active tab.
  const selectedQ = useApi<AdminUmkm>("admin", selectedId ? `/admin/umkms/${selectedId}` : null)
  const selected = selectedQ.data?.id === selectedId ? selectedQ.data : undefined
  const pendingCount = pendingQ.data?.count ?? 0

  if (listQ.error && !listQ.data)
    return (
      <AdminPage title="Verifikasi legalitas">
        <LoadError error={listQ.error} onRetry={listQ.reload} backHref="/admin" backLabel="Kembali ke Dashboard" />
      </AdminPage>
    )

  return (
    <AdminPage title="Verifikasi legalitas" description="Putuskan NIB, PIRT, dan sertifikat halal yang menunggu.">
      <TabBar
        value={tab}
        onChange={(v) => set({ status: v === "pending" ? null : v, umkm: null })}
        options={[
          { value: "pending", label: "Menunggu", count: pendingCount },
          { value: "verified", label: "Terverifikasi" },
          { value: "rejected", label: "Ditolak" },
        ]}
      />
      {listQ.loading ? (
        <TableSkeleton />
      ) : !list.length && !selectedId ? (
        <EmptyState icon={IconShieldCheck}>
          {tab === "pending" ? "Tidak ada legalitas yang menunggu verifikasi." : "Belum ada data di tab ini."}
        </EmptyState>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <ul className="flex flex-col bg-background shadow-sm ring-1 ring-foreground/5 lg:sticky lg:top-24">
            {list.length ? (
              list.map((row) => {
                const u = row.umkm
                const active = u.id === selectedId
                return (
                  <li key={u.id} className="border-b last:border-0">
                    <button
                      type="button"
                      onClick={() => set({ umkm: u.id })}
                      aria-current={active || undefined}
                      className={cn(
                        "relative flex w-full flex-col gap-1.5 px-5 py-4 text-left outline-none hover:bg-muted/50 focus-visible:bg-muted",
                        active && "bg-primary/5"
                      )}
                    >
                      {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
                      <span className="text-sm font-medium">{u.business_name}</span>
                      <span className="text-xs text-muted-foreground">{u.owner_name}</span>
                      <span className="flex flex-wrap items-center gap-2">
                        <VerificationChip status={tab}>{row.kinds.map((k) => KIND_LABEL[k]).join(" · ")}</VerificationChip>
                        {tab === "pending" && <span className="text-xs text-muted-foreground">{waitingLabel(row.waiting_since)}</span>}
                      </span>
                    </button>
                  </li>
                )
              })
            ) : (
              <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                {tab === "pending" ? "Tidak ada legalitas yang menunggu verifikasi." : "Belum ada data di tab ini."}
              </li>
            )}
          </ul>
          {selected ? (
            <DecisionPanel
              key={`${selected.id}-${selected.updated_at}`}
              umkm={selected}
              onSaved={() => {
                // Reload the queue and select the next UMKM automatically.
                const next = list.find((r) => r.umkm.id !== selected.id)
                void revalidate("admin", "/admin/legal-verifications", "/admin/umkms", "/admin/audit-logs")
                refreshBadges()
                set({ umkm: next?.umkm.id ?? null })
              }}
            />
          ) : selectedQ.error ? (
            <LoadError error={selectedQ.error} onRetry={selectedQ.reload} />
          ) : selectedId ? (
            <TableSkeleton />
          ) : null}
        </div>
      )}
    </AdminPage>
  )
}

function DecisionPanel({ umkm: u, onSaved }: { umkm: AdminUmkm; onSaved: () => void }) {
  const [decisions, setDecisions] = React.useState<Record<LegalKind, Decision>>({ nib: "keep", pirt: "keep", halal: "keep" })
  const [notes, setNotes] = React.useState<Record<LegalKind, string>>({ nib: "", pirt: "", halal: "" })
  const [notify, setNotify] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  const anyDecision = Object.values(decisions).some((d) => d !== "keep")
  const missingNote = KINDS.some((k) => decisions[k.key] === "reject" && !notes[k.key].trim())

  const save = async () => {
    if (!anyDecision || missingNote) return
    setSaving(true)
    // Only the kinds that were decided are sent.
    const body: Record<string, unknown> = { notify_user: notify }
    for (const k of KINDS) {
      const d = decisions[k.key]
      if (d !== "keep") body[k.key] = { status: d === "verify" ? "verified" : "rejected", note: notes[k.key].trim() }
    }
    try {
      await adminApi.post(`/admin/umkms/${u.id}/legal-verification`, body)
      setSaving(false)
      toast.add({ title: "Keputusan legalitas disimpan.", type: "success" })
      onSaved()
    } catch (e) {
      setSaving(false)
      handleApiError(e, { admin: true })
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Section>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link href={`/admin/pengguna/${u.owner.id}?tab=umkm`} className="text-lg font-medium hover:text-primary hover:underline">
              {u.business_name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {u.owner_name} · <PhoneLink phone={u.phone} />
            </p>
          </div>
          <IdCell id={u.id} />
        </div>
      </Section>

      <Section title="Dokumen">
        <DocumentViewer files={u.legal_documents} />
      </Section>

      <Section title="Keputusan" description="Cocokkan nomor dengan dokumen. Bila perlu, cek NIB di situs resmi OSS dan sertifikat halal di situs resmi BPJPH.">
        <div className="flex flex-col divide-y border-y">
          {KINDS.map((k) => {
            const number = u.legal[k.field]
            const v = u.legal_verification[k.key]
            const d = decisions[k.key]
            return (
              <div key={k.key} className={cn("grid gap-4 py-5 md:grid-cols-[6rem_minmax(0,1fr)_minmax(0,1.4fr)]", !number && "opacity-60")}>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold tracking-widest uppercase">{k.label}</span>
                  <VerificationChip status={v.status} />
                </div>
                <div className="flex min-w-0 flex-col gap-1.5 text-sm">
                  {number ? (
                    <span className="flex items-center gap-1">
                      <code className="font-mono text-xs [overflow-wrap:anywhere]">{number}</code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(number).catch(() => {})
                          toast.add({ title: "Nomor disalin.", type: "success" })
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Salin
                      </button>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Belum diisi UMKM</span>
                  )}
                  {v.decided_by && (
                    <span className="text-xs text-muted-foreground">
                      {v.note ? `“${v.note}” · ` : ""}
                      {v.decided_by.name}
                      {v.decided_at ? `, ${formatDateTime(v.decided_at)}` : ""}
                    </span>
                  )}
                </div>
                {number && (
                  <div className="flex flex-col gap-3">
                    <div role="radiogroup" aria-label={`Keputusan ${k.label}`} className="flex">
                      {(
                        [
                          ["verify", "Verifikasi"],
                          ["reject", "Tolak"],
                          ["keep", "Biarkan"],
                        ] as [Decision, string][]
                      ).map(([val, lbl]) => (
                        <button
                          key={val}
                          type="button"
                          role="radio"
                          aria-checked={d === val}
                          onClick={() => setDecisions((p) => ({ ...p, [k.key]: val }))}
                          className={cn(
                            "-ml-px h-9 flex-1 border px-3 text-[0.6875rem] font-semibold tracking-widest uppercase outline-none first:ml-0 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/30",
                            d === val
                              ? val === "verify"
                                ? "z-10 border-success bg-success/10 text-success"
                                : val === "reject"
                                  ? "z-10 border-destructive bg-destructive/10 text-destructive"
                                  : "z-10 border-foreground/30 bg-muted"
                              : "text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                    {d !== "keep" && (
                      <Textarea
                        value={notes[k.key]}
                        onChange={(e) => setNotes((p) => ({ ...p, [k.key]: e.target.value }))}
                        placeholder={d === "reject" ? "Mis. nomor tidak cocok dengan dokumen." : "Catatan (opsional)"}
                        aria-invalid={(d === "reject" && !notes[k.key].trim()) || undefined}
                        className="min-h-16"
                      />
                    )}
                    {d === "reject" && !notes[k.key].trim() && <p className="text-xs text-destructive">Catatan wajib diisi bila ditolak.</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Label className="flex items-center gap-2.5 normal-case">
            <Checkbox checked={notify} onCheckedChange={(v) => setNotify(!!v)} />
            <span className="text-sm font-normal tracking-normal">Beri tahu UMKM</span>
          </Label>
          <Button data-save disabled={!anyDecision || missingNote || saving} onClick={() => void save()}>
            {saving && <Spinner data-icon="inline-start" />}
            Simpan keputusan
          </Button>
        </div>
      </Section>
    </div>
  )
}
