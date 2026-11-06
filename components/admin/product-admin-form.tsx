"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { IconInfoCircle } from "@tabler/icons-react"

import { formatRupiah } from "@/lib/format"
import { ADMIN_CATEGORIES, ADMIN_PRODUCTS } from "@/lib/admin-mock"
import { CATEGORIES } from "@/lib/mock-data"
import type { AdminProduct } from "@/lib/admin-types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { FormField } from "@/components/app/form-field"
import { CharCount, FileUpload, RupiahInput, SuffixInput, TagInput } from "@/components/app/inputs"
import { AdminPage } from "@/components/admin/admin-page"
import { AdminFormLayout, AdminNoteFields, FormSectionCard } from "@/components/admin/form-layout"
import { EntityPicker } from "@/components/admin/pickers"
import { umkmOptions } from "@/components/admin/options"
import { ConflictModal } from "@/components/admin/risky-action"

const ACTIVE_CATEGORIES = CATEGORIES.filter((c) => ADMIN_CATEGORIES.find((a) => a.name === c.name)?.is_active)

/** A14 · Form produk (admin). */
export function ProductAdminForm({ product: p }: { product?: AdminProduct }) {
  const router = useRouter()
  const params = useSearchParams()
  const edit = !!p
  const everApplied = !!p && p.applications.length > 0
  const inOpenApplication = !!p && p.applications.some((a) => a.status === "submitted" || a.status === "approved")

  const [umkmId, setUmkmId] = React.useState<string | null>(p?.umkm.id ?? params.get("umkm_id"))
  const [photos, setPhotos] = React.useState(p?.photo_count ?? 0)
  const [name, setName] = React.useState(p?.name ?? "")
  const [categoryId, setCategoryId] = React.useState(p?.category.id.toString() ?? "")
  const [description, setDescription] = React.useState(p?.description ?? "")
  const [tags, setTags] = React.useState<string[]>(p?.tags ?? [])
  const [base, setBase] = React.useState<number | null>(p?.base_price ?? null)
  const [srp, setSrp] = React.useState<number | null>(p?.suggested_retail_price ?? null)
  const [shelfMode, setShelfMode] = React.useState<"days" | "date">(p?.expiry_date ? "date" : "days")
  const [shelfDays, setShelfDays] = React.useState(p?.shelf_life_days?.toString() ?? "")
  const [expiry, setExpiry] = React.useState(p?.expiry_date ?? "")
  const [active, setActive] = React.useState(p?.is_active ?? true)
  const [conflict, setConflict] = React.useState(false)
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
    { id: "umkm", title: "0 · UMKM" },
    { id: "foto", title: "1 · Foto" },
    { id: "info", title: "2 · Info produk" },
    { id: "harga", title: "3 · Harga" },
    { id: "kedaluwarsa", title: "4 · Kedaluwarsa" },
    { id: "status", title: "5 · Status" },
    { id: "catatan", title: "6 · Catatan admin" },
  ]

  const submit = () => {
    const e: Record<string, string> = {}
    if (!umkmId) e.umkm = "Pilih UMKM."
    if (photos < 1 || photos > 5) e.photos = "Unggah 1–5 foto."
    if (name.trim().length < 3 || name.length > 100) e.name = "Nama 3–100 karakter."
    if (!categoryId) e.category = "Pilih kategori."
    if (!base || base <= 0) e.base = "Harga setor harus lebih dari 0."
    if (!srp || srp <= 0) e.srp = "Harga jual harus lebih dari 0."
    else if (base && srp < base) e.srp = "Harga jual tidak boleh di bawah harga setor."
    if (shelfMode === "days" && !Number(shelfDays)) e.shelf = "Isi masa simpan dalam hari."
    if (shelfMode === "date" && !expiry) e.shelf = "Isi tanggal kedaluwarsa."
    setErrors(e)
    const first = Object.keys(e)[0]
    if (first) {
      document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setSaving(true)
    setTimeout(() => {
      toast.add({ title: edit ? "Perubahan disimpan." : "Produk dibuat.", type: "success" })
      setDirty(false)
      router.push(`/admin/produk/${p?.id ?? ADMIN_PRODUCTS[0].id}`)
    }, 700)
  }

  return (
    <AdminPage
      breadcrumb={[{ label: "Produk", href: "/admin/produk" }, ...(p ? [{ label: p.name, href: `/admin/produk/${p.id}` }] : [])]}
      title={edit ? "Ubah produk" : "Produk baru"}
    >
      <AdminFormLayout
        sections={sections}
        submitLabel={edit ? "Simpan perubahan" : "Buat produk"}
        saving={saving}
        dirty={dirty}
        onSubmit={submit}
        cancelHref={p ? `/admin/produk/${p.id}` : "/admin/produk"}
      >
        <FormSectionCard id="umkm" title="0 · UMKM">
          <div id="f-umkm">
            <FormField
              label="UMKM"
              required
              error={errors.umkm}
              description={everApplied ? "UMKM tidak bisa diganti karena produk sudah pernah diajukan." : undefined}
            >
              <EntityPicker options={umkmOptions} value={umkmId} onChange={touch(setUmkmId)} locked={everApplied} invalid={!!errors.umkm} placeholder="Cari nama usaha…" />
            </FormField>
          </div>
        </FormSectionCard>

        <FormSectionCard id="foto" title="1 · Foto">
          <div id="f-photos" className="flex flex-col gap-4">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconInfoCircle className="size-4" /> Foto yang diunggah admin akan menjadi milik UMKM ini.
            </p>
            <FileUpload max={5} initialCount={p?.photo_count ?? 0} onCountChange={(n) => { setPhotos(n); setDirty(true) }} />
            {errors.photos && <p className="text-sm text-destructive">{errors.photos}</p>}
          </div>
        </FormSectionCard>

        <FormSectionCard id="info" title="2 · Info produk">
          <div className="flex flex-col gap-8">
            <div id="f-name">
              <FormField label="Nama produk" htmlFor="pr-name" required error={errors.name} aside={<CharCount value={name} max={100} />}>
                <Input id="pr-name" value={name} aria-invalid={!!errors.name || undefined} onChange={(e) => touch(setName)(e.target.value)} placeholder="Keripik Tempe Pedas 100 g" />
              </FormField>
            </div>
            <div id="f-category" className="sm:max-w-xs">
              <FormField label="Kategori" htmlFor="pr-cat" required error={errors.category} description="Hanya kategori aktif yang bisa dipilih.">
                <NativeSelect id="pr-cat" value={categoryId} onChange={(e) => touch(setCategoryId)(e.target.value)} aria-invalid={!!errors.category || undefined}>
                  <NativeSelectOption value="">Pilih kategori</NativeSelectOption>
                  {ACTIVE_CATEGORIES.map((c) => (
                    <NativeSelectOption key={c.id} value={c.id}>
                      {c.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormField>
            </div>
            <FormField label="Deskripsi" htmlFor="pr-desc" aside={<CharCount value={description} max={500} />}>
              <Textarea id="pr-desc" value={description} onChange={(e) => touch(setDescription)(e.target.value)} />
            </FormField>
            <FormField label="Tagar" description="Maksimal 10 tagar.">
              <TagInput value={tags} onChange={touch(setTags)} />
            </FormField>
          </div>
        </FormSectionCard>

        <FormSectionCard id="harga" title="3 · Harga">
          <div className="flex flex-col gap-6">
            <div className="grid gap-8 sm:grid-cols-2">
              <div id="f-base">
                <FormField label="Harga setor" htmlFor="pr-base" required error={errors.base}>
                  <RupiahInput id="pr-base" value={base} onChange={touch(setBase)} invalid={!!errors.base} />
                </FormField>
              </div>
              <div id="f-srp">
                <FormField label="Harga jual saran" htmlFor="pr-srp" required error={errors.srp}>
                  <RupiahInput id="pr-srp" value={srp} onChange={touch(setSrp)} invalid={!!errors.srp} />
                </FormField>
              </div>
            </div>
            {base != null && srp != null && srp >= base && (
              <p className="bg-muted/60 px-4 py-3 text-sm">
                Selisih untuk toko: <span className="font-medium">{formatRupiah(srp - base)}</span>
              </p>
            )}
          </div>
        </FormSectionCard>

        <FormSectionCard id="kedaluwarsa" title="4 · Kedaluwarsa">
          <div id="f-shelf" className="flex flex-col gap-6">
            <RadioGroup value={shelfMode} onValueChange={(v) => touch(setShelfMode)(v as "days" | "date")} className="flex gap-6">
              {(
                [
                  ["days", "Masa simpan (hari)"],
                  ["date", "Tanggal kedaluwarsa"],
                ] as const
              ).map(([v, l]) => (
                <Label key={v} className="flex items-center gap-2.5 normal-case">
                  <RadioGroupItem value={v} />
                  <span className="text-sm font-normal tracking-normal">{l}</span>
                </Label>
              ))}
            </RadioGroup>
            <div className="sm:max-w-xs">
              <FormField label={shelfMode === "days" ? "Masa simpan" : "Tanggal kedaluwarsa"} required error={errors.shelf}>
                {shelfMode === "days" ? (
                  <SuffixInput suffix="hari" value={shelfDays} onChange={(e) => touch(setShelfDays)(e.target.value.replace(/\D/g, ""))} placeholder="90" />
                ) : (
                  <Input type="date" value={expiry} onChange={(e) => touch(setExpiry)(e.target.value)} />
                )}
              </FormField>
            </div>
          </div>
        </FormSectionCard>

        <FormSectionCard id="status" title="5 · Status">
          <label className="flex items-center justify-between gap-4 border-y py-4">
            <span className="flex flex-col gap-1">
              <span className="text-xs font-semibold tracking-widest uppercase">Aktif</span>
              <span className="text-sm text-muted-foreground">Produk aktif bisa dipilih UMKM untuk pengajuan baru.</span>
            </span>
            <Switch
              checked={active}
              onCheckedChange={(v) => {
                if (!v && inOpenApplication) {
                  setConflict(true)
                  return
                }
                touch(setActive)(v)
              }}
            />
          </label>
        </FormSectionCard>

        <FormSectionCard id="catatan" title="6 · Catatan admin">
          <AdminNoteFields reason={reason} onReason={setReason} notify={notify} onNotify={setNotify} notifyLabel="Beri tahu UMKM" />
        </FormSectionCard>

        {edit && (
          <Alert>
            <IconInfoCircle />
            <AlertDescription>Validasi mengikuti form produk UMKM (nama 3–100 karakter, 1–5 foto, harga &gt; 0, maks 10 tagar).</AlertDescription>
          </Alert>
        )}
      </AdminFormLayout>
      <ConflictModal
        open={conflict}
        onOpenChange={setConflict}
        message="Produk ini masih ada di pengajuan yang diajukan atau disetujui, jadi belum bisa dinonaktifkan."
        links={(p?.applications ?? [])
          .filter((a) => a.status === "submitted" || a.status === "approved")
          .map((a) => ({ label: `Pengajuan ${a.id.slice(0, 8)} · ${a.store}`, href: `/admin/pengajuan/${a.id}` }))}
      />
    </AdminPage>
  )
}
