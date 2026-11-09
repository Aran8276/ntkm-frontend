"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconPlus } from "@tabler/icons-react"

import type { AdminUser } from "@/lib/admin-types"
import { Button } from "@/components/ui/button"
import { AdminPage } from "@/components/admin/admin-page"
import {
  AccountStatusChip,
  AdminLevelChip,
  Avatar,
  DateTime,
  Dash,
  DeletedChip,
  RoleChips,
} from "@/components/admin/admin-ui"
import { DataTable } from "@/components/admin/data-table"
import { UserFormModal, useUserActions, userMenu } from "@/components/admin/user-actions"

/** A03 · Pengguna. */
export function UsersTable() {
  const router = useRouter()
  const { open, modals } = useUserActions()
  const [form, setForm] = React.useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null })

  const invite = (
    <Button onClick={() => setForm({ open: true, user: null })}>
      <IconPlus data-icon="inline-start" /> Undang pengguna
    </Button>
  )

  return (
    <AdminPage title="Pengguna" description="Semua akun peserta pilot dan admin.">
      <DataTable<AdminUser>
        endpoint="/admin/users"
        rowKey={(u) => u.id}
        rowHref={(u) => `/admin/pengguna/${u.id}`}
        isDeleted={(u) => !!u.deleted_at}
        search={{
          placeholder: "Cari nama, email, nama toko, atau nama usaha",
          text: (u) => `${u.name} ${u.email} ${u.store_profile?.name ?? ""} ${u.umkm_profile?.business_name ?? ""}`,
        }}
        filters={[
          {
            key: "role",
            label: "Peran",
            options: [
              { value: "store", label: "Toko" },
              { value: "umkm", label: "UMKM" },
              { value: "none", label: "Tanpa peran" },
            ],
            match: (u, v) => (v === "none" ? u.roles.length === 0 : u.roles.includes(v as "store" | "umkm")),
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "invited", label: "Diundang" },
              { value: "active", label: "Aktif" },
              { value: "suspended", label: "Disuspend" },
            ],
            match: (u, v) => u.status === v,
          },
        ]}
        toggles={[{ key: "is_admin", label: "Admin saja", match: (u) => u.is_admin }]}
        exportResources={["users"]}
        createAction={invite}
        columns={[
          {
            key: "name",
            header: "Nama",
            sort: (u) => u.name,
            cell: (u) => (
              <span className="flex items-center gap-3">
                <Avatar name={u.name} size="sm" />
                <span className="font-medium">{u.name}</span>
                {u.deleted_at && <DeletedChip />}
              </span>
            ),
          },
          { key: "email", header: "Email", cell: (u) => <span className="text-muted-foreground">{u.email}</span> },
          { key: "roles", header: "Peran", cell: (u) => <RoleChips roles={u.roles} /> },
          {
            key: "profile",
            header: "Toko / Usaha",
            cell: (u) =>
              u.store_profile || u.umkm_profile ? (
                <span className="flex max-w-56 flex-col">
                  {u.store_profile && <span className="truncate">{u.store_profile.name}</span>}
                  {u.umkm_profile && <span className="truncate">{u.umkm_profile.business_name}</span>}
                </span>
              ) : (
                <Dash />
              ),
          },
          { key: "status", header: "Status", cell: (u) => <AccountStatusChip status={u.status} /> },
          { key: "admin", header: "Admin", cell: (u) => (u.admin_role ? <AdminLevelChip level={u.admin_role} /> : <Dash />) },
          { key: "last_login_at", header: "Login terakhir", sort: (u) => u.last_login_at, cell: (u) => <DateTime value={u.last_login_at} /> },
          { key: "created_at", header: "Dibuat", sort: (u) => u.created_at, cell: (u) => <DateTime value={u.created_at} /> },
        ]}
        rowMenu={(u) =>
          userMenu(u, open, (user) => setForm({ open: true, user }), () => router.push(`/admin/pengguna/${u.id}`))
        }
        emptyText="Belum ada pengguna. Undang peserta pilot pertama."
        emptyAction={invite}
      />
      {modals}
      <UserFormModal open={form.open} onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))} user={form.user} />
    </AdminPage>
  )
}
