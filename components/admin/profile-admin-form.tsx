"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { IconInfoCircle } from "@tabler/icons-react"

import { ADMIN_USERS } from "@/lib/admin-mock"
import type { AdminStore, AdminUmkm, LegalKind } from "@/lib/admin-types"
import type { OperatingHour } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { FormField } from "@/components/app/form-field"
import {
  CharCount,
  DEFAULT_HOURS,
  FileUpload,
  LocationPicker,
  OperatingHoursEditor,
} from "@/components/app/inputs"
import { AdminPage } from "@/components/admin/admin-page"
import { VerificationChip } from "@/components/admin/admin-ui"
import { AdminFormLayout, AdminNoteFields, FormSectionCard } from "@/components/admin/form-layout"
import { EntityPicker } from "@/components/admin/pickers"

type Props =
  | { kind: "store"; profile?: AdminStore }
  | { kind: "umkm"; profile?: AdminUmkm }

/** A08 · Form profil toko / UMKM (create & edit). */
export function ProfileAdminForm(props: Props) {
  const { kind } = props
  const router = useRouter()
  const params = useSearchParams()
  const edit = !!props.profile
  const store = kind === "store" ? props.profile : undefined
  const umkm = kind === "umkm" ? props.profile : undefined
  const label = kind === "store" ? "toko" : "UMKM"

  const [ownerId, setOwnerId] = React.useState<string | null>(props.profile?.owner.id ?? params.get("user_id"))
  const owner = ADMIN_USERS.find((u) => u.id === ownerId)
  const [name, setName] = React.useState(store?.name ?? umkm?.business_name ?? "")
  const [ownerName, setOwnerName] = React.useState(umkm?.owner_name ?? owner?.name ?? "")
  const [phone, setPhone] = React.useState(props.profile?.phone ?? "")
  const [description, setDescription] = React.useState(umkm?.description ?? "")
  const [address, setAddress] = React.useState(props.profile?.address ?? "")
  const [hours, setHours] = React.useState<OperatingHour[]>(store?.operating_hours ?? DEFAULT_HOURS)
  const [legal, setLegal] = React.useState({
    nib: umkm?.legal.nib ?? "",
    pirt: umkm?.legal.pirt_number ?? "",
    halal: umkm?.legal.halal_number ?? "",
  })
  const [reason, setReason] = React.useState("")
  const [notify, setNotify] = React.useState(true)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const [dirty, setDirty] = React.useState(false)
  const touch = <T,>(set: (v: T) => void) => (v: T) => {
    setDirty(true)
    set(v)
  }

  const ownerOptions = ADMIN_USERS.filter((u) => !u.deleted_at).map((u) => ({
    value: u.id,
    label: u.name,
    description: u.email,
    disabledReason:
      (kind === "store" ? u.store_profile : u.umkm_profile) && u.id !== props.profile?.owner.id
        ? `Sudah punya profil ${label}`
        : undefined,
  }))

  const sections = [
    { id: "pemilik", title: "Pemilik" },
    { id: "info", title: kind === "store" ? "Info toko" : "Info usaha" },
    { id: "lokasi", title: "Lokasi" },
    kind === "store" ? { id: "jam", title: "Jam operasional" } : { id: "legal", title: "Legalitas" },
    ...(edit ? [{ id: "catatan", title: "Catatan admin" }] : []),
  ]

  const submit = () => {
    const e: Record<string, string> = {}
    if (!ownerId) e.owner = "Pilih akun pemilik."
    if (name.trim().length < 3) e.name = `Nama ${kind === "store" ? "toko" : "usaha"} minimal 3 karakter.`
    if (kind === "umkm" && !ownerName.trim()) e.ownerName = "Nama pemilik wajib diisi."
    if (!/^(\+62|62|0)8\d{7,12}$/.test(phone.replace(/[\s-]/g, ""))) e.phone = "Masukkan nomor HP yang valid, mis. 081234567890."
    if (description.length > 500) e.description = "Maksimal 500 karakter."
    if (address.trim().length < 10) e.address = "Alamat terlalu pendek."
    if (kind === "store" && hours.every((h) => h.is_closed)) e.hours = "Minimal 1 hari buka."
    setErrors(e)
    const first = Object.keys(e)[0]
    if (first) {
      document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setSaving(true)
    setTimeout(() => {
      toast.add({ title: `Profil ${label} ${edit ? "disimpan" : "dibuat"}.`, type: "success" })
      setDirty(false)
      router.push(`/admin/pengguna/${ownerId}?tab=${kind === "store" ? "toko" : "umkm"}`)
    }, 700)
  }

  const listHref = kind === "store" ? "/admin/toko" : "/admin/umkm"

  return (
    <AdminPage
      breadcrumb={[{ label: kind === "store" ? "Toko" : "UMKM", href: listHref }]}
      title={edit ? `Ubah profil ${label}` : `Profil ${label} baru`}
      description={edit ? (store?.name ?? umkm?.business_name) : undefined}
    >
      <AdminFormLayout
        sections={sections}
        submitLabel={edit ? "Simpan perubahan" : "Buat profil"}
        saving={saving}
        dirty={dirty}
        onSubmit={submit}
        cancelHref={edit && ownerId ? `/admin/pengguna/${ownerId}?tab=${kind === "store" ? "toko" : "umkm"}` : listHref}
      >
        <FormSectionCard id="pemilik" title="Pemilik">
          <div id="f-owner" className="flex flex-col gap-4">
            <FormField label="Akun pemilik" required error={errors.owner}>
              <EntityPicker
                options={ownerOptions}
                value={ownerId}
                locked={edit}
                invalid={!!errors.owner}
                placeholder="Cari nama atau email akun…"
                onChange={touch((v: string | null) => {
                  setOwnerId(v)
                  if (kind === "umkm" && !ownerName) setOwnerName(ADMIN_USERS.find((u) => u.id === v)?.name ?? "")
                })}
              />
            </FormField>
            {edit && owner ? (
              <Link href={`/admin/pengguna/${owner.id}`} className="text-sm text-primary hover:underline">
                Buka detail akun {owner.name} →
              </Link>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconInfoCircle className="size-4" />
                Peran {kind === "store" ? "Toko" : "UMKM"} otomatis ditambahkan ke akun ini.
              </p>
            )}
          </div>
        </FormSectionCard>

        <FormSectionCard id="info" title={kind === "store" ? "Info toko" : "Info usaha"}>
          <div className="flex flex-col gap-8">
            <div id="f-name">
              <FormField label={kind === "store" ? "Nama toko" : "Nama usaha"} htmlFor="p-name" required error={errors.name}>
                <Input id="p-name" value={name} aria-invalid={!!errors.name || undefined} onChange={(e) => touch(setName)(e.target.value)} />
              </FormField>
            </div>
            {kind === "umkm" && (
              <div id="f-ownerName">
                <FormField label="Nama pemilik" htmlFor="p-owner" required error={errors.ownerName}>
                  <Input id="p-owner" value={ownerName} onChange={(e) => touch(setOwnerName)(e.target.value)} />
                </FormField>
              </div>
            )}
            <div id="f-phone" className="sm:max-w-xs">
              <FormField label="Nomor WhatsApp" htmlFor="p-phone" required error={errors.phone}>
                <Input id="p-phone" inputMode="tel" value={phone} aria-invalid={!!errors.phone || undefined} onChange={(e) => touch(setPhone)(e.target.value)} placeholder="081234567890" />
              </FormField>
            </div>
            {kind === "umkm" && (
              <div id="f-description">
                <FormField label="Deskripsi usaha" htmlFor="p-desc" error={errors.description} aside={<CharCount value={description} max={500} />}>
                  <Textarea id="p-desc" value={description} onChange={(e) => touch(setDescription)(e.target.value)} />
                </FormField>
              </div>
            )}
            <FormField label={kind === "store" ? "Foto toko" : "Logo usaha"} description="JPG, PNG, atau WEBP. Maksimal 5 MB.">
              <FileUpload max={1} initialCount={edit ? 1 : 0} markPrimary={false} label={kind === "store" ? "Unggah foto" : "Unggah logo"} onCountChange={() => setDirty(true)} />
            </FormField>
          </div>
        </FormSectionCard>

        <FormSectionCard id="lokasi" title="Lokasi">
          <div className="flex flex-col gap-8">
            <div id="f-address">
              <FormField label="Alamat lengkap" htmlFor="p-address" required error={errors.address}>
                <Textarea id="p-address" value={address} aria-invalid={!!errors.address || undefined} onChange={(e) => touch(setAddress)(e.target.value)} />
              </FormField>
            </div>
            <FormField label="Titik lokasi" required description="Geser pin ke lokasi yang tepat.">
              <LocationPicker lat={store?.lat} lng={store?.lng} />
            </FormField>
          </div>
        </FormSectionCard>

        {kind === "store" ? (
          <FormSectionCard id="jam" title="Jam operasional">
            <div id="f-hours" className="flex flex-col gap-2">
              <OperatingHoursEditor value={hours} onChange={touch(setHours)} />
              {errors.hours && <p className="text-sm text-destructive">{errors.hours}</p>}
            </div>
          </FormSectionCard>
        ) : (
          <FormSectionCard id="legal" title="Legalitas" description="Opsional, tetapi membuka lebih banyak peluang.">
            <div className="flex flex-col gap-8">
              {edit && (
                <Alert>
                  <IconInfoCircle />
                  <AlertDescription>
                    Perubahan nomor oleh admin tidak mengubah status verifikasi. Verifikasi di halaman{" "}
                    <Link href={`/admin/verifikasi?umkm=${umkm!.id}`} className="underline underline-offset-4">
                      Verifikasi legalitas
                    </Link>
                    .
                  </AlertDescription>
                </Alert>
              )}
              {(
                [
                  ["nib", "NIB", "13 digit"],
                  ["pirt", "Nomor PIRT", "Mis. 2063573010123-25"],
                  ["halal", "Nomor sertifikat halal", "Mis. ID35110000123450824"],
                ] as [LegalKind, string, string][]
              ).map(([k, l, ph]) => (
                <FormField
                  key={k}
                  label={l}
                  htmlFor={`p-${k}`}
                  aside={umkm ? <VerificationChip status={umkm.legal_verification[k].status} /> : undefined}
                >
                  <Input id={`p-${k}`} value={legal[k]} placeholder={ph} onChange={(e) => touch(setLegal)({ ...legal, [k]: e.target.value })} />
                </FormField>
              ))}
              <FormField label="Dokumen legalitas" description="Foto atau PDF NIB, PIRT, sertifikat halal.">
                <FileUpload variant="document" accept="image/*,application/pdf" max={6} initialCount={umkm?.legal_documents.length ?? 0} label="Unggah dokumen" markPrimary={false} onCountChange={() => setDirty(true)} />
              </FormField>
            </div>
          </FormSectionCard>
        )}

        {edit && (
          <FormSectionCard id="catatan" title="Catatan admin">
            <AdminNoteFields reason={reason} onReason={setReason} notify={notify} onNotify={setNotify} notifyLabel="Beri tahu pemilik" />
          </FormSectionCard>
        )}
      </AdminFormLayout>
    </AdminPage>
  )
}
