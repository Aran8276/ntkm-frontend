"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconInfoCircle } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/format"
import { ME, MY_STORE, MY_UMKM } from "@/lib/mock-data"
import type { OperatingHour } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { AppShell } from "@/components/app/app-shell"
import { Logo } from "@/components/app/logo"
import { Section } from "@/components/app/blocks"
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
function ProfileFormFrame({
  mode,
  title,
  steps,
  validate,
  onSaved,
  updatedAt,
  backHref,
}: {
  mode: Mode
  title: string
  steps: Step[]
  validate: () => Errors
  onSaved: () => void
  updatedAt?: string
  backHref: string
}) {
  const [step, setStep] = React.useState(0)
  const [saving, setSaving] = React.useState(false)
  const [errors, setErrors] = React.useState<Errors>({})

  const check = (fields: string[]) => {
    const all = validate()
    const scoped = Object.fromEntries(Object.entries(all).filter(([k, v]) => v && fields.includes(k)))
    setErrors(scoped)
    return Object.keys(scoped).length === 0
  }

  const save = () => {
    const all = validate()
    const firstBad = steps.findIndex((s) => s.fields.some((f) => all[f]))
    if (firstBad >= 0) {
      setErrors(all)
      if (mode === "onboarding") setStep(firstBad)
      return
    }
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onSaved()
    }, 700)
  }

  const ctx = React.useMemo(() => errors, [errors])

  if (mode === "edit") {
    return (
      <ErrorsContext.Provider value={ctx}>
        <AppShell
          title={title}
          back={backHref}
          hideNav
          bottomBar={
            <div className="flex items-center justify-between gap-4">
              <p className="hidden text-xs text-muted-foreground sm:block">
                {updatedAt && `Terakhir diperbarui ${formatDateTime(updatedAt)}`}
              </p>
              <Button className="w-full sm:w-auto" disabled={saving} onClick={save}>
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
              onClick={() => (last ? save() : check(current.fields) && setStep(step + 1))}
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

export function StoreProfileForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const edit = mode === "edit"
  const [name, setName] = React.useState(edit ? MY_STORE.name : "")
  const [phone, setPhone] = React.useState(edit ? MY_STORE.phone : "")
  const [address, setAddress] = React.useState(edit ? MY_STORE.address : "")
  const [hours, setHours] = React.useState<OperatingHour[]>(edit ? MY_STORE.operating_hours : DEFAULT_HOURS)

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
      title={edit ? "Ubah profil toko" : "Profil toko"}
      backHref="/profil"
      updatedAt={edit ? MY_STORE.updated_at : undefined}
      validate={validate}
      onSaved={() => {
        toast.add({ title: "Profil toko tersimpan.", type: "success" })
        router.push(edit ? "/profil" : "/toko")
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
                <FileUpload max={1} initialCount={edit ? 1 : 0} markPrimary={false} />
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
                description="Geser pin tepat ke depan toko. Lokasi ini dipakai UMKM untuk menghitung jarak."
              >
                <LocationPicker lat={MY_STORE.lat} lng={MY_STORE.lng} />
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
  const router = useRouter()
  const edit = mode === "edit"
  const [businessName, setBusinessName] = React.useState(edit ? MY_UMKM.business_name : "")
  const [ownerName, setOwnerName] = React.useState(edit ? MY_UMKM.owner_name : ME.name)
  const [phone, setPhone] = React.useState(edit ? MY_UMKM.phone : "")
  const [description, setDescription] = React.useState(edit ? MY_UMKM.description : "")
  const [address, setAddress] = React.useState(edit ? MY_UMKM.address : "")
  const [nib, setNib] = React.useState(edit ? (MY_UMKM.legal.nib ?? "") : "")
  const [pirt, setPirt] = React.useState(edit ? (MY_UMKM.legal.pirt_number ?? "") : "")
  const [halal, setHalal] = React.useState(edit ? (MY_UMKM.legal.halal_number ?? "") : "")

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
      title={edit ? "Ubah profil UMKM" : "Profil UMKM"}
      backHref="/profil"
      updatedAt={edit ? MY_UMKM.updated_at : undefined}
      validate={validate}
      onSaved={() => {
        toast.add({ title: "Profil usaha tersimpan.", type: "success" })
        router.push(edit ? "/profil" : "/umkm")
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
                <FileUpload max={1} initialCount={edit ? 1 : 0} markPrimary={false} />
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
              <FormField label="Titik lokasi" required description="Dipakai untuk mencari toko terdekat dari tempat Anda.">
                <LocationPicker lat={-7.9612} lng={112.6475} />
              </FormField>
            </>
          ),
        },
        {
          title: "Legalitas",
          fields: ["nib"],
          aside: (
            <>
              {edit && (
                <div className="flex flex-col gap-2">
                  <p className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
                    Ringkasan legalitas
                  </p>
                  <LegalChips legal={MY_UMKM.legal} />
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
                  variant="document"
                  max={5}
                  accept="image/jpeg,image/png,application/pdf"
                  label="Tambah dokumen"
                  initialCount={edit ? 2 : 0}
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
