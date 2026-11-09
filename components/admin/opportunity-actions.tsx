"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { addDaysIso, todayIso } from "@/lib/format"
import { adminApi } from "@/lib/api"
import { revalidate } from "@/lib/use-api"
import type { AdminOpportunity } from "@/lib/admin-types"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { FormField } from "@/components/app/form-field"
import { RiskyActionModal } from "@/components/admin/risky-action"

export type OppAction = "close" | "reopen" | "delete" | "restore" | "hard_delete"

const refresh = () => revalidate("admin", "/admin/opportunities", "/admin/applications", "/admin/audit-logs", "/admin/dashboard")

/**
 * Tutup / buka ulang / hapus / pulihkan / hapus permanen peluang (A09, A10).
 * Deleting with active applications returns 409 `has_active_relations`,
 * shown by the shared dialog with links to those applications.
 */
export function useOpportunityActions() {
  const router = useRouter()
  const [state, setState] = React.useState<{ action: OppAction; opp: AdminOpportunity } | null>(null)
  const [validUntil, setValidUntil] = React.useState("")
  const [today, setToday] = React.useState("")
  const o = state?.opp
  const close = (v: boolean) => !v && setState(null)

  const open = (action: OppAction, opp: AdminOpportunity) => {
    const t = todayIso()
    setToday(t)
    if (action === "reopen") setValidUntil(opp.valid_until < t ? addDaysIso(30) : opp.valid_until)
    setState({ action, opp })
  }

  const expired = !!o && o.valid_until < today

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
        onConfirm={async ({ reason, notify }) => {
          await adminApi.post(`/admin/opportunities/${o!.id}/close`, { admin_reason: reason, notify_user: notify })
          toast.add({ title: "Peluang ditutup.", type: "success" })
          void refresh()
        }}
      />
      <RiskyActionModal
        open={state?.action === "reopen"}
        onOpenChange={close}
        title={`Buka ulang peluang “${o?.title ?? ""}”?`}
        impacts={["Peluang tampil lagi di feed (atau berstatus Kuota penuh bila kuota habis)"]}
        notify
        notifyLabel="Beri tahu toko"
        confirmLabel="Buka ulang"
        canConfirm={validUntil >= today}
        onConfirm={async ({ reason, notify }) => {
          await adminApi.post(`/admin/opportunities/${o!.id}/reopen`, {
            valid_until: validUntil,
            admin_reason: reason,
            notify_user: notify,
          })
          toast.add({ title: "Peluang dibuka ulang.", type: "success" })
          void refresh()
        }}
      >
        <FormField
          label="Berlaku sampai"
          htmlFor="reopen-valid"
          required={expired}
          description={expired ? "Masa berlaku lama sudah lewat; pilih tanggal baru." : undefined}
          error={validUntil < today ? "Tanggal tidak boleh sebelum hari ini." : undefined}
        >
          <Input id="reopen-valid" type="date" min={today} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="sm:max-w-48" />
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
        onConfirm={async ({ reason, notify }) => {
          await adminApi.del(`/admin/opportunities/${o!.id}`, { body: { admin_reason: reason, notify_user: notify } })
          toast.add({ title: "Peluang dihapus.", type: "success" })
          void refresh()
        }}
      />
      <RiskyActionModal
        open={state?.action === "restore"}
        onOpenChange={close}
        title={`Pulihkan peluang “${o?.title ?? ""}”?`}
        impacts={["Peluang kembali dengan status sebelum dihapus"]}
        confirmLabel="Pulihkan"
        onConfirm={async ({ reason }) => {
          await adminApi.post(`/admin/opportunities/${o!.id}/restore`, { admin_reason: reason })
          toast.add({ title: "Peluang dipulihkan.", type: "success" })
          void refresh()
        }}
      />
      <RiskyActionModal
        open={state?.action === "hard_delete"}
        onOpenChange={close}
        title={`Hapus permanen peluang “${o?.title ?? ""}”?`}
        impacts={["Peluang dihapus permanen dan tidak bisa dipulihkan."]}
        confirmText={o?.title}
        destructive
        confirmLabel="Hapus permanen"
        onConfirm={async ({ reason }) => {
          await adminApi.del(`/admin/opportunities/${o!.id}`, { query: { hard: true }, body: { admin_reason: reason } })
          toast.add({ title: "Peluang dihapus permanen.", type: "success" })
          void refresh()
          router.push("/admin/peluang")
        }}
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
