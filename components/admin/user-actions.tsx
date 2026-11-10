"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconInfoCircle } from "@tabler/icons-react"

import type { AdminLevel, AdminUser, AdminUserDetail } from "@/lib/admin-types"
import type { Role } from "@/lib/types"
import { adminApi, isApiError } from "@/lib/api"
import { revalidate } from "@/lib/use-api"
import { handleApiError } from "@/components/app/feedback"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormField } from "@/components/app/form-field"
import { useAdmin } from "@/components/admin/admin-context"
import { ConflictModal, RiskyActionModal } from "@/components/admin/risky-action"

export type UserAction = "suspend" | "activate" | "delete" | "restore" | "hard_delete"

/** Refetch every admin view that shows users (lists, detail, badges). */
export function refreshUsers() {
  return revalidate("admin", "/admin/users", "/admin/stores", "/admin/umkms", "/admin/dashboard", "/admin/audit-logs")
}

/** Suspend / activate / delete / restore / hard delete modals (A03, A04). */
export function useUserActions() {
  const router = useRouter()
  const [state, setState] = React.useState<{ action: UserAction; user: AdminUser } | null>(null)
  const open = (action: UserAction, user: AdminUser) => setState({ action, user })
  const close = (o: boolean) => !o && setState(null)
  const u = state?.user

  const modals = (
    <>
      <RiskyActionModal
        open={state?.action === "suspend"}
        onOpenChange={close}
        title={`Suspend akun ${u?.name ?? ""}?`}
        impacts={[
          "Pengguna langsung keluar dan tidak bisa masuk",
          "Peluang tokonya disembunyikan dari feed",
          "Produknya tidak bisa diajukan ke peluang baru",
          "Pengajuan aktif tidak berubah otomatis",
        ]}
        notify
        destructive
        confirmLabel="Suspend"
        onConfirm={async ({ reason, notify }) => {
          const res = await adminApi.post<AdminUserDetail & { applications_active: number }>(`/admin/users/${u!.id}/suspend`, {
            admin_reason: reason,
            notify_user: notify,
          })
          toast.add({ title: "Akun disuspend.", type: "success" })
          if (res.applications_active > 0)
            toast.add({
              title: `Akun ini masih punya ${res.applications_active} pengajuan aktif.`,
              description: "Buka tab Kerja sama untuk meninjaunya.",
              type: "info",
              actionProps: { children: "Lihat", onClick: () => router.push(`/admin/pengguna/${u!.id}?tab=kerja-sama`) },
            })
          void refreshUsers()
        }}
      />
      <RiskyActionModal
        open={state?.action === "activate"}
        onOpenChange={close}
        title={`Aktifkan akun ${u?.name ?? ""}?`}
        impacts={["Pengguna bisa masuk kembali", "Peluang dan produknya aktif lagi"]}
        reason="optional"
        notify
        confirmLabel="Aktifkan"
        onConfirm={async ({ reason, notify }) => {
          await adminApi.post(`/admin/users/${u!.id}/activate`, { admin_reason: reason, notify_user: notify })
          toast.add({ title: "Akun diaktifkan.", type: "success" })
          void refreshUsers()
        }}
      />
      <RiskyActionModal
        open={state?.action === "delete"}
        onOpenChange={close}
        title={`Hapus akun ${u?.name ?? ""}?`}
        impacts={["Profil toko/UMKM, peluang, dan produk milik akun ikut disembunyikan", "Data bisa dipulihkan"]}
        destructive
        confirmLabel="Hapus"
        onConfirm={async ({ reason }) => {
          await adminApi.del(`/admin/users/${u!.id}`, { body: { admin_reason: reason } })
          toast.add({ title: "Akun dihapus.", type: "success" })
          void refreshUsers()
        }}
      />
      <RiskyActionModal
        open={state?.action === "restore"}
        onOpenChange={close}
        title={`Pulihkan akun ${u?.name ?? ""}?`}
        impacts={["Akun, profil, peluang, dan produk yang terhapus bersamaan dikembalikan"]}
        confirmLabel="Pulihkan"
        onConfirm={async ({ reason }) => {
          await adminApi.post(`/admin/users/${u!.id}/restore`, { admin_reason: reason })
          toast.add({ title: "Akun dipulihkan.", type: "success" })
          void refreshUsers()
        }}
      />
      <RiskyActionModal
        open={state?.action === "hard_delete"}
        onOpenChange={close}
        title={`Hapus permanen akun ${u?.name ?? ""}?`}
        impacts={[
          "Akun, profil, produk, peluang, notifikasi, dan file milik akun dihapus permanen.",
          "Tidak bisa dibatalkan. Audit log tetap tersimpan.",
        ]}
        confirmText={u?.email}
        destructive
        confirmLabel="Hapus permanen"
        onConfirm={async ({ reason }) => {
          await adminApi.del(`/admin/users/${u!.id}`, { query: { hard: true }, body: { admin_reason: reason } })
          toast.add({ title: "Akun dihapus permanen.", type: "success" })
          void refreshUsers()
          router.push("/admin/pengguna")
        }}
      />
    </>
  )

  return { open, modals }
}

/** Row menu entries for a user, following A03 rules. */
export function userMenu(u: AdminUser, open: (a: UserAction, u: AdminUser) => void, edit: (u: AdminUser) => void, view: () => void) {
  return [
    { label: "Lihat", onSelect: view },
    !u.deleted_at && { label: "Ubah", onSelect: () => edit(u) },
    !u.deleted_at && u.status === "active" && { label: "Suspend", onSelect: () => open("suspend", u), destructive: true },
    !u.deleted_at && u.status === "suspended" && { label: "Aktifkan", onSelect: () => open("activate", u) },
    !u.deleted_at && { label: "Hapus", onSelect: () => open("delete", u), destructive: true },
    !!u.deleted_at && { label: "Pulihkan", onSelect: () => open("restore", u) },
  ]
}

// ---------------------------------------------------------------------------
// A05 · Undang / ubah pengguna
// ---------------------------------------------------------------------------

export function UserFormModal({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present → edit mode. */
  user?: AdminUser | null
}) {
  const [conflictLinks, setConflictLinks] = React.useState<{ label: string; href: string }[]>([])
  const [conflictMessage, setConflictMessage] = React.useState("")
  const [created, setCreated] = React.useState<string | null>(null)
  const router = useRouter()
  const { isSuperadmin } = useAdmin()
  const edit = !!user
  const [email, setEmail] = React.useState("")
  const [name, setName] = React.useState("")
  const [roles, setRoles] = React.useState<Role[]>([])
  const [sendEmail, setSendEmail] = React.useState(true)
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [level, setLevel] = React.useState<AdminLevel>("staff")
  const [reason, setReason] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [busy, setBusy] = React.useState(false)
  const [conflict, setConflict] = React.useState(false)
  const [followUp, setFollowUp] = React.useState<{ email: string; roles: Role[] } | null>(null)
  const [wasOpen, setWasOpen] = React.useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setEmail(user?.email ?? "")
      setName(user?.name ?? "")
      setRoles(user?.roles ?? [])
      setSendEmail(true)
      setIsAdmin(user?.is_admin ?? false)
      setLevel(user?.admin_role ?? "staff")
      setReason("")
      setErrors({})
      setBusy(false)
    }
  }

  const toggleRole = (r: Role, on: boolean) => setRoles((prev) => (on ? [...prev, r] : prev.filter((x) => x !== r)))

  const submit = async () => {
    const e: Record<string, string> = {}
    if (!edit && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Masukkan email yang valid."
    if (!name.trim()) e.name = "Nama wajib diisi."
    if (!roles.length && !(edit && user!.is_admin)) e.roles = "Pilih minimal satu peran."
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      if (edit && user) {
        // PATCH only the fields that changed.
        const body: Record<string, unknown> = {}
        if (name.trim() !== user.name) body.name = name.trim()
        if ([...roles].sort().join() !== [...user.roles].sort().join()) body.roles = roles
        if (isSuperadmin && (isAdmin !== user.is_admin || (isAdmin && level !== user.admin_role))) {
          body.is_admin = isAdmin
          body.admin_role = isAdmin ? level : null
        }
        if (reason.trim()) body.admin_reason = reason.trim()
        await adminApi.patch(`/admin/users/${user.id}`, body)
        toast.add({ title: "Perubahan disimpan.", type: "success" })
      } else {
        const res = await adminApi.post<AdminUserDetail>("/admin/users", {
          email: email.trim(),
          name: name.trim(),
          roles,
          send_invitation_email: sendEmail,
        })
        toast.add({ title: `Undangan dibuat untuk ${email.trim()}.`, type: "success" })
        setCreated(res.id)
        setFollowUp({ email: email.trim(), roles })
      }
      setBusy(false)
      onOpenChange(false)
      void refreshUsers()
    } catch (err) {
      setBusy(false)
      if (isApiError(err) && err.code === "has_active_relations") {
        const ids = (err.details.application_ids as string[] | undefined) ?? []
        setConflictMessage(err.message)
        setConflictLinks(ids.map((id) => ({ label: `Pengajuan ${id.slice(0, 8)}`, href: `/admin/pengajuan/${id}` })))
        setConflict(true)
        return
      }
      if (isApiError(err) && err.code === "conflict" && err.details.email) {
        setErrors({ email: err.message })
        return
      }
      if (isApiError(err) && err.code === "conflict") {
        setErrors({ form: err.message })
        return
      }
      handleApiError(err, {
        admin: true,
        onFieldErrors: (fields) => {
          setErrors(fields)
          return true
        },
      })
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{edit ? "Ubah pengguna" : "Undang pengguna"}</DialogTitle>
            <DialogDescription>
              {edit ? "Hanya field yang berubah yang dikirim." : "Pengguna membuat kata sandinya lewat “Lupa kata sandi” di halaman masuk dengan email ini."}
            </DialogDescription>
          </DialogHeader>
          <form
            id="user-form"
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            {errors.form && <p className="bg-destructive/10 px-4 py-3 text-sm text-destructive">{errors.form}</p>}
            <FormField
              label="Email"
              htmlFor="u-email"
              required={!edit}
              error={errors.email}
              description={edit ? "Email tidak bisa diubah karena dipakai untuk masuk." : undefined}
            >
              <Input
                id="u-email"
                type="email"
                value={email}
                readOnly={edit}
                aria-invalid={!!errors.email || undefined}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@contoh.id"
                className={edit ? "border-dashed text-muted-foreground" : undefined}
              />
            </FormField>
            <FormField label="Nama" htmlFor="u-name" required error={errors.name}>
              <Input id="u-name" value={name} aria-invalid={!!errors.name || undefined} onChange={(e) => setName(e.target.value)} />
            </FormField>
            <FormField label="Peran" required error={errors.roles}>
              <div className="flex gap-6">
                {(
                  [
                    ["store", "Toko"],
                    ["umkm", "UMKM"],
                  ] as const
                ).map(([r, label]) => (
                  <Label key={r} className="flex items-center gap-2.5 normal-case">
                    <Checkbox checked={roles.includes(r)} onCheckedChange={(v) => toggleRole(r, !!v)} />
                    <span className="text-sm font-normal tracking-normal">{label}</span>
                  </Label>
                ))}
              </div>
            </FormField>
            {!edit && (
              <Label className="flex items-center gap-2.5 normal-case">
                <Checkbox checked={sendEmail} onCheckedChange={(v) => setSendEmail(!!v)} />
                <span className="text-sm font-normal tracking-normal">Kirim email undangan</span>
              </Label>
            )}
            {edit && isSuperadmin && (
              <div className="flex flex-col gap-4 border-y py-4">
                <label className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold tracking-widest uppercase">Akses admin</span>
                  <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
                </label>
                {isAdmin && (
                  <RadioGroup value={level} onValueChange={(v) => setLevel(v as AdminLevel)} className="flex gap-6">
                    {(
                      [
                        ["superadmin", "Superadmin"],
                        ["staff", "Staff"],
                      ] as const
                    ).map(([v, l]) => (
                      <Label key={v} className="flex items-center gap-2.5 normal-case">
                        <RadioGroupItem value={v} />
                        <span className="text-sm font-normal tracking-normal">{l}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}
              </div>
            )}
            {edit && (
              <FormField label="Alasan perubahan (opsional)" htmlFor="u-reason">
                <Textarea id="u-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-16" />
              </FormField>
            )}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Batal
            </Button>
            <Button type="submit" form="user-form" data-save disabled={busy}>
              {busy && <Spinner data-icon="inline-start" />}
              {edit ? "Simpan perubahan" : "Buat undangan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConflictModal
        open={conflict}
        onOpenChange={setConflict}
        message={conflictMessage || "Peran ini masih dipakai di pengajuan aktif. Selesaikan atau batalkan pengajuan tersebut dulu."}
        links={conflictLinks}
      />

      <Dialog open={!!followUp} onOpenChange={(o) => !o && setFollowUp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <span className="mb-2 flex size-10 items-center justify-center bg-primary/10 text-primary">
              <IconInfoCircle className="size-5" />
            </span>
            <DialogTitle>Buat profil sekarang?</DialogTitle>
            <DialogDescription>
              Profil bisa dibuat atas nama {followUp?.email} sekarang, atau nanti dari halaman detail pengguna.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => router.push(created ? `/admin/pengguna/${created}` : "/admin/pengguna")}>
              Nanti
            </Button>
            {followUp?.roles.includes("store") && (
              <Button render={<Link href={`/admin/toko/baru?user_id=${created ?? ""}`} />} nativeButton={false}>
                Buat profil toko
              </Button>
            )}
            {followUp?.roles.includes("umkm") && (
              <Button render={<Link href={`/admin/umkm/baru?user_id=${created ?? ""}`} />} nativeButton={false}>
                Buat profil UMKM
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
