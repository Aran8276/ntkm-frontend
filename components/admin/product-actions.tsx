"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import type { AdminProduct } from "@/lib/admin-types"
import { toast } from "@/components/ui/toast"
import { ConflictModal, RiskyActionModal } from "@/components/admin/risky-action"

export type ProductAction = "archive" | "activate" | "delete" | "restore" | "hard_delete" | "remove_photo"

const activeApps = (p: AdminProduct) => p.applications.filter((a) => ["submitted", "approved", "in_delivery", "received"].includes(a.status))

/** Arsipkan / aktifkan / hapus / pulihkan / hapus permanen / hapus foto (A12, A13). */
export function useProductActions() {
  const router = useRouter()
  const [state, setState] = React.useState<{ action: ProductAction; product: AdminProduct } | null>(null)
  const [blocked, setBlocked] = React.useState<AdminProduct | null>(null)
  const p = state?.product
  const close = (v: boolean) => !v && setState(null)

  const open = (action: ProductAction, product: AdminProduct) => {
    if (action === "delete" && activeApps(product).length > 0) {
      setBlocked(product)
      return
    }
    setState({ action, product })
  }

  const modals = (
    <>
      <RiskyActionModal
        open={state?.action === "archive"}
        onOpenChange={close}
        title={`Arsipkan ${p?.name ?? ""}?`}
        impacts={["Produk tidak bisa dipilih untuk pengajuan baru", "UMKM masih melihatnya di tab Diarsipkan"]}
        reason="optional"
        notify
        notifyLabel="Beri tahu UMKM"
        confirmLabel="Arsipkan"
        onConfirm={() => toast.add({ title: "Produk diarsipkan.", type: "success" })}
      />
      <RiskyActionModal
        open={state?.action === "activate"}
        onOpenChange={close}
        title={`Aktifkan ${p?.name ?? ""}?`}
        impacts={["Produk bisa diajukan lagi"]}
        reason="optional"
        notify
        notifyLabel="Beri tahu UMKM"
        confirmLabel="Aktifkan"
        onConfirm={() => toast.add({ title: "Produk diaktifkan.", type: "success" })}
      />
      <RiskyActionModal
        open={state?.action === "delete"}
        onOpenChange={close}
        title={`Hapus ${p?.name ?? ""}?`}
        impacts={[
          "Produk disembunyikan dari UMKM dan toko",
          "Riwayat pengajuan lama tetap memakai data saat diajukan",
          "Diblokir bila ada di pengajuan aktif",
        ]}
        notify
        notifyLabel="Beri tahu UMKM"
        destructive
        confirmLabel="Hapus"
        onConfirm={() => toast.add({ title: "Produk dihapus.", type: "success" })}
      />
      <RiskyActionModal
        open={state?.action === "restore"}
        onOpenChange={close}
        title={`Pulihkan ${p?.name ?? ""}?`}
        impacts={["Produk kembali dengan status aktif/arsip seperti sebelum dihapus"]}
        confirmLabel="Pulihkan"
        onConfirm={() => toast.add({ title: "Produk dipulihkan.", type: "success" })}
      />
      <RiskyActionModal
        open={state?.action === "hard_delete"}
        onOpenChange={close}
        title={`Hapus permanen ${p?.name ?? ""}?`}
        impacts={["Produk dihapus permanen dan tidak bisa dipulihkan."]}
        confirmText={p?.name}
        destructive
        confirmLabel="Hapus permanen"
        onConfirm={() => {
          toast.add({ title: "Produk dihapus permanen.", type: "success" })
          router.push("/admin/produk")
        }}
      />
      <RiskyActionModal
        open={state?.action === "remove_photo"}
        onOpenChange={close}
        title={`Hapus foto ${p?.name ?? ""}?`}
        impacts={[
          "Foto dilepas dari produk ini dan diganti gambar placeholder di semua tampilan",
          "UMKM diminta mengunggah foto baru bila produk jadi tanpa foto",
        ]}
        notify
        notifyLabel="Beri tahu UMKM"
        destructive
        confirmLabel="Hapus foto"
        onConfirm={() => toast.add({ title: "Foto dihapus.", type: "success" })}
      />
      <ConflictModal
        open={!!blocked}
        onOpenChange={(v) => !v && setBlocked(null)}
        message="Produk ini masih ada di pengajuan aktif."
        links={blocked ? activeApps(blocked).map((a) => ({ label: `Pengajuan ${a.id.slice(0, 8)} · ${a.store}`, href: `/admin/pengajuan/${a.id}` })) : []}
      />
    </>
  )
  return { open, modals }
}

export function productMenu(p: AdminProduct, open: (a: ProductAction, p: AdminProduct) => void, go: (href: string) => void) {
  return [
    { label: "Lihat", onSelect: () => go(`/admin/produk/${p.id}`) },
    !p.deleted_at && { label: "Ubah", onSelect: () => go(`/admin/produk/${p.id}/ubah`) },
    !p.deleted_at && p.is_active && { label: "Arsipkan", onSelect: () => open("archive", p) },
    !p.deleted_at && !p.is_active && { label: "Aktifkan", onSelect: () => open("activate", p) },
    p.deleted_at
      ? { label: "Pulihkan", onSelect: () => open("restore", p) }
      : { label: "Hapus", onSelect: () => open("delete", p), destructive: true },
  ]
}
