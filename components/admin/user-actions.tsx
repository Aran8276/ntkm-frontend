"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconInfoCircle } from "@tabler/icons-react"

import type { AdminLevel, AdminUser } from "@/lib/admin-types"
import type { Role } from "@/lib/types"
import { ADMIN_USERS } from "@/lib/admin-mock"
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
        onConfirm={() => {
          toast.add({ title: "Akun disuspend.", type: "success" })
          if (u && u.stats.applications_active > 0)
            toast.add({
              title: `Akun ini masih punya ${u.stats.applications_active} pengajuan aktif.`,
              description: "Buka tab Kerja sama untuk meninjaunya.",
              type: "info",
            })
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
        onConfirm={() => toast.add({ title: "Akun diaktifkan.", type: "success" })}
      />
      <RiskyActionModal
        open={state?.action === "delete"}
        onOpenChange={close}
        title={`Hapus akun ${u?.name ?? ""}?`}
        impacts={["Profil toko/UMKM, peluang, dan produk milik akun ikut disembunyikan", "Data bisa dipulihkan"]}
        destructive
        confirmLabel="Hapus"
        onConfirm={() => toast.add({ title: "Akun dihapus.", type: "success" })}
      />
      <RiskyActionModal
        open={state?.action === "restore"}
        onOpenChange={close}
        title={`Pulihkan akun ${u?.name ?? ""}?`}
        impacts={["Akun, profil, peluang, dan produk yang terhapus bersamaan dikembalikan"]}
        confirmLabel="Pulihkan"
        onConfirm={() => toast.add({ title: "Akun dipulihkan.", type: "success" })}
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
        onConfirm={() => {
          toast.add({ title: "Akun dihapus permanen.", type: "success" })
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

  const toggleRole = (r: Role, on: boolean) => {
    // Removing a role that still has active applications → 409 has_active_relations.
    if (!on && edit && user!.stats.applications_active > 0 && user!.roles.includes(r)) {
      setConflict(true)
      return
    }
    setRoles((prev) => (on ? [...prev, r] : prev.filter((x) => x !== r)))
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!edit && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Masukkan email yang valid."
    else if (!edit && ADMIN_USERS.some((u) => u.email === email.trim().toLowerCase()))
      e.email = ADMIN_USERS.find((u) => u.email === email.trim().toLowerCase())?.deleted_at
        ? "Email ini milik akun yang dihapus. Aktifkan 'Tampilkan yang dihapus' di daftar Pengguna untuk memulihkannya."
        : "Email ini sudah terdaftar."
    if (!name.trim()) e.name = "Nama wajib diisi."
    if (!roles.length && !(edit && user!.is_admin)) e.roles = "Pilih minimal satu peran."
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      onOpenChange(false)
      if (edit) toast.add({ title: "Perubahan disimpan.", type: "success" })
      else {
        toast.add({ title: `Undangan dibuat untuk ${email.trim()}.`, type: "success" })
        setFollowUp({ email: email.trim(), roles })
      }
    }, 700)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{edit ? "Ubah pengguna" : "Undang pengguna"}</DialogTitle>
            <DialogDescription>
              {edit ? "Hanya field yang berubah yang dikirim." : "Pengguna masuk dengan akun Google yang memakai email ini."}
            </DialogDescription>
          </DialogHeader>
          <form
            id="user-form"
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <FormField
              label="Email"
              htmlFor="u-email"
              required={!edit}
              error={errors.email}
              description={edit ? "Email tidak bisa diubah karena dipakai untuk masuk dengan Google." : undefined}
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
        message="Peran ini masih dipakai di pengajuan aktif. Selesaikan atau batalkan pengajuan tersebut dulu."
        links={user ? [{ label: "Lihat pengajuan aktif", href: `/admin/pengguna/${user.id}?tab=kerja-sama` }] : []}
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
            <Button variant="outline" onClick={() => router.push(`/admin/pengguna/${ADMIN_USERS.find((u) => u.status === "invited")!.id}`)}>
              Nanti
            </Button>
            {followUp?.roles.includes("store") && (
              <Button render={<Link href="/admin/toko/baru" />} nativeButton={false}>
                Buat profil toko
              </Button>
            )}
            {followUp?.roles.includes("umkm") && (
              <Button render={<Link href="/admin/umkm/baru" />} nativeButton={false}>
                Buat profil UMKM
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
