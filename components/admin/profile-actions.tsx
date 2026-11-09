"use client"

import * as React from "react"

import { adminApi } from "@/lib/api"
import { revalidate } from "@/lib/use-api"
import { toast } from "@/components/ui/toast"
import { RiskyActionModal } from "@/components/admin/risky-action"

type Kind = "store" | "umkm"
type Action = "delete" | "restore"

const PATH: Record<Kind, string> = { store: "/admin/stores", umkm: "/admin/umkms" }

/** Hapus / pulihkan profil toko & UMKM (A04, A06, A07). */
export function useProfileActions() {
  const [state, setState] = React.useState<{ kind: Kind; action: Action; id: string; name: string } | null>(null)
  const open = (kind: Kind, action: Action, target: { id: string; name: string }) => setState({ kind, action, ...target })
  const close = (o: boolean) => !o && setState(null)
  const label = state?.kind === "store" ? "toko" : "UMKM"

  const refresh = () => revalidate("admin", "/admin/users", "/admin/stores", "/admin/umkms", "/admin/audit-logs", "/admin/dashboard")

  const modals = (
    <>
      <RiskyActionModal
        open={state?.action === "delete"}
        onOpenChange={close}
        title={`Hapus profil ${label} ${state?.name ?? ""}?`}
        impacts={
          state?.kind === "store"
            ? ["Peluang toko ini ikut disembunyikan dari feed", "Pemilik diarahkan ke onboarding toko saat masuk lagi"]
            : ["Produk UMKM ini ikut disembunyikan", "Pemilik diarahkan ke onboarding UMKM saat masuk lagi"]
        }
        notify
        notifyLabel="Beri tahu pemilik"
        destructive
        confirmLabel="Hapus profil"
        onConfirm={async ({ reason, notify }) => {
          await adminApi.del(`${PATH[state!.kind]}/${state!.id}`, { body: { admin_reason: reason, notify_user: notify } })
          toast.add({ title: `Profil ${label} dihapus.`, type: "success" })
          void refresh()
        }}
      />
      <RiskyActionModal
        open={state?.action === "restore"}
        onOpenChange={close}
        title={`Pulihkan profil ${label} ${state?.name ?? ""}?`}
        impacts={[state?.kind === "store" ? "Peluang toko ini tampil lagi sesuai statusnya" : "Produk UMKM ini tampil lagi"]}
        confirmLabel="Pulihkan profil"
        onConfirm={async ({ reason }) => {
          await adminApi.post(`${PATH[state!.kind]}/${state!.id}/restore`, { admin_reason: reason })
          toast.add({ title: `Profil ${label} dipulihkan.`, type: "success" })
          void refresh()
        }}
      />
    </>
  )
  return { open, modals }
}
