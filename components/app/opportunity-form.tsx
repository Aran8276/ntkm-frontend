"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconInfoCircle } from "@tabler/icons-react"

import { addDaysIso, todayIso } from "@/lib/format"
import { api } from "@/lib/api"
import { revalidate, useApi } from "@/lib/use-api"
import type { Category, Commission, OperatingHour, Opportunity, ReceivingSlot, StoreProfile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { AppShell } from "@/components/app/app-shell"
import { ConfirmDialog, PageSkeletonBody, Section } from "@/components/app/blocks"
import { LoadError, formLevelError, handleApiError } from "@/components/app/feedback"
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

/** API field → form error key (scroll target `f-<key>`). */
const FIELD: Record<string, string> = {
  title: "title",
  description: "description",
  category_ids: "categories",
  "requirements.min_shelf_life_days": "minShelf",
  "requirements.max_retail_price": "maxPrice",
  "requirements.notes": "notes",
  quota: "quota",
  max_products_per_umkm: "quota",
  commission: "commission",
  "commission.value": "commission",
  "commission.type": "commission",
  receiving_schedule: "schedule",
  valid_until: "validUntil",
}

/**
 * P08 loader: categories, the store profile (receiving slots must sit inside
 * operating hours) and, in edit mode, `GET /me/opportunities/{id}`.
 */
export function OpportunityFormPage({ id }: { id?: string }) {
  const categories = useApi<Category[]>("user", "/categories")
  const store = useApi<StoreProfile>("user", "/me/store-profile")
  const opp = useApi<Opportunity>("user", id ? `/me/opportunities/${id}` : null)
  const failed = [categories, store, opp].find((q) => q.error && !q.data)?.error
  const ready = categories.data && store.data && (!id || opp.data)
  if (ready && opp.data?.status !== "closed")
    return (
      <OpportunityForm
        key={opp.data?.id ?? "new"}
        opportunity={opp.data}
        categories={categories.data!}
        hours={store.data!.operating_hours}
      />
    )
  return (
    <AppShell role="store" title={id ? "Ubah peluang" : "Peluang baru"} back={id ? `/toko/peluang/${id}` : "/toko/peluang"} hideNav>
      {failed ? (
        <LoadError error={failed} onRetry={() => [categories, store, opp].forEach((q) => void q.reload())} backHref="/toko/peluang" backLabel="Kembali ke peluang" />
      ) : opp.data?.status === "closed" ? (
        <LoadError error={undefined} backHref={`/toko/peluang/${id}`} />
      ) : (
        <PageSkeletonBody />
      )}
    </AppShell>
  )
}

function OpportunityForm({
  opportunity,
  categories: CATEGORIES,
  hours,
}: {
  opportunity?: Opportunity
  categories: Category[]
  hours: OperatingHour[]
}) {
  const router = useRouter()
  const edit = !!opportunity
  const o = opportunity
  const [TODAY] = React.useState(() => todayIso())

  const [title, setTitle] = React.useState(o?.title ?? "")
  const [description, setDescription] = React.useState(o?.description ?? "")
  const [categories, setCategories] = React.useState<string[]>(o?.categories.map((c) => c.id) ?? [])
  const [minShelf, setMinShelf] = React.useState(o?.requirements.min_shelf_life_days?.toString() ?? "")
  const [maxPrice, setMaxPrice] = React.useState<number | null>(o?.requirements.max_retail_price ?? null)
  const [reqNib, setReqNib] = React.useState(o?.requirements.requires_nib ?? false)
  const [reqPirt, setReqPirt] = React.useState(o?.requirements.requires_pirt ?? false)
  const [reqHalal, setReqHalal] = React.useState(o?.requirements.requires_halal ?? false)
  const [notes, setNotes] = React.useState(o?.requirements.notes ?? "")
  const [quota, setQuota] = React.useState(o?.quota ?? 3)
  const [maxProducts, setMaxProducts] = React.useState(o?.max_products_per_umkm ?? 3)
  const [commission, setCommission] = React.useState<Commission>(o?.commission ?? { type: "percent", value: 15 })
  const [samplePrice, setSamplePrice] = React.useState(10000)
  const [schedule, setSchedule] = React.useState<ReceivingSlot[]>(
    o?.receiving_schedule ?? [{ day: "mon", start: "08:00", end: "10:00" }]
  )
  const [validUntil, setValidUntil] = React.useState(() => o?.valid_until ?? addDaysIso(30))
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const [confirmCancel, setConfirmCancel] = React.useState(false)
  const [formError, setFormError] = React.useState<string | undefined>()
  const dirty = React.useRef(false)
  const touch = <T,>(set: (v: T) => void) => (v: T) => {
    dirty.current = true
    set(v)
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (title.trim().length < 5 || title.length > 120) e.title = "Judul 5–120 karakter."
    if (description.length > 500) e.description = "Maksimal 500 karakter."
    if (!categories.length) e.categories = "Pilih minimal 1 kategori."
    if (minShelf && Number(minShelf) < 1) e.minShelf = "Minimal 1 hari."
    if (notes.length > 300) e.notes = "Maksimal 300 karakter."
    if (commission.type === "percent" && (commission.value < 1 || commission.value > 50))
      e.commission = "Persentase 1–50%."
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

  const payload = () => ({
    title: title.trim(),
    description,
    category_ids: categories,
    requirements: {
      min_shelf_life_days: minShelf ? Number(minShelf) : null,
      max_retail_price: maxPrice || null,
      requires_nib: reqNib,
      requires_pirt: reqPirt,
      requires_halal: reqHalal,
      notes,
    },
    quota,
    max_products_per_umkm: maxProducts,
    commission,
    receiving_schedule: schedule,
    valid_until: validUntil,
  })

  const save = async () => {
    setSaving(true)
    setFormError(undefined)
    const body: Record<string, unknown> = payload()
    try {
      let saved: Opportunity
      if (edit && o) {
        // Edit mode sends only the fields that changed.
        const before: Record<string, unknown> = {
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
        saved = await api.patch<Opportunity>(`/me/opportunities/${o.id}`, diff)
      } else saved = await api.post<Opportunity>("/me/opportunities", body)
      toast.add({ title: edit ? "Perubahan disimpan." : "Peluang dipasang.", type: "success" })
      void revalidate("user", "/me/opportunities", "/applications")
      router.push(`/toko/peluang/${saved.id}`)
    } catch (err) {
      setSaving(false)
      handleApiError(err, {
        onFieldErrors: (fields, apiErr) => {
          const mapped: Record<string, string> = {}
          for (const [k, v] of Object.entries(fields)) {
            const key = FIELD[k] ?? FIELD[k.split(".")[0]] ?? (k.startsWith("receiving_schedule") ? "schedule" : undefined)
            if (key) mapped[key] = v
          }
          setErrors(mapped)
          setFormError(formLevelError(apiErr, Object.keys(FIELD).concat("receiving_schedule")))
          const first = Object.keys(mapped)[0]
          if (first) document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
          return true
        },
      })
    }
  }

  const cancel = () => (dirty.current ? setConfirmCancel(true) : router.back())

  return (
    <AppShell
      role="store"
      title={edit ? "Ubah peluang" : "Peluang baru"}
      back={edit ? `/toko/peluang/${o!.id}` : "/toko/peluang"}
      hideNav
      bottomBar={
        <div className="flex gap-3">
          <Button variant="outline" onClick={cancel} disabled={saving}>
            Batal
          </Button>
          <Button className="flex-1 sm:ml-auto sm:flex-none" onClick={submit} disabled={saving}>
            {saving ? (
              <>
                <Spinner data-icon="inline-start" /> Menyimpan…
              </>
            ) : edit ? (
              "Simpan perubahan"
            ) : (
              "Pasang peluang"
            )}
          </Button>
        </div>
      }
    >
      {edit && (
        <Alert>
          <IconInfoCircle />
          <AlertDescription>Perubahan komisi dan syarat hanya berlaku untuk pengajuan baru.</AlertDescription>
        </Alert>
      )}

      <Section title="1 · Info dasar">
        <div className="flex flex-col gap-8">
          <div id="f-title">
            <FormField label="Judul peluang" htmlFor="title" required error={errors.title} aside={<CharCount value={title} max={120} />}>
              <Input
                id="title"
                value={title}
                aria-invalid={!!errors.title || undefined}
                onChange={(e) => touch(setTitle)(e.target.value)}
                placeholder="Cari camilan lokal untuk rak dekat kasir"
              />
            </FormField>
          </div>
          <div id="f-description">
            <FormField label="Deskripsi" htmlFor="description" error={errors.description} aside={<CharCount value={description} max={500} />}>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => touch(setDescription)(e.target.value)}
                placeholder="Ukuran rak, target pembeli, dll."
              />
            </FormField>
          </div>
        </div>
      </Section>

      <Section title="2 · Produk yang dicari">
        <div className="flex flex-col gap-8">
          <div id="f-categories">
            <FormField label="Kategori" required error={errors.categories}>
              <ChoiceChips
                label="Kategori"
                options={CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
                value={categories}
                onChange={touch(setCategories)}
              />
            </FormField>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <div id="f-minShelf">
              <FormField label="Masa simpan minimal" htmlFor="minShelf" error={errors.minShelf}>
                <SuffixInput
                  id="minShelf"
                  suffix="hari"
                  value={minShelf}
                  placeholder="30"
                  onChange={(e) => touch(setMinShelf)(e.target.value.replace(/\D/g, ""))}
                />
              </FormField>
            </div>
            <div id="f-maxPrice">
              <FormField label="Harga jual maksimal" htmlFor="maxPrice" error={errors.maxPrice}>
                <RupiahInput id="maxPrice" value={maxPrice} onChange={touch(setMaxPrice)} />
              </FormField>
            </div>
          </div>
        </div>
      </Section>

      <Section title="3 · Syarat legalitas">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col divide-y border-y">
            {(
              [
                ["Wajib NIB", reqNib, setReqNib],
                ["Wajib PIRT", reqPirt, setReqPirt],
                ["Wajib sertifikat halal", reqHalal, setReqHalal],
              ] as const
            ).map(([label, checked, set]) => (
              <label key={label} className="flex items-center justify-between gap-4 py-4">
                <span className="text-xs font-semibold tracking-widest uppercase">{label}</span>
                <Switch checked={checked} onCheckedChange={touch(set)} />
              </label>
            ))}
          </div>
          <div id="f-notes">
            <FormField label="Syarat lain" htmlFor="notes" error={errors.notes} aside={<CharCount value={notes} max={300} />}>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => touch(setNotes)(e.target.value)}
                placeholder="Kemasan wajib mencantumkan komposisi."
              />
            </FormField>
          </div>
        </div>
      </Section>

      <Section title="4 · Kuota">
        <div id="f-quota" className="grid gap-8 sm:grid-cols-2">
          <FormField
            label="Jumlah UMKM yang diterima"
            required
            error={errors.quota}
            description={edit ? `Sudah terpakai: ${o!.quota_used}` : "1–50 UMKM."}
          >
            <NumberStepper
              label="Jumlah UMKM"
              value={quota}
              onChange={touch(setQuota)}
              min={Math.max(1, o?.quota_used ?? 1)}
              max={50}
            />
          </FormField>
          <FormField label="Maksimal produk per UMKM" required description="1–10 produk.">
            <NumberStepper label="Maksimal produk" value={maxProducts} onChange={touch(setMaxProducts)} min={1} max={10} />
          </FormField>
        </div>
      </Section>

      <Section title="5 · Komisi">
        <div className="flex flex-col gap-8">
          <RadioGroup
            value={commission.type}
            onValueChange={(v) =>
              touch(setCommission)(v === "percent" ? { type: "percent", value: 15 } : { type: "fixed", value: 2000 })
            }
            className="grid gap-3 sm:grid-cols-2"
          >
            {(
              [
                ["percent", "Persentase dari harga jual"],
                ["fixed", "Nominal per unit terjual"],
              ] as const
            ).map(([value, label]) => (
              <Label
                key={value}
                className="flex items-center gap-3 border p-4 normal-case has-data-checked:border-primary/30 has-data-checked:bg-primary/5"
              >
                <RadioGroupItem value={value} />
                <span className="text-sm font-medium tracking-normal">{label}</span>
              </Label>
            ))}
          </RadioGroup>
          <div id="f-commission" className="sm:max-w-xs">
            <FormField label={commission.type === "percent" ? "Besar komisi" : "Komisi per unit"} required error={errors.commission}>
              {commission.type === "percent" ? (
                <SuffixInput
                  suffix="%"
                  value={commission.value || ""}
                  onChange={(e) =>
                    touch(setCommission)({ type: "percent", value: Number(e.target.value.replace(/\D/g, "") || 0) })
                  }
                />
              ) : (
                <RupiahInput
                  value={commission.value || null}
                  onChange={(n) => touch(setCommission)({ type: "fixed", value: n ?? 0 })}
                />
              )}
            </FormField>
          </div>
          <CommissionCalculator commission={commission} price={samplePrice} onPriceChange={setSamplePrice} />
        </div>
      </Section>

      <Section
        title="6 · Jadwal terima barang"
        description="Slot harus berada di dalam jam operasional toko."
      >
        <div id="f-schedule" className="flex flex-col gap-2">
          <ReceivingScheduleEditor value={schedule} onChange={touch(setSchedule)} hours={hours} />
          {errors.schedule && <p className="text-sm text-destructive">{errors.schedule}</p>}
        </div>
      </Section>

      <Section title="7 · Masa berlaku">
        <div id="f-validUntil" className="sm:max-w-xs">
          <FormField label="Berlaku sampai" htmlFor="validUntil" required error={errors.validUntil}>
            <Input
              id="validUntil"
              type="date"
              min={TODAY}
              value={validUntil}
              onChange={(e) => touch(setValidUntil)(e.target.value)}
            />
          </FormField>
        </div>
      </Section>

      {formError && <p className="bg-destructive/10 px-5 py-4 text-sm text-destructive">{formError}</p>}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Buang perubahan?"
        description="Isian yang belum disimpan akan hilang."
        confirmLabel="Ya, buang"
        destructive
        onConfirm={() => router.back()}
      />
    </AppShell>
  )
}
