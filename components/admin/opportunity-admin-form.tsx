"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { IconInfoCircle } from "@tabler/icons-react"

import { addDaysIso, todayIso } from "@/lib/format"
import { adminApi, isApiError } from "@/lib/api"
import { revalidate, useApi } from "@/lib/use-api"
import type { AdminOpportunity, AdminStore } from "@/lib/admin-types"
import { LoadError, formLevelError, handleApiError } from "@/components/app/feedback"
import { TableSkeleton } from "@/components/admin/data-table"
import type { Commission, ReceivingSlot } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { FormField } from "@/components/app/form-field"
import {
  CharCount,
  ChoiceChips,
  CommissionCalculator,
  NumberStepper,
  ReceivingScheduleEditor,
  RupiahInput,
  SuffixInput,
} from "@/components/app/inputs"
import { AdminPage } from "@/components/admin/admin-page"
import { AdminFormLayout, AdminNoteFields, FormSectionCard } from "@/components/admin/form-layout"
import { OperatingHoursTable } from "@/components/admin/embedded"
import { EntityPicker } from "@/components/admin/pickers"
import { useCategories, useStoreOptions } from "@/components/admin/options"

/** API field → form error key. */
const FIELD: Record<string, string> = {
  store_id: "store",
  title: "title",
  description: "description",
  category_ids: "categories",
  "requirements.notes": "notes",
  commission: "commission",
  "commission.value": "commission",
  receiving_schedule: "schedule",
  valid_until: "validUntil",
}

/** A11 loader: create or edit (`GET /admin/opportunities/{id}`). */
export function OpportunityAdminFormPage({ id }: { id?: string }) {
  const q = useApi<AdminOpportunity>("admin", id ? `/admin/opportunities/${id}` : null)
  if (!id) return <OpportunityAdminForm />
  if (!q.data)
    return (
      <AdminPage breadcrumb={[{ label: "Peluang", href: "/admin/peluang" }]} title="Ubah peluang">
        {q.error ? <LoadError error={q.error} onRetry={q.reload} backHref="/admin/peluang" backLabel="Kembali ke Peluang" /> : <TableSkeleton />}
      </AdminPage>
    )
  return <OpportunityAdminForm key={q.data.id} opportunity={q.data} />
}

/** A11 · Form peluang (admin). */
function OpportunityAdminForm({ opportunity: o }: { opportunity?: AdminOpportunity }) {
  const router = useRouter()
  const params = useSearchParams()
  const edit = !!o
  const hasApplications = !!o?.has_applications
  const [TODAY] = React.useState(() => todayIso())
  const storeOptions = useStoreOptions()
  // Only active categories can be picked (inactive ones already on the opportunity stay listed).
  const ACTIVE_CATEGORIES = useCategories().filter((c) => c.is_active || o?.categories.some((x) => x.id === c.id))

  const [storeId, setStoreId] = React.useState<string | null>(o?.store.id ?? params.get("store_id"))
  // Operating hours of the chosen store (receiving slots must sit inside them).
  const storeQ = useApi<AdminStore>("admin", storeId ? `/admin/stores/${storeId}` : null)
  const store = storeQ.data
  const [title, setTitle] = React.useState(o?.title ?? "")
  const [description, setDescription] = React.useState(o?.description ?? "")
  const [categories, setCategories] = React.useState<string[]>(o?.categories.map((c) => c.id) ?? [])
  const [minShelf, setMinShelf] = React.useState(o?.requirements.min_shelf_life_days?.toString() ?? "")
  const [maxPrice, setMaxPrice] = React.useState<number | null>(o?.requirements.max_retail_price ?? null)
  const [req, setReq] = React.useState({
    nib: o?.requirements.requires_nib ?? false,
    pirt: o?.requirements.requires_pirt ?? false,
    halal: o?.requirements.requires_halal ?? false,
  })
  const [notes, setNotes] = React.useState(o?.requirements.notes ?? "")
  const [quota, setQuota] = React.useState(o?.quota ?? 3)
  const [maxProducts, setMaxProducts] = React.useState(o?.max_products_per_umkm ?? 3)
  const [commission, setCommission] = React.useState<Commission>(o?.commission ?? { type: "percent", value: 15 })
  const [samplePrice, setSamplePrice] = React.useState(10000)
  const [schedule, setSchedule] = React.useState<ReceivingSlot[]>(o?.receiving_schedule ?? [{ day: "mon", start: "08:00", end: "10:00" }])
  const [validUntil, setValidUntil] = React.useState(() => o?.valid_until ?? addDaysIso(30))
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

  const sections = [
    { id: "toko", title: "0 · Toko" },
    { id: "info", title: "1 · Info dasar" },
    { id: "produk", title: "2 · Produk dicari" },
    { id: "legal", title: "3 · Syarat legalitas" },
    { id: "kuota", title: "4 · Kuota" },
    { id: "komisi", title: "5 · Komisi" },
    { id: "jadwal", title: "6 · Jadwal terima" },
    { id: "berlaku", title: "7 · Masa berlaku" },
    { id: "catatan", title: "8 · Catatan admin" },
  ]

  const submit = () => {
    const e: Record<string, string> = {}
    if (!storeId) e.store = "Pilih toko."
    if (title.trim().length < 5 || title.length > 120) e.title = "Judul 5–120 karakter."
    if (description.length > 500) e.description = "Maksimal 500 karakter."
    if (!categories.length) e.categories = "Pilih minimal 1 kategori."
    if (notes.length > 300) e.notes = "Maksimal 300 karakter."
    if (commission.type === "percent" && (commission.value < 1 || commission.value > 50)) e.commission = "Persentase 1–50%."
    if (commission.type === "fixed" && commission.value <= 0) e.commission = "Nominal harus lebih dari 0."
    if (!schedule.length) e.schedule = "Tambahkan minimal 1 slot."
    if (validUntil < TODAY) e.validUntil = "Tanggal tidak boleh sebelum hari ini."
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
    const body: Record<string, unknown> = {
      store_id: storeId,
      title: title.trim(),
      description,
      category_ids: categories,
      requirements: {
        min_shelf_life_days: minShelf ? Number(minShelf) : null,
        max_retail_price: maxPrice || null,
        requires_nib: req.nib,
        requires_pirt: req.pirt,
        requires_halal: req.halal,
        notes,
      },
      quota,
      max_products_per_umkm: maxProducts,
      commission,
      receiving_schedule: schedule,
      valid_until: validUntil,
    }
    try {
      let saved: AdminOpportunity
      if (edit && o) {
        // Edit mode sends only the fields that changed.
        const before: Record<string, unknown> = {
          store_id: o.store.id,
          title: o.title,
          description: o.description,
          category_ids: o.categories.map((c) => c.id),
          requirements: o.requirements,
          quota: o.quota,
          max_products_per_umkm: o.max_products_per_umkm,
          commission: o.commission,
          receiving_schedule: o.receiving_schedule,
          valid_until: o.valid_until,
        }
        const diff = Object.fromEntries(Object.entries(body).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(before[k])))
        saved = await adminApi.patch<AdminOpportunity>(`/admin/opportunities/${o.id}`, {
          ...diff,
          admin_reason: reason || undefined,
          notify_user: notify,
        })
      } else saved = await adminApi.post<AdminOpportunity>("/admin/opportunities", { ...body, admin_reason: reason || undefined })
      toast.add({ title: edit ? "Perubahan disimpan." : "Peluang dibuat.", type: "success" })
      setDirty(false)
      void revalidate("admin", "/admin/opportunities", "/admin/audit-logs", "/admin/dashboard")
      router.push(`/admin/peluang/${saved.id}`)
    } catch (err) {
      setSaving(false)
      if (isApiError(err) && err.code === "conflict") {
        setErrors({ store: err.message })
        document.getElementById("f-store")?.scrollIntoView({ behavior: "smooth", block: "center" })
        return
      }
      handleApiError(err, {
        admin: true,
        onFieldErrors: (fields, apiErr) => {
          const mapped: Record<string, string> = {}
          for (const [k, v] of Object.entries(fields)) {
            const key = FIELD[k] ?? FIELD[k.split(".")[0]] ?? (k.startsWith("receiving_schedule") ? "schedule" : undefined)
            if (key) mapped[key] ??= v
          }
          setErrors(mapped)
          setFormError(formLevelError(apiErr, Object.keys(FIELD).concat("receiving_schedule")) ?? (Object.keys(mapped).length ? undefined : apiErr.message))
          const first = Object.keys(mapped)[0]
          if (first) document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
          return true
        },
      })
    }
  }

  return (
    <AdminPage
      breadcrumb={[{ label: "Peluang", href: "/admin/peluang" }, ...(o ? [{ label: o.title, href: `/admin/peluang/${o.id}` }] : [])]}
      title={edit ? "Ubah peluang" : "Peluang baru"}
    >
      <AdminFormLayout
        sections={sections}
        submitLabel={edit ? "Simpan perubahan" : "Buat peluang"}
        saving={saving}
        dirty={dirty}
        onSubmit={submit}
        cancelHref={o ? `/admin/peluang/${o.id}` : "/admin/peluang"}
      >
        <FormSectionCard id="toko" title="0 · Toko">
          <div id="f-store" className="flex flex-col gap-6">
            <FormField
              label="Toko"
              required
              error={errors.store}
              description={hasApplications ? "Toko tidak bisa diganti karena sudah ada pengajuan." : undefined}
            >
              <EntityPicker
                options={storeOptions}
                value={storeId}
                onChange={touch(setStoreId)}
                locked={hasApplications}
                invalid={!!errors.store}
                placeholder="Cari nama toko…"
              />
            </FormField>
            {store && (
              <div className="bg-muted/50 p-4">
                <p className="mb-3 text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">Jam operasional toko</p>
                <OperatingHoursTable hours={store.operating_hours} />
              </div>
            )}
          </div>
        </FormSectionCard>

        <FormSectionCard id="info" title="1 · Info dasar">
          <div className="flex flex-col gap-8">
            <div id="f-title">
              <FormField label="Judul peluang" htmlFor="o-title" required error={errors.title} aside={<CharCount value={title} max={120} />}>
                <Input id="o-title" value={title} aria-invalid={!!errors.title || undefined} onChange={(e) => touch(setTitle)(e.target.value)} placeholder="Cari camilan lokal untuk rak dekat kasir" />
              </FormField>
            </div>
            <div id="f-description">
              <FormField label="Deskripsi" htmlFor="o-desc" error={errors.description} aside={<CharCount value={description} max={500} />}>
                <Textarea id="o-desc" value={description} onChange={(e) => touch(setDescription)(e.target.value)} />
              </FormField>
            </div>
          </div>
        </FormSectionCard>

        <FormSectionCard id="produk" title="2 · Produk yang dicari">
          <div className="flex flex-col gap-8">
            <div id="f-categories">
              <FormField label="Kategori" required error={errors.categories} description="Hanya kategori aktif yang bisa dipilih.">
                <ChoiceChips label="Kategori" options={ACTIVE_CATEGORIES.map((c) => ({ value: c.id, label: c.name }))} value={categories} onChange={touch(setCategories)} />
              </FormField>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              <FormField label="Masa simpan minimal" htmlFor="o-shelf">
                <SuffixInput id="o-shelf" suffix="hari" value={minShelf} placeholder="30" onChange={(e) => touch(setMinShelf)(e.target.value.replace(/\D/g, ""))} />
              </FormField>
              <FormField label="Harga jual maksimal" htmlFor="o-max">
                <RupiahInput id="o-max" value={maxPrice} onChange={touch(setMaxPrice)} />
              </FormField>
            </div>
          </div>
        </FormSectionCard>

        <FormSectionCard id="legal" title="3 · Syarat legalitas">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col divide-y border-y">
              {(
                [
                  ["nib", "Wajib NIB"],
                  ["pirt", "Wajib PIRT"],
                  ["halal", "Wajib sertifikat halal"],
                ] as const
              ).map(([k, l]) => (
                <label key={k} className="flex items-center justify-between gap-4 py-4">
                  <span className="text-xs font-semibold tracking-widest uppercase">{l}</span>
                  <Switch checked={req[k]} onCheckedChange={(v) => touch(setReq)({ ...req, [k]: v })} />
                </label>
              ))}
            </div>
            <div id="f-notes">
              <FormField label="Syarat lain" htmlFor="o-notes" error={errors.notes} aside={<CharCount value={notes} max={300} />}>
                <Textarea id="o-notes" value={notes} onChange={(e) => touch(setNotes)(e.target.value)} />
              </FormField>
            </div>
          </div>
        </FormSectionCard>

        <FormSectionCard id="kuota" title="4 · Kuota">
          <div className="grid gap-8 sm:grid-cols-2">
            <FormField label="Jumlah UMKM yang diterima" required description={edit ? `Sudah terpakai: ${o!.quota_used}` : "1–50 UMKM."}>
              <NumberStepper label="Kuota" value={quota} onChange={touch(setQuota)} min={Math.max(1, o?.quota_used ?? 1)} max={50} />
            </FormField>
            <FormField label="Maksimal produk per UMKM" required description="1–10 produk.">
              <NumberStepper label="Maksimal produk" value={maxProducts} onChange={touch(setMaxProducts)} min={1} max={10} />
            </FormField>
          </div>
        </FormSectionCard>

        <FormSectionCard id="komisi" title="5 · Komisi">
          <div className="flex flex-col gap-8">
            {edit && (
              <Alert>
                <IconInfoCircle />
                <AlertDescription>Perubahan komisi dan syarat hanya berlaku untuk pengajuan baru.</AlertDescription>
              </Alert>
            )}
            <RadioGroup
              value={commission.type}
              onValueChange={(v) => touch(setCommission)(v === "percent" ? { type: "percent", value: 15 } : { type: "fixed", value: 2000 })}
              className="grid gap-3 sm:grid-cols-2"
            >
              {(
                [
                  ["percent", "Persentase dari harga jual"],
                  ["fixed", "Nominal per unit terjual"],
                ] as const
              ).map(([v, l]) => (
                <Label key={v} className="flex items-center gap-3 border p-4 normal-case has-data-checked:border-primary/30 has-data-checked:bg-primary/5">
                  <RadioGroupItem value={v} />
                  <span className="text-sm font-medium tracking-normal">{l}</span>
                </Label>
              ))}
            </RadioGroup>
            <div id="f-commission" className="sm:max-w-xs">
              <FormField label={commission.type === "percent" ? "Besar komisi" : "Komisi per unit"} required error={errors.commission}>
                {commission.type === "percent" ? (
                  <SuffixInput suffix="%" value={commission.value || ""} onChange={(e) => touch(setCommission)({ type: "percent", value: Number(e.target.value.replace(/\D/g, "") || 0) })} />
                ) : (
                  <RupiahInput value={commission.value || null} onChange={(n) => touch(setCommission)({ type: "fixed", value: n ?? 0 })} />
                )}
              </FormField>
            </div>
            <CommissionCalculator commission={commission} price={samplePrice} onPriceChange={setSamplePrice} />
          </div>
        </FormSectionCard>

        <FormSectionCard id="jadwal" title="6 · Jadwal terima barang" description="Slot di luar jam operasional toko ditandai “Toko tutup pada jam ini.”">
          <div id="f-schedule" className="flex flex-col gap-2">
            {store ? (
              <ReceivingScheduleEditor value={schedule} onChange={touch(setSchedule)} hours={store.operating_hours} />
            ) : (
              <p className="bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">Pilih toko dulu untuk mengatur jadwal.</p>
            )}
            {errors.schedule && <p className="text-sm text-destructive">{errors.schedule}</p>}
          </div>
        </FormSectionCard>

        <FormSectionCard id="berlaku" title="7 · Masa berlaku">
          <div id="f-validUntil" className="sm:max-w-xs">
            <FormField label="Berlaku sampai" htmlFor="o-valid" required error={errors.validUntil}>
              <Input id="o-valid" type="date" min={TODAY} value={validUntil} onChange={(e) => touch(setValidUntil)(e.target.value)} />
            </FormField>
          </div>
        </FormSectionCard>

        <FormSectionCard id="catatan" title="8 · Catatan admin">
          <AdminNoteFields reason={reason} onReason={setReason} notify={notify} onNotify={setNotify} notifyLabel="Beri tahu toko" />
        </FormSectionCard>
      </AdminFormLayout>
    </AdminPage>
  )
}
