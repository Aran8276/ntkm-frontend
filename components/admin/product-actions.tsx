"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { adminApi } from "@/lib/api"
import { revalidate } from "@/lib/use-api"
import type { AdminProduct } from "@/lib/admin-types"
import { toast } from "@/components/ui/toast"
import { RiskyActionModal } from "@/components/admin/risky-action"

export type ProductAction = "archive" | "activate" | "delete" | "restore" | "hard_delete" | "remove_photo"

const refresh = () => revalidate("admin", "/admin/products", "/admin/files", "/admin/audit-logs", "/admin/dashboard")

/**
 * Arsipkan / aktifkan / hapus / pulihkan / hapus permanen / hapus foto
 * (A12, A13). A 409 `has_active_relations` from the API opens the shared
 * "Tidak bisa dilanjutkan" dialog with links to the applications.
 */
export function useProductActions() {
  const router = useRouter()
  const [state, setState] = React.useState<{ action: ProductAction; product: AdminProduct; fileId?: string } | null>(null)
  const p = state?.product
  const close = (v: boolean) => !v && setState(null)

  const open = (action: ProductAction, product: AdminProduct, fileId?: string) => setState({ action, product, fileId })

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
        onConfirm={async ({ reason, notify }) => {
          await adminApi.patch(`/admin/products/${p!.id}`, { is_active: false, admin_reason: reason || undefined, notify_user: notify })
          toast.add({ title: "Produk diarsipkan.", type: "success" })
          void refresh()
        }}
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
        onConfirm={async ({ reason, notify }) => {
          await adminApi.patch(`/admin/products/${p!.id}`, { is_active: true, admin_reason: reason || undefined, notify_user: notify })
          toast.add({ title: "Produk diaktifkan.", type: "success" })
          void refresh()
        }}
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
        onConfirm={async ({ reason, notify }) => {
          await adminApi.del(`/admin/products/${p!.id}`, { body: { admin_reason: reason, notify_user: notify } })
          toast.add({ title: "Produk dihapus.", type: "success" })
          void refresh()
        }}
      />
      <RiskyActionModal
        open={state?.action === "restore"}
        onOpenChange={close}
        title={`Pulihkan ${p?.name ?? ""}?`}
        impacts={["Produk kembali dengan status aktif/arsip seperti sebelum dihapus"]}
        confirmLabel="Pulihkan"
        onConfirm={async ({ reason }) => {
          await adminApi.post(`/admin/products/${p!.id}/restore`, { admin_reason: reason })
          toast.add({ title: "Produk dipulihkan.", type: "success" })
          void refresh()
        }}
      />
      <RiskyActionModal
        open={state?.action === "hard_delete"}
        onOpenChange={close}
        title={`Hapus permanen ${p?.name ?? ""}?`}
        impacts={["Produk dihapus permanen dan tidak bisa dipulihkan."]}
        confirmText={p?.name}
        destructive
        confirmLabel="Hapus permanen"
        onConfirm={async ({ reason }) => {
          await adminApi.del(`/admin/products/${p!.id}`, { query: { hard: true }, body: { admin_reason: reason } })
          toast.add({ title: "Produk dihapus permanen.", type: "success" })
          void refresh()
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
        onConfirm={async ({ reason, notify }) => {
          await adminApi.post(`/admin/files/${state!.fileId}/remove`, { admin_reason: reason, notify_user: notify })
          toast.add({ title: "Foto dihapus.", type: "success" })
          void refresh()
        }}
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
