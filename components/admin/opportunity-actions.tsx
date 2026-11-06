"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { TODAY } from "@/lib/admin-mock"
import type { AdminOpportunity } from "@/lib/admin-types"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { FormField } from "@/components/app/form-field"
import { ConflictModal, RiskyActionModal } from "@/components/admin/risky-action"

export type OppAction = "close" | "reopen" | "delete" | "restore" | "hard_delete"

const ACTIVE_COUNT = (o: AdminOpportunity) =>
  (o.application_counts.submitted ?? 0) +
  (o.application_counts.approved ?? 0) +
  (o.application_counts.in_delivery ?? 0) +
  (o.application_counts.received ?? 0)

/** Tutup / buka ulang / hapus / pulihkan / hapus permanen peluang (A09, A10). */
export function useOpportunityActions() {
  const router = useRouter()
  const [state, setState] = React.useState<{ action: OppAction; opp: AdminOpportunity } | null>(null)
  const [blocked, setBlocked] = React.useState<AdminOpportunity | null>(null)
  const [validUntil, setValidUntil] = React.useState("2026-12-04")
  const o = state?.opp
  const close = (v: boolean) => !v && setState(null)

  const open = (action: OppAction, opp: AdminOpportunity) => {
    // 409 has_active_relations: deleting with active applications is blocked.
    if (action === "delete" && ACTIVE_COUNT(opp) > 0) {
      setBlocked(opp)
      return
    }
    if (action === "reopen") setValidUntil(opp.valid_until < TODAY ? "2026-12-04" : opp.valid_until)
    setState({ action, opp })
  }

  const expired = !!o && o.valid_until < TODAY

  const modals = (
    <>
      <RiskyActionModal
        open={state?.action === "close"}
        onOpenChange={close}
        title={`Tutup peluang “${o?.title ?? ""}”?`}
        impacts={["Peluang hilang dari feed UMKM", "Pengajuan yang sudah masuk tetap bisa ditinjau"]}
        notify
        notifyLabel="Beri tahu toko"
        confirmLabel="Tutup peluang"
        onConfirm={() => toast.add({ title: "Peluang ditutup.", type: "success" })}
      />
      <RiskyActionModal
        open={state?.action === "reopen"}
        onOpenChange={close}
        title={`Buka ulang peluang “${o?.title ?? ""}”?`}
        impacts={["Peluang tampil lagi di feed (atau berstatus Kuota penuh bila kuota habis)"]}
        notify
        notifyLabel="Beri tahu toko"
        confirmLabel="Buka ulang"
        canConfirm={validUntil >= TODAY}
        onConfirm={() => toast.add({ title: "Peluang dibuka ulang.", type: "success" })}
      >
        <FormField
          label="Berlaku sampai"
          htmlFor="reopen-valid"
          required={expired}
          description={expired ? "Masa berlaku lama sudah lewat; pilih tanggal baru." : undefined}
          error={validUntil < TODAY ? "Tanggal tidak boleh sebelum hari ini." : undefined}
        >
          <Input id="reopen-valid" type="date" min={TODAY} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="sm:max-w-48" />
        </FormField>
      </RiskyActionModal>
      <RiskyActionModal
        open={state?.action === "delete"}
        onOpenChange={close}
        title={`Hapus peluang “${o?.title ?? ""}”?`}
        impacts={["Peluang disembunyikan dari toko dan UMKM", "Bisa dipulihkan", "Diblokir bila masih ada pengajuan aktif"]}
        notify
        notifyLabel="Beri tahu toko"
        destructive
        confirmLabel="Hapus"
        onConfirm={() => toast.add({ title: "Peluang dihapus.", type: "success" })}
      />
      <RiskyActionModal
        open={state?.action === "restore"}
        onOpenChange={close}
        title={`Pulihkan peluang “${o?.title ?? ""}”?`}
        impacts={["Peluang kembali dengan status sebelum dihapus"]}
        confirmLabel="Pulihkan"
        onConfirm={() => toast.add({ title: "Peluang dipulihkan.", type: "success" })}
      />
      <RiskyActionModal
        open={state?.action === "hard_delete"}
        onOpenChange={close}
        title={`Hapus permanen peluang “${o?.title ?? ""}”?`}
        impacts={["Peluang dihapus permanen dan tidak bisa dipulihkan."]}
        confirmText={o?.title}
        destructive
        confirmLabel="Hapus permanen"
        onConfirm={() => {
          toast.add({ title: "Peluang dihapus permanen.", type: "success" })
          router.push("/admin/peluang")
        }}
      />
      <ConflictModal
        open={!!blocked}
        onOpenChange={(v) => !v && setBlocked(null)}
        message="Peluang ini masih punya pengajuan aktif. Selesaikan atau batalkan pengajuan tersebut sebelum menghapus."
        links={blocked ? [{ label: "Lihat pengajuan aktif", href: `/admin/pengajuan?opportunity_id=${blocked.id}` }] : []}
      />
    </>
  )
  return { open, modals }
}

export function opportunityMenu(o: AdminOpportunity, open: (a: OppAction, o: AdminOpportunity) => void, go: (href: string) => void) {
  return [
    { label: "Lihat", onSelect: () => go(`/admin/peluang/${o.id}`) },
    !o.deleted_at && { label: "Ubah", onSelect: () => go(`/admin/peluang/${o.id}/ubah`) },
    !o.deleted_at && o.status !== "closed" && { label: "Tutup", onSelect: () => open("close", o) },
    !o.deleted_at && o.status === "closed" && { label: "Buka ulang", onSelect: () => open("reopen", o) },
    o.deleted_at
      ? { label: "Pulihkan", onSelect: () => open("restore", o) }
      : { label: "Hapus", onSelect: () => open("delete", o), destructive: true },
  ]
}
