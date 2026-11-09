"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconPlus } from "@tabler/icons-react"

import type { AdminUmkm } from "@/lib/admin-types"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Thumb } from "@/components/app/blocks"
import { AdminPage } from "@/components/admin/admin-page"
import { DateTime, DeletedChip, LegalStatusChips } from "@/components/admin/admin-ui"
import { DataTable } from "@/components/admin/data-table"
import { useProfileActions } from "@/components/admin/profile-actions"

const legalOf = (u: AdminUmkm) => ({
  nib: u.legal_verification.nib.status,
  pirt: u.legal_verification.pirt.status,
  halal: u.legal_verification.halal.status,
})

/** A07 · UMKM. */
export function UmkmsTable() {
  const router = useRouter()
  const profile = useProfileActions()
  const create = (
    <Button render={<Link href="/admin/umkm/baru" />} nativeButton={false}>
      <IconPlus data-icon="inline-start" /> UMKM
    </Button>
  )
  return (
    <AdminPage title="UMKM" description="Profil usaha peserta pilot dan status legalitasnya.">
      <DataTable<AdminUmkm>
        endpoint="/admin/umkms"
        rowKey={(u) => u.id}
        rowHref={(u) => `/admin/pengguna/${u.owner.id}?tab=umkm`}
        isDeleted={(u) => !!u.deleted_at}
        search={{
          placeholder: "Cari nama usaha, pemilik, atau alamat",
          text: (u) => `${u.business_name} ${u.owner_name} ${u.address}`,
        }}
        filters={[
          {
            key: "legal_status",
            label: "Status legalitas",
            options: [
              { value: "pending", label: "Menunggu" },
              { value: "verified", label: "Terverifikasi" },
              { value: "rejected", label: "Ditolak" },
              { value: "unverified", label: "Belum diisi" },
            ],
            match: (u, v) => Object.values(u.legal_verification).some((x) => x.status === v),
          },
        ]}
        exportResources={["umkms"]}
        createAction={create}
        columns={[
          {
            key: "business_name",
            header: "Nama usaha",
            sort: (u) => u.business_name,
            cell: (u) => (
              <span className="flex items-center gap-3">
                <Thumb kind="umkm" size="sm" src={u.logo_url} />
                <span className="font-medium">{u.business_name}</span>
                {u.deleted_at && <DeletedChip />}
              </span>
            ),
          },
          { key: "owner", header: "Pemilik", cell: (u) => u.owner_name },
          { key: "phone", header: "Telepon", cell: (u) => <span className="tabular-nums">{u.phone}</span> },
          {
            key: "address",
            header: "Alamat",
            cell: (u) => (
              <Tooltip>
                <TooltipTrigger render={<span className="block max-w-48 truncate text-muted-foreground" />}>{u.address}</TooltipTrigger>
                <TooltipContent>{u.address}</TooltipContent>
              </Tooltip>
            ),
          },
          { key: "legal", header: "Legalitas", cell: (u) => <LegalStatusChips verification={legalOf(u)} /> },
          { key: "products", header: "Produk aktif", className: "text-right", cell: (u) => u.stats.products_active },
          { key: "apps", header: "Pengajuan aktif", className: "text-right", cell: (u) => u.stats.applications_active },
          { key: "created_at", header: "Dibuat", sort: (u) => u.created_at, cell: (u) => <DateTime value={u.created_at} /> },
        ]}
        rowMenu={(u) => [
          { label: "Lihat", onSelect: () => router.push(`/admin/pengguna/${u.owner.id}?tab=umkm`) },
          { label: "Ubah", onSelect: () => router.push(`/admin/umkm/${u.id}/ubah`) },
          { label: "Verifikasi legalitas", onSelect: () => router.push(`/admin/verifikasi?umkm=${u.id}`) },
          u.deleted_at
            ? { label: "Pulihkan profil", onSelect: () => profile.open("umkm", "restore", { id: u.id, name: u.business_name }) }
            : { label: "Hapus profil", onSelect: () => profile.open("umkm", "delete", { id: u.id, name: u.business_name }), destructive: true },
        ]}
        emptyText="Belum ada UMKM terdaftar."
        emptyAction={create}
      />
      {profile.modals}
    </AdminPage>
  )
}
