"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { IconInfoCircle } from "@tabler/icons-react"

import { adminApi, isApiError } from "@/lib/api"
import { revalidate, useApi } from "@/lib/use-api"
import type { AdminStore, AdminUmkm, LegalKind } from "@/lib/admin-types"
import { LoadError, formLevelError, handleApiError } from "@/components/app/feedback"
import { useUsers } from "@/components/admin/options"
import { TableSkeleton } from "@/components/admin/data-table"
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

const PATH = { store: "/admin/stores", umkm: "/admin/umkms" } as const

/** A08 loader: create (`?user_id=` prefills the owner) or edit (`GET /admin/<kind>s/{id}`). */
export function ProfileAdminFormPage({ kind, id }: { kind: "store" | "umkm"; id?: string }) {
  const q = useApi<AdminStore | AdminUmkm>("admin", id ? `${PATH[kind]}/${id}` : null)
  if (!id) return kind === "store" ? <ProfileAdminForm kind="store" /> : <ProfileAdminForm kind="umkm" />
  if (!q.data)
    return (
      <AdminPage breadcrumb={[{ label: kind === "store" ? "Toko" : "UMKM", href: kind === "store" ? "/admin/toko" : "/admin/umkm" }]} title="Ubah profil">
        {q.error ? <LoadError error={q.error} onRetry={q.reload} backHref={kind === "store" ? "/admin/toko" : "/admin/umkm"} backLabel="Kembali ke daftar" /> : <TableSkeleton />}
      </AdminPage>
    )
  return kind === "store" ? (
    <ProfileAdminForm key={q.data.id} kind="store" profile={q.data as AdminStore} />
  ) : (
    <ProfileAdminForm key={q.data.id} kind="umkm" profile={q.data as AdminUmkm} />
  )
}

/** `/admin/toko/:id` and `/admin/umkm/:id` → owner's A04 tab. */
export function ProfileShortcut({ kind, id }: { kind: "store" | "umkm"; id: string }) {
  const router = useRouter()
  const q = useApi<AdminStore | AdminUmkm>("admin", `${PATH[kind]}/${id}`)
  const ownerId = q.data?.owner.id
  React.useEffect(() => {
    if (ownerId) router.replace(`/admin/pengguna/${ownerId}?tab=${kind === "store" ? "toko" : "umkm"}`)
  }, [ownerId, kind, router])
  return (
    <AdminPage title={kind === "store" ? "Profil toko" : "Profil UMKM"}>
      {q.error ? <LoadError error={q.error} onRetry={q.reload} backHref={kind === "store" ? "/admin/toko" : "/admin/umkm"} backLabel="Kembali ke daftar" /> : <TableSkeleton />}
    </AdminPage>
  )
}

/** A08 · Form profil toko / UMKM (create & edit). */
function ProfileAdminForm(props: Props) {
  const { kind } = props
  const router = useRouter()
  const params = useSearchParams()
  const edit = !!props.profile
  const store = kind === "store" ? props.profile : undefined
  const umkm = kind === "umkm" ? props.profile : undefined
  const label = kind === "store" ? "toko" : "UMKM"

  const [ownerId, setOwnerId] = React.useState<string | null>(props.profile?.owner.id ?? params.get("user_id"))
  const users = useUsers(undefined, !edit)
  const owner = props.profile?.owner ?? users.find((u) => u.id === ownerId)
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
  const [fileIds, setFileIds] = React.useState<string[]>(
    store?.photo_file_id ? [store.photo_file_id] : umkm?.logo_file_id ? [umkm.logo_file_id] : []
  )
  const [docIds, setDocIds] = React.useState<string[]>(umkm?.legal_document_file_ids ?? [])
  const [loc, setLoc] = React.useState({ lat: props.profile?.lat ?? -7.9467, lng: props.profile?.lng ?? 112.6159 })
  const [formError, setFormError] = React.useState<string | undefined>()
  const [reason, setReason] = React.useState("")
  const [notify, setNotify] = React.useState(true)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const [dirty, setDirty] = React.useState(false)
  const touch = <T,>(set: (v: T) => void) => (v: T) => {
    setDirty(true)
    set(v)
  }

  const ownerOptions = edit
    ? [{ value: props.profile!.owner.id, label: props.profile!.owner.name, description: props.profile!.owner.email }]
    : users
        .filter((u) => !u.deleted_at)
        .map((u) => ({
          value: u.id,
          label: u.name || u.email,
          description: u.email,
          disabledReason: (kind === "store" ? u.store_profile : u.umkm_profile) ? `Sudah punya profil ${label}` : undefined,
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
    void save()
  }

  const save = async () => {
    setSaving(true)
    setFormError(undefined)
    const common = {
      phone: phone.replace(/[\s-]/g, ""),
      address: address.trim(),
      lat: loc.lat,
      lng: loc.lng,
    }
    const body =
      kind === "store"
        ? { ...common, name: name.trim(), photo_file_id: fileIds[0] ?? null, operating_hours: hours }
        : {
            ...common,
            business_name: name.trim(),
            owner_name: ownerName.trim(),
            description,
            logo_file_id: fileIds[0] ?? null,
            legal: { nib: legal.nib || null, pirt_number: legal.pirt.trim() || null, halal_number: legal.halal.trim() || null },
            legal_document_file_ids: docIds,
          }
    try {
      if (edit) await adminApi.patch(`${PATH[kind]}/${props.profile!.id}`, { ...body, admin_reason: reason || undefined, notify_user: notify })
      else await adminApi.post(PATH[kind], { ...body, user_id: ownerId })
      toast.add({ title: `Profil ${label} ${edit ? "disimpan" : "dibuat"}.`, type: "success" })
      setDirty(false)
      void revalidate("admin", "/admin/users", "/admin/stores", "/admin/umkms", "/admin/audit-logs")
      router.push(`/admin/pengguna/${ownerId}?tab=${kind === "store" ? "toko" : "umkm"}`)
    } catch (err) {
      setSaving(false)
      if (isApiError(err) && err.code === "conflict") {
        setErrors({ owner: err.message })
        document.getElementById("f-owner")?.scrollIntoView({ behavior: "smooth", block: "center" })
        return
      }
      const FIELD: Record<string, string> = {
        user_id: "owner",
        name: "name",
        business_name: "name",
        owner_name: "ownerName",
        phone: "phone",
        description: "description",
        address: "address",
        lat: "address",
        lng: "address",
        operating_hours: "hours",
      }
      handleApiError(err, {
        admin: true,
        onFieldErrors: (fields, apiErr) => {
          const mapped: Record<string, string> = {}
          for (const [k, v] of Object.entries(fields)) if (FIELD[k.split(".")[0]]) mapped[FIELD[k.split(".")[0]]] ??= v
          setErrors(mapped)
          setFormError(formLevelError(apiErr, Object.keys(FIELD)) ?? (Object.keys(mapped).length ? undefined : apiErr.message))
          const first = Object.keys(mapped)[0]
          if (first) document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
          return true
        },
      })
    }
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
        {formError && <p className="bg-destructive/10 px-5 py-4 text-sm text-destructive">{formError}</p>}
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
                  if (kind === "umkm" && !ownerName) setOwnerName(users.find((u) => u.id === v)?.name ?? "")
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
              <FileUpload
                purpose={kind === "store" ? "store_photo" : "umkm_logo"}
                client={adminApi}
                max={1}
                initial={store?.photo ? [store.photo] : umkm?.logo ? [umkm.logo] : []}
                onChange={setFileIds}
                markPrimary={false}
                label={kind === "store" ? "Unggah foto" : "Unggah logo"}
              />
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
              <LocationPicker lat={props.profile?.lat} lng={props.profile?.lng} onChange={setLoc} onAddress={touch(setAddress)} />
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
                <FileUpload
                  purpose="legal_document"
                  client={adminApi}
                  variant="document"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  max={5}
                  initial={umkm?.legal_documents ?? []}
                  onChange={setDocIds}
                  label="Unggah dokumen"
                  markPrimary={false}
                />
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
