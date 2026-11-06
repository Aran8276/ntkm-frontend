"use client"

import * as React from "react"

import { toast } from "@/components/ui/toast"
import { RiskyActionModal } from "@/components/admin/risky-action"

type Kind = "store" | "umkm"
type Action = "delete" | "restore"

/** Hapus / pulihkan profil toko & UMKM (A04, A06, A07). */
export function useProfileActions() {
  const [state, setState] = React.useState<{ kind: Kind; action: Action; name: string } | null>(null)
  const open = (kind: Kind, action: Action, name: string) => setState({ kind, action, name })
  const close = (o: boolean) => !o && setState(null)
  const label = state?.kind === "store" ? "toko" : "UMKM"

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
        onConfirm={() => toast.add({ title: `Profil ${label} dihapus.`, type: "success" })}
      />
      <RiskyActionModal
        open={state?.action === "restore"}
        onOpenChange={close}
        title={`Pulihkan profil ${label} ${state?.name ?? ""}?`}
        impacts={[state?.kind === "store" ? "Peluang toko ini tampil lagi sesuai statusnya" : "Produk UMKM ini tampil lagi"]}
        confirmLabel="Pulihkan profil"
        onConfirm={() => toast.add({ title: `Profil ${label} dipulihkan.`, type: "success" })}
      />
    </>
  )
  return { open, modals }
}
