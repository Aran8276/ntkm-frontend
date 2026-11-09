"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconPlus } from "@tabler/icons-react"

import type { AdminStore } from "@/lib/admin-types"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Thumb } from "@/components/app/blocks"
import { AdminPage } from "@/components/admin/admin-page"
import { AccountStatusChip, DateTime, DeletedChip } from "@/components/admin/admin-ui"
import { DataTable } from "@/components/admin/data-table"
import { useProfileActions } from "@/components/admin/profile-actions"

/** A06 · Toko. */
export function StoresTable() {
  const router = useRouter()
  const profile = useProfileActions()
  const create = (
    <Button render={<Link href="/admin/toko/baru" />} nativeButton={false}>
      <IconPlus data-icon="inline-start" /> Toko
    </Button>
  )
  return (
    <AdminPage title="Toko" description="Profil toko ritel peserta pilot.">
      <DataTable<AdminStore>
        endpoint="/admin/stores"
        rowKey={(s) => s.id}
        rowHref={(s) => `/admin/pengguna/${s.owner.id}?tab=toko`}
        isDeleted={(s) => !!s.deleted_at}
        search={{ placeholder: "Cari nama toko atau alamat", text: (s) => `${s.name} ${s.address}` }}
        filters={[
          {
            key: "user_status",
            label: "Status akun pemilik",
            options: [
              { value: "invited", label: "Diundang" },
              { value: "active", label: "Aktif" },
              { value: "suspended", label: "Disuspend" },
            ],
            match: (s, v) => s.owner.status === v,
          },
        ]}
        exportResources={["stores"]}
        createAction={create}
        columns={[
          {
            key: "name",
            header: "Nama toko",
            sort: (s) => s.name,
            cell: (s) => (
              <span className="flex items-center gap-3">
                <Thumb kind="store" size="sm" src={s.photo_url} />
                <span className="font-medium">{s.name}</span>
                {s.deleted_at && <DeletedChip />}
              </span>
            ),
          },
          {
            key: "owner",
            header: "Pemilik",
            cell: (s) => (
              <span className="flex flex-col">
                <span>{s.owner.name}</span>
                <span className="text-xs text-muted-foreground">{s.owner.email}</span>
              </span>
            ),
          },
          { key: "phone", header: "Telepon", cell: (s) => <span className="tabular-nums">{s.phone}</span> },
          {
            key: "address",
            header: "Alamat",
            cell: (s) => (
              <Tooltip>
                <TooltipTrigger render={<span className="block max-w-56 truncate text-muted-foreground" />}>{s.address}</TooltipTrigger>
                <TooltipContent>{s.address}</TooltipContent>
              </Tooltip>
            ),
          },
          { key: "open", header: "Peluang dibuka", className: "text-right", cell: (s) => s.stats.opportunities_open },
          { key: "shelf", header: "Item di rak", className: "text-right", cell: (s) => s.stats.items_on_shelf },
          { key: "status", header: "Status akun", cell: (s) => <AccountStatusChip status={s.owner.status} /> },
          { key: "created_at", header: "Dibuat", sort: (s) => s.created_at, cell: (s) => <DateTime value={s.created_at} /> },
        ]}
        rowMenu={(s) => [
          { label: "Lihat", onSelect: () => router.push(`/admin/pengguna/${s.owner.id}?tab=toko`) },
          { label: "Ubah", onSelect: () => router.push(`/admin/toko/${s.id}/ubah`) },
          s.deleted_at
            ? { label: "Pulihkan profil", onSelect: () => profile.open("store", "restore", { id: s.id, name: s.name }) }
            : { label: "Hapus profil", onSelect: () => profile.open("store", "delete", { id: s.id, name: s.name }), destructive: true },
        ]}
        emptyText="Belum ada toko terdaftar."
        emptyAction={create}
      />
      {profile.modals}
    </AdminPage>
  )
}
