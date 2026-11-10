"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconInfoCircle } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/format"
import { api } from "@/lib/api"
import { revalidate, useApi, type UseApiResult } from "@/lib/use-api"
import type { Me, OperatingHour, Role, StoreProfile, UmkmProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { AppShell, useAccessGuard } from "@/components/app/app-shell"
import { Logo } from "@/components/app/logo"
import { PageSkeleton, PageSkeletonBody, Section } from "@/components/app/blocks"
import { LoadError, formLevelError, handleApiError } from "@/components/app/feedback"
import { onboardingDone, useSession } from "@/components/app/providers"
import { FormField } from "@/components/app/form-field"
import {
  CharCount,
  DEFAULT_HOURS,
  FileUpload,
  LocationPicker,
  OperatingHoursEditor,
} from "@/components/app/inputs"
import { LegalChips } from "@/components/app/status"

type Mode = "onboarding" | "edit"
type Errors = Record<string, string | undefined>

interface Step {
  title: string
  description?: string
  fields: string[]
  content: React.ReactNode
  aside?: React.ReactNode
}

const PHONE_RE = /^(08|\+62)\d{7,13}$/

/** Shared frame: onboarding = 3-step stepper; edit = every section on one page. */
/** API field (`details` key) → form field name. */
const API_FIELD: Record<string, string> = {
  "legal.nib": "nib",
  "legal.pirt_number": "pirt",
  "legal.halal_number": "halal",
  operating_hours: "hours",
  lat: "address",
  lng: "address",
  photo_file_id: "name",
  logo_file_id: "business_name",
  legal_document_file_ids: "nib",
}

function ProfileFormFrame({
  mode,
  role,
  title,
  steps,
  validate,
  onSubmit,
  updatedAt,
  backHref,
}: {
  mode: Mode
  role: Role
  title: string
  steps: Step[]
  validate: () => Errors
  /** Saves the profile; throws ApiError on failure. */
  onSubmit: () => Promise<void>
  updatedAt?: string
  backHref: string
}) {
  const [step, setStep] = React.useState(0)
  const [saving, setSaving] = React.useState(false)
  const [errors, setErrors] = React.useState<Errors>({})
  const [formError, setFormError] = React.useState<string | undefined>()

  const check = (fields: string[]) => {
    const all = validate()
    const scoped = Object.fromEntries(Object.entries(all).filter(([k, v]) => v && fields.includes(k)))
    setErrors(scoped)
    return Object.keys(scoped).length === 0
  }

  const save = async () => {
    const all = validate()
    const firstBad = steps.findIndex((s) => s.fields.some((f) => all[f]))
    if (firstBad >= 0) {
      setErrors(all)
      if (mode === "onboarding") setStep(firstBad)
      return
    }
    setSaving(true)
    setFormError(undefined)
    try {
      await onSubmit()
    } catch (e) {
      setSaving(false)
      handleApiError(e, {
        onFieldErrors: (fields, err) => {
          const known = steps.flatMap((x) => x.fields)
          const mapped: Errors = {}
          for (const [k, v] of Object.entries(fields)) {
            const f = API_FIELD[k] ?? k.split(".")[0]
            if (known.includes(f)) mapped[f] ??= v
          }
          setErrors(mapped)
          setFormError(formLevelError(err, Object.keys(fields).filter((k) => known.includes(API_FIELD[k] ?? k.split(".")[0]))))
          // Error 400 → back to the step holding the first bad field.
          const bad = steps.findIndex((x) => x.fields.some((f) => mapped[f]))
          if (mode === "onboarding" && bad >= 0) setStep(bad)
          return true
        },
      })
    }
  }

  const ctx = React.useMemo(() => errors, [errors])

  if (mode === "edit") {
    return (
      <ErrorsContext.Provider value={ctx}>
        <AppShell
          role={role}
          title={title}
          back={backHref}
          hideNav
          bottomBar={
            <div className="flex items-center justify-between gap-4">
              <p className="hidden text-xs text-muted-foreground sm:block">
                {updatedAt && `Terakhir diperbarui ${formatDateTime(updatedAt)}`}
              </p>
              <Button className="w-full sm:w-auto" disabled={saving} onClick={() => void save()}>
                {saving ? (
                  <>
                    <Spinner data-icon="inline-start" /> Menyimpan…
                  </>
                ) : (
                  "Simpan perubahan"
                )}
              </Button>
            </div>
          }
        >
          {formError && <p className="bg-destructive/10 px-5 py-4 text-sm text-destructive">{formError}</p>}
          {steps.map((s) => (
            <Section key={s.title} title={s.title} description={s.description}>
              <div className="flex flex-col gap-8">
                {s.aside}
                {s.content}
              </div>
            </Section>
          ))}
          {updatedAt && (
            <p className="text-xs text-muted-foreground sm:hidden">Terakhir diperbarui {formatDateTime(updatedAt)}</p>
          )}
        </AppShell>
      </ErrorsContext.Provider>
    )
  }

  const current = steps[step]
  const last = step === steps.length - 1

  return (
    <ErrorsContext.Provider value={ctx}>
      <div className="flex min-h-svh flex-1 flex-col bg-muted">
        <header className="border-b bg-background">
          <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
            <Logo href={null} />
            <span className="text-xs text-muted-foreground">{title}</span>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8 pb-32">
          <div className="flex flex-col gap-4">
            <p className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
              {step + 1} dari {steps.length}
            </p>
            <ol className="grid grid-cols-3 gap-2" aria-label="Langkah">
              {steps.map((s, i) => (
                <li key={s.title} className="flex flex-col gap-2">
                  <span className={cn("h-0.5", i <= step ? "bg-primary" : "bg-border")} />
                  <span
                    className={cn(
                      "text-[0.625rem] font-semibold tracking-widest uppercase",
                      i === step ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s.title}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <Section title={current.title} description={current.description}>
            <div className="flex flex-col gap-8">
              {current.aside}
              {current.content}
            </div>
          </Section>
          {formError && last && <p className="bg-destructive/10 px-5 py-4 text-sm text-destructive">{formError}</p>}
        </main>
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background">
          <div className="mx-auto flex max-w-2xl gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} disabled={saving}>
                Kembali
              </Button>
            )}
            <Button
              className="flex-1"
              disabled={saving}
              onClick={() => (last ? void save() : check(current.fields) && setStep(step + 1))}
            >
              {saving ? (
                <>
                  <Spinner data-icon="inline-start" /> Menyimpan…
                </>
              ) : last ? (
                "Simpan & mulai"
              ) : (
                "Lanjut"
              )}
            </Button>
          </div>
        </div>
      </div>
    </ErrorsContext.Provider>
  )
}

const ErrorsContext = React.createContext<Errors>({})
const useError = (field: string) => React.useContext(ErrorsContext)[field]

function TextField({
  name,
  label,
  value,
  onChange,
  required,
  placeholder,
  description,
  type = "text",
  inputMode,
}: {
  name: string
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
  description?: string
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
}) {
  const error = useError(name)
  return (
    <FormField label={label} htmlFor={name} required={required} description={description} error={error}>
      <Input
        id={name}
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  )
}

function AddressField({ name, label, value, onChange, placeholder }: {
  name: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const error = useError(name)
  return (
    <FormField label={label} htmlFor={name} required error={error}>
      <Textarea
        id={name}
        value={value}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  )
}

// ---------------------------------------------------------------------------
// P04 · Store profile
// ---------------------------------------------------------------------------

/**
 * Loads `GET /me/<kind>-profile` (404 = no profile yet → empty form) behind
 * the login guard, then renders the form.
 */
function useProfileLoader<T>(role: Role, path: string, mode: Mode) {
  const ready = useAccessGuard(role, mode === "onboarding" ? "onboarding" : "full")
  const q: UseApiResult<T> = useApi<T>("user", ready ? path : null)
  const missing = q.error?.code === "not_found"
  return { ready: ready && (!!q.data || missing), q, profile: q.data, failed: q.error && !missing ? q.error : undefined }
}

function LoaderFallback({ mode, role, title, failed, retry }: { mode: Mode; role: Role; title: string; failed?: Parameters<typeof LoadError>[0]["error"]; retry: () => void }) {
  if (mode === "onboarding" && !failed) return <PageSkeleton />
  return (
    <AppShell role={role} title={title} back="/profil" hideNav access={mode === "onboarding" ? "onboarding" : "full"}>
      {failed ? <LoadError error={failed} onRetry={retry} /> : <PageSkeletonBody />}
    </AppShell>
  )
}

/** Where to go after saving a profile (spec P04/P05). */
function afterSave(me: Me | undefined, role: Role, mode: Mode) {
  if (mode === "edit") return "/profil"
  if (role === "store" && me?.roles.includes("umkm") && !onboardingDone(me, "umkm")) return "/onboarding/umkm"
  return role === "store" ? "/toko" : "/umkm"
}

export function StoreProfileForm({ mode }: { mode: Mode }) {
  const { ready, q, profile, failed } = useProfileLoader<StoreProfile>("store", "/me/store-profile", mode)
  if (!ready)
    return <LoaderFallback mode={mode} role="store" title={mode === "edit" ? "Ubah profil toko" : "Profil toko"} failed={failed} retry={() => void q.reload()} />
  return <StoreProfileFormInner mode={mode} profile={profile} />
}

function StoreProfileFormInner({ mode, profile }: { mode: Mode; profile?: StoreProfile }) {
  const router = useRouter()
  const { reloadMe, setRole } = useSession()
  const edit = mode === "edit"
  const p = profile
  const [name, setName] = React.useState(p?.name ?? "")
  const [phone, setPhone] = React.useState(p?.phone ?? "")
  const [address, setAddress] = React.useState(p?.address ?? "")
  const [hours, setHours] = React.useState<OperatingHour[]>(p?.operating_hours ?? DEFAULT_HOURS)
  const [photoIds, setPhotoIds] = React.useState<string[]>(p?.photo_file_id ? [p.photo_file_id] : [])
  const [loc, setLoc] = React.useState({ lat: p?.lat ?? -7.9467, lng: p?.lng ?? 112.6159 })

  const validate = (): Errors => ({
    name: name.trim().length < 3 || name.length > 100 ? "Nama toko 3–100 karakter." : undefined,
    phone: !PHONE_RE.test(phone.replace(/[\s-]/g, "")) ? "Masukkan nomor yang diawali 08 atau +62." : undefined,
    address: !address.trim() ? "Alamat wajib diisi." : undefined,
    hours: hours.every((h) => h.is_closed)
      ? "Minimal 1 hari buka."
      : hours.some((h) => !h.is_closed && h.close <= h.open)
        ? "Jam tutup harus setelah jam buka."
        : undefined,
  })

  return (
    <ProfileFormFrame
      mode={mode}
      role="store"
      title={edit ? "Ubah profil toko" : "Profil toko"}
      backHref="/profil"
      updatedAt={edit ? p?.updated_at : undefined}
      validate={validate}
      onSubmit={async () => {
        await api.put("/me/store-profile", {
          name: name.trim(),
          phone: phone.replace(/[\s-]/g, ""),
          photo_file_id: photoIds[0] ?? null,
          address: address.trim(),
          lat: loc.lat,
          lng: loc.lng,
          operating_hours: hours,
        })
        await reloadMe()
        void revalidate("user", "/me")
        toast.add({ title: "Profil toko tersimpan.", type: "success" })
        if (!edit) setRole("store")
        const me = await api.get<Me>("/me").catch(() => undefined)
        router.push(afterSave(me, "store", mode))
      }}
      steps={[
        {
          title: "Info toko",
          fields: ["name", "phone"],
          content: (
            <>
              <TextField name="name" label="Nama toko" required value={name} onChange={setName} placeholder="Toko Sumber Rejeki" />
              <TextField
                name="phone"
                label="Nomor WhatsApp"
                type="tel"
                inputMode="tel"
                required
                value={phone}
                onChange={setPhone}
                placeholder="0812 3456 7890"
              />
              <FormField label="Foto depan toko" description="Membantu UMKM mengenali toko saat antar barang.">
                <FileUpload
                  purpose="store_photo"
                  max={1}
                  initial={p?.photo ? [p.photo] : []}
                  onChange={setPhotoIds}
                  markPrimary={false}
                />
              </FormField>
            </>
          ),
        },
        {
          title: "Lokasi",
          fields: ["address"],
          content: (
            <>
              <AddressField
                name="address"
                label="Alamat lengkap"
                value={address}
                onChange={setAddress}
                placeholder="Jl. Soekarno Hatta No. 12, Lowokwaru"
              />
              <FormField
                label="Titik lokasi"
                required
                description="Cari alamat toko, lalu geser pin tepat ke depan toko. Lokasi ini dipakai UMKM untuk menghitung jarak dan menemukan toko Anda."
              >
                <LocationPicker lat={p?.lat} lng={p?.lng} onChange={setLoc} onAddress={setAddress} />
              </FormField>
            </>
          ),
        },
        {
          title: "Jam operasional",
          description: "Jadwal terima barang di peluang akan dibatasi sesuai jam ini.",
          fields: ["hours"],
          content: (
            <HoursField value={hours} onChange={setHours} />
          ),
        },
      ]}
    />
  )
}

function HoursField({ value, onChange }: { value: OperatingHour[]; onChange: (v: OperatingHour[]) => void }) {
  const error = useError("hours")
  return (
    <div className="flex flex-col gap-2">
      <OperatingHoursEditor value={value} onChange={onChange} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// P05 · UMKM profile
// ---------------------------------------------------------------------------

export function UmkmProfileForm({ mode }: { mode: Mode }) {
  const { ready, q, profile, failed } = useProfileLoader<UmkmProfile>("umkm", "/me/umkm-profile", mode)
  if (!ready)
    return <LoaderFallback mode={mode} role="umkm" title={mode === "edit" ? "Ubah profil UMKM" : "Profil UMKM"} failed={failed} retry={() => void q.reload()} />
  return <UmkmProfileFormInner mode={mode} profile={profile} />
}

function UmkmProfileFormInner({ mode, profile }: { mode: Mode; profile?: UmkmProfile }) {
  const router = useRouter()
  const { me, reloadMe, setRole } = useSession()
  const edit = mode === "edit"
  const p = profile
  const [businessName, setBusinessName] = React.useState(p?.business_name ?? "")
  // owner_name is prefilled from the Google account name.
  const [ownerName, setOwnerName] = React.useState(p?.owner_name ?? me?.name ?? "")
  const [phone, setPhone] = React.useState(p?.phone ?? "")
  const [description, setDescription] = React.useState(p?.description ?? "")
  const [address, setAddress] = React.useState(p?.address ?? "")
  const [nib, setNib] = React.useState(p?.legal.nib ?? "")
  const [pirt, setPirt] = React.useState(p?.legal.pirt_number ?? "")
  const [halal, setHalal] = React.useState(p?.legal.halal_number ?? "")
  const [logoIds, setLogoIds] = React.useState<string[]>(p?.logo_file_id ? [p.logo_file_id] : [])
  const [docIds, setDocIds] = React.useState<string[]>(p?.legal_document_file_ids ?? [])
  const [loc, setLoc] = React.useState({ lat: p?.lat ?? -7.9612, lng: p?.lng ?? 112.6475 })

  const validate = (): Errors => ({
    business_name:
      businessName.trim().length < 3 || businessName.length > 100 ? "Nama usaha 3–100 karakter." : undefined,
    owner_name: !ownerName.trim() ? "Nama pemilik wajib diisi." : undefined,
    phone: !PHONE_RE.test(phone.replace(/[\s-]/g, "")) ? "Masukkan nomor yang diawali 08 atau +62." : undefined,
    description: description.length > 300 ? "Maksimal 300 karakter." : undefined,
    address: !address.trim() ? "Alamat produksi wajib diisi." : undefined,
    nib: nib && !/^\d{13}$/.test(nib) ? "NIB terdiri dari 13 angka." : undefined,
  })

  return (
    <ProfileFormFrame
      mode={mode}
      role="umkm"
      title={edit ? "Ubah profil UMKM" : "Profil UMKM"}
      backHref="/profil"
      updatedAt={edit ? p?.updated_at : undefined}
      validate={validate}
      onSubmit={async () => {
        await api.put("/me/umkm-profile", {
          business_name: businessName.trim(),
          owner_name: ownerName.trim(),
          phone: phone.replace(/[\s-]/g, ""),
          description,
          logo_file_id: logoIds[0] ?? null,
          address: address.trim(),
          lat: loc.lat,
          lng: loc.lng,
          legal: { nib: nib || null, pirt_number: pirt.trim() || null, halal_number: halal.trim() || null },
          legal_document_file_ids: docIds,
        })
        await reloadMe()
        void revalidate("user", "/me", "/opportunities")
        toast.add({ title: "Profil usaha tersimpan.", type: "success" })
        if (!edit) setRole("umkm")
        router.push(afterSave(undefined, "umkm", mode))
      }}
      steps={[
        {
          title: "Info usaha",
          fields: ["business_name", "owner_name", "phone", "description"],
          content: (
            <>
              <TextField name="business_name" label="Nama usaha" required value={businessName} onChange={setBusinessName} placeholder="Dapur Mbok Darmi" />
              <TextField name="owner_name" label="Nama pemilik" required value={ownerName} onChange={setOwnerName} />
              <TextField
                name="phone"
                label="Nomor WhatsApp"
                type="tel"
                inputMode="tel"
                required
                value={phone}
                onChange={setPhone}
                placeholder="0812 3456 7890"
              />
              <DescriptionField value={description} onChange={setDescription} />
              <FormField label="Logo atau foto usaha">
                <FileUpload
                  purpose="umkm_logo"
                  max={1}
                  initial={p?.logo ? [p.logo] : []}
                  onChange={setLogoIds}
                  markPrimary={false}
                />
              </FormField>
            </>
          ),
        },
        {
          title: "Lokasi produksi",
          fields: ["address"],
          content: (
            <>
              <AddressField
                name="address"
                label="Alamat produksi"
                value={address}
                onChange={setAddress}
                placeholder="Jl. Sanan Gg. 3 No. 17, Purwantoro"
              />
              <FormField label="Titik lokasi" required description="Cari alamat produksi, lalu geser pin ke posisi yang tepat. Dipakai untuk mencari toko terdekat dari tempat Anda.">
                <LocationPicker lat={p?.lat} lng={p?.lng} onChange={setLoc} onAddress={setAddress} />
              </FormField>
            </>
          ),
        },
        {
          title: "Legalitas",
          fields: ["nib"],
          aside: (
            <>
              {edit && p && (
                <div className="flex flex-col gap-2">
                  <p className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
                    Ringkasan legalitas
                  </p>
                  <LegalChips legal={p.legal} />
                </div>
              )}
              <Alert>
                <IconInfoCircle />
                <AlertDescription>
                  Legalitas tidak wajib untuk mendaftar, tetapi banyak toko mensyaratkan NIB atau PIRT. Kelengkapan
                  legalitas menaikkan badge kecocokan Anda.
                </AlertDescription>
              </Alert>
            </>
          ),
          content: (
            <>
              <TextField
                name="nib"
                label="NIB (Nomor Induk Berusaha)"
                inputMode="numeric"
                value={nib}
                onChange={(v) => setNib(v.replace(/\D/g, "").slice(0, 13))}
                placeholder="13 digit angka"
              />
              <TextField name="pirt" label="Nomor PIRT" value={pirt} onChange={setPirt} />
              <TextField name="halal" label="Nomor sertifikat halal" value={halal} onChange={setHalal} />
              <FormField label="Foto/scan dokumen" description="JPG, PNG, atau PDF, maks 5 MB per file.">
                <FileUpload
                  purpose="legal_document"
                  variant="document"
                  max={5}
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  label="Tambah dokumen"
                  initial={p?.legal_documents ?? []}
                  onChange={setDocIds}
                />
              </FormField>
            </>
          ),
        },
      ]}
    />
  )
}

function DescriptionField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const error = useError("description")
  return (
    <FormField
      label="Cerita singkat usaha"
      htmlFor="description"
      error={error}
      aside={<CharCount value={value} max={300} />}
    >
      <Textarea
        id="description"
        value={value}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Sejak kapan berdiri, apa yang membuat produk Anda istimewa."
      />
    </FormField>
  )
}
