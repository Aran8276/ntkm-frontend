"use client"

import * as React from "react"
import { IconShieldPlus } from "@tabler/icons-react"

import { ADMIN_USERS, AUDIT_LOGS } from "@/lib/admin-mock"
import type { AdminLevel, AdminUser } from "@/lib/admin-types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/toast"
import { FormField } from "@/components/app/form-field"
import { useAdmin } from "@/components/admin/admin-context"
import { AdminPage } from "@/components/admin/admin-page"
import { AdminLevelChip, Avatar, DateTime } from "@/components/admin/admin-ui"
import { AdminAccessDenied } from "@/components/admin/admin-system"
import { DataTable } from "@/components/admin/data-table"
import { EntityPicker } from "@/components/admin/pickers"
import { RiskyActionModal } from "@/components/admin/risky-action"

const ADMINS = ADMIN_USERS.filter((u) => u.is_admin)
const superadminCount = ADMINS.filter((u) => u.admin_role === "superadmin").length

const grantOf = (u: AdminUser) => AUDIT_LOGS.find((l) => l.action === "grant_admin" && l.target_id === u.id)

/** A24 · Admin & akses (superadmin only). */
export function AdminAccess() {
  const { isSuperadmin, me } = useAdmin()
  const [grant, setGrant] = React.useState(false)
  const [level, setLevel] = React.useState<{ user: AdminUser; value: AdminLevel } | null>(null)
  const [revoke, setRevoke] = React.useState<AdminUser | null>(null)
  const [pick, setPick] = React.useState<string | null>(null)
  const [newLevel, setNewLevel] = React.useState<AdminLevel>("staff")

  if (!isSuperadmin) return <AdminAccessDenied />

  const lastSuper = (u: AdminUser) => u.admin_role === "superadmin" && superadminCount <= 1
  const candidates = ADMIN_USERS.filter((u) => !u.deleted_at).map((u) => ({
    value: u.id,
    label: u.name,
    description: u.email,
    disabledReason: u.is_admin ? "Sudah admin" : undefined,
  }))

  const action = (u: AdminUser, label: string, onClick: () => void, destructive?: boolean) => {
    const disabledReason = lastSuper(u)
      ? "Harus ada minimal satu superadmin."
      : destructive && u.id === me.id
        ? "Anda tidak bisa mencabut akses sendiri."
        : null
    const btn = (
      <Button variant={destructive ? "destructive" : "outline"} size="xs" disabled={!!disabledReason} onClick={onClick}>
        {label}
      </Button>
    )
    if (!disabledReason) return btn
    return (
      <Tooltip>
        <TooltipTrigger render={<span tabIndex={0} />}>{btn}</TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <AdminPage
      title="Admin & akses"
      description="Siapa saja yang bisa membuka panel admin."
      actions={
        <Button
          onClick={() => {
            setPick(null)
            setNewLevel("staff")
            setGrant(true)
          }}
        >
          <IconShieldPlus data-icon="inline-start" /> Angkat admin
        </Button>
      }
    >
      <DataTable<AdminUser>
        rows={ADMINS}
        rowKey={(u) => u.id}
        rowHref={(u) => `/admin/pengguna/${u.id}`}
        defaultOrdering="name"
        columns={[
          {
            key: "name",
            header: "Nama",
            sort: (u) => u.name,
            cell: (u) => (
              <span className="flex items-center gap-3">
                <Avatar name={u.name} size="sm" />
                <span className="font-medium">{u.name}</span>
                {u.id === me.id && <span className="text-xs text-muted-foreground">(Anda)</span>}
              </span>
            ),
          },
          { key: "email", header: "Email", cell: (u) => <span className="text-muted-foreground">{u.email}</span> },
          { key: "level", header: "Level", cell: (u) => <AdminLevelChip level={u.admin_role!} /> },
          { key: "last_login_at", header: "Login terakhir", sort: (u) => u.last_login_at, cell: (u) => <DateTime value={u.last_login_at} /> },
          {
            key: "granted",
            header: "Diangkat oleh",
            cell: (u) => {
              const g = grantOf(u)
              return g ? (
                <span className="flex flex-col">
                  <span>{g.admin.name}</span>
                  <DateTime value={g.created_at} className="text-xs text-muted-foreground" />
                </span>
              ) : (
                <span className="text-muted-foreground">Admin awal</span>
              )
            },
          },
          {
            key: "actions",
            header: "Aksi",
            cell: (u) => (
              <span className="flex gap-2">
                {action(u, "Ubah level", () => setLevel({ user: u, value: u.admin_role! }))}
                {action(u, "Cabut akses", () => setRevoke(u), true)}
              </span>
            ),
          },
        ]}
        emptyText="Belum ada admin."
      />

      <RiskyActionModal
        open={grant}
        onOpenChange={setGrant}
        title="Angkat admin"
        confirmLabel="Angkat admin"
        canConfirm={!!pick}
        onConfirm={() => toast.add({ title: `${ADMIN_USERS.find((u) => u.id === pick)?.name ?? "Akun"} sekarang admin.`, type: "success" })}
      >
        <FormField label="Akun" required>
          <EntityPicker options={candidates} value={pick} onChange={setPick} placeholder="Cari nama atau email…" />
        </FormField>
        <LevelRadio value={newLevel} onChange={setNewLevel} />
      </RiskyActionModal>

      <RiskyActionModal
        open={!!level}
        onOpenChange={(o) => !o && setLevel(null)}
        title={`Ubah level ${level?.user.name ?? ""}?`}
        confirmLabel="Simpan level"
        canConfirm={!!level && level.value !== level.user.admin_role}
        onConfirm={() => toast.add({ title: "Level admin diubah.", type: "success" })}
      >
        {level && <LevelRadio value={level.value} onChange={(v) => setLevel({ ...level, value: v })} />}
      </RiskyActionModal>

      <RiskyActionModal
        open={!!revoke}
        onOpenChange={(o) => !o && setRevoke(null)}
        title={`Cabut akses admin ${revoke?.name ?? ""}?`}
        impacts={["Akun ini langsung kehilangan akses panel admin"]}
        destructive
        confirmLabel="Cabut akses"
        onConfirm={() => toast.add({ title: "Akses admin dicabut.", type: "success" })}
      />
    </AdminPage>
  )
}

function LevelRadio({ value, onChange }: { value: AdminLevel; onChange: (v: AdminLevel) => void }) {
  return (
    <FormField label="Level" required>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as AdminLevel)} className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["staff", "Staff", "Kelola data harian"],
            ["superadmin", "Superadmin", "Termasuk hapus permanen & akses admin"],
          ] as const
        ).map(([v, l, d]) => (
          <Label key={v} className="flex items-start gap-3 border p-4 normal-case has-data-checked:border-primary/30 has-data-checked:bg-primary/5">
            <RadioGroupItem value={v} className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium tracking-normal">{l}</span>
              <span className="text-xs font-normal tracking-normal text-muted-foreground">{d}</span>
            </span>
          </Label>
        ))}
      </RadioGroup>
    </FormField>
  )
}
