"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { formatRupiah } from "@/lib/format"
import { CATEGORIES } from "@/lib/mock-data"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { AppShell } from "@/components/app/app-shell"
import { ConfirmDialog, Section } from "@/components/app/blocks"
import { FormField } from "@/components/app/form-field"
import { CharCount, ChoiceChips, FileUpload, RupiahInput, SuffixInput, TagInput } from "@/components/app/inputs"

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const params = useSearchParams()
  const returnTo = params.get("return")
  const edit = !!product
  const p = product
  const backHref = returnTo ?? "/umkm/produk"

  const [photoCount, setPhotoCount] = React.useState(p?.photo_count ?? 0)
  const [name, setName] = React.useState(p?.name ?? "")
  const [categoryId, setCategoryId] = React.useState<number | null>(p?.category.id ?? null)
  const [description, setDescription] = React.useState(p?.description ?? "")
  const [tags, setTags] = React.useState<string[]>(p?.tags ?? [])
  const [basePrice, setBasePrice] = React.useState<number | null>(p?.base_price ?? null)
  const [retailPrice, setRetailPrice] = React.useState<number | null>(p?.suggested_retail_price ?? null)
  const [expiryMode, setExpiryMode] = React.useState<"shelf" | "date">(p?.expiry_date ? "date" : "shelf")
  const [shelfLife, setShelfLife] = React.useState(p?.shelf_life_days?.toString() ?? "")
  const [expiryDate, setExpiryDate] = React.useState(p?.expiry_date ?? "")
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const [archiveOpen, setArchiveOpen] = React.useState(false)

  const margin = basePrice != null && retailPrice != null ? retailPrice - basePrice : null

  const submit = () => {
    const e: Record<string, string> = {}
    if (photoCount === 0) e.photos = "Tambahkan minimal 1 foto."
    if (name.trim().length < 3 || name.length > 100) e.name = "Nama produk 3–100 karakter."
    if (!categoryId) e.category = "Pilih kategori."
    if (description.length > 500) e.description = "Maksimal 500 karakter."
    if (!basePrice) e.basePrice = "Harga setor harus lebih dari 0."
    if (!retailPrice) e.retailPrice = "Harga jual wajib diisi."
    else if (basePrice && retailPrice < basePrice)
      e.retailPrice = "Harga jual tidak boleh lebih rendah dari harga setor."
    if (expiryMode === "shelf" && !Number(shelfLife)) e.expiry = "Isi masa simpan dalam hari."
    if (expiryMode === "date" && !expiryDate) e.expiry = "Pilih tanggal kedaluwarsa."
    setErrors(e)
    const first = Object.keys(e)[0]
    if (first) {
      document.getElementById(`f-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setSaving(true)
    setTimeout(() => {
      toast.add({ title: "Produk disimpan.", type: "success" })
      router.push(backHref)
    }, 700)
  }

  return (
    <AppShell
      role="umkm"
      title={edit ? "Ubah produk" : "Produk baru"}
      back={backHref}
      hideNav
      bottomBar={
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push(backHref)} disabled={saving}>
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
              "Simpan produk"
            )}
          </Button>
        </div>
      }
    >
      {edit && (
        <p className="bg-background px-5 py-4 text-sm shadow-sm ring-1 ring-foreground/5">
          Sedang dijual di <span className="font-medium">{p!.active_placements} toko</span>
        </p>
      )}

      <Section title="1 · Foto" description="1–5 foto. Foto pertama menjadi foto utama.">
        <div id="f-photos" className="flex flex-col gap-2">
          <FileUpload max={5} initialCount={p?.photo_count ?? 0} onCountChange={setPhotoCount} />
          {errors.photos && <p className="text-sm text-destructive">{errors.photos}</p>}
        </div>
      </Section>

      <Section title="2 · Info produk">
        <div className="flex flex-col gap-8">
          <div id="f-name">
            <FormField
              label="Nama produk"
              htmlFor="name"
              required
              error={errors.name}
              description="Sertakan ukuran atau berat."
            >
              <Input
                id="name"
                value={name}
                aria-invalid={!!errors.name || undefined}
                onChange={(e) => setName(e.target.value)}
                placeholder="Keripik Tempe Pedas 100 g"
              />
            </FormField>
          </div>
          <div id="f-category">
            <FormField label="Kategori" required error={errors.category}>
              <ChoiceChips
                label="Kategori"
                multiple={false}
                options={CATEGORIES.map((c) => ({ value: c.id, label: c.name }))}
                value={categoryId ? [categoryId] : []}
                onChange={(v) => setCategoryId(v[0] ?? null)}
              />
            </FormField>
          </div>
          <div id="f-description">
            <FormField label="Deskripsi" htmlFor="description" error={errors.description} aside={<CharCount value={description} max={500} />}>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Tagar" htmlFor="tags" description="Tekan Enter atau koma untuk menambah. Maks 10 tagar.">
            <TagInput id="tags" value={tags} onChange={setTags} />
          </FormField>
        </div>
      </Section>

      <Section title="3 · Harga">
        <div className="flex flex-col gap-8">
          <div className="grid gap-8 sm:grid-cols-2">
            <div id="f-basePrice">
              <FormField label="Harga setor ke toko" htmlFor="basePrice" required error={errors.basePrice}>
                <RupiahInput id="basePrice" value={basePrice} onChange={setBasePrice} invalid={!!errors.basePrice} />
              </FormField>
            </div>
            <div id="f-retailPrice">
              <FormField label="Harga jual yang disarankan" htmlFor="retailPrice" required error={errors.retailPrice}>
                <RupiahInput id="retailPrice" value={retailPrice} onChange={setRetailPrice} invalid={!!errors.retailPrice} />
              </FormField>
            </div>
          </div>
          {margin != null && (
            <p className={cn("bg-muted/60 px-4 py-3 text-sm", margin < 0 && "text-destructive")}>
              Selisih untuk toko: <span className="font-medium">{formatRupiah(margin)}</span> per unit
            </p>
          )}
        </div>
      </Section>

      <Section title="4 · Kedaluwarsa">
        <div id="f-expiry" className="flex flex-col gap-6">
          <RadioGroup
            value={expiryMode}
            onValueChange={(v) => setExpiryMode(v as "shelf" | "date")}
            className="grid gap-3 sm:grid-cols-2"
          >
            {(
              [
                ["shelf", "Masa simpan (hari)"],
                ["date", "Tanggal kedaluwarsa tetap"],
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
          <div className="sm:max-w-xs">
            {expiryMode === "shelf" ? (
              <FormField label="Masa simpan" htmlFor="shelfLife" required error={errors.expiry}>
                <SuffixInput
                  id="shelfLife"
                  suffix="hari"
                  value={shelfLife}
                  placeholder="90"
                  onChange={(e) => setShelfLife(e.target.value.replace(/\D/g, ""))}
                />
              </FormField>
            ) : (
              <FormField label="Tanggal kedaluwarsa" htmlFor="expiryDate" required error={errors.expiry}>
                <Input id="expiryDate" type="date" min="2026-11-05" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </FormField>
            )}
          </div>
        </div>
      </Section>

      {edit && (
        <Section title="Arsipkan produk" description="Produk yang diarsipkan tidak bisa dipilih untuk pengajuan baru.">
          <Button variant="destructive" onClick={() => setArchiveOpen(true)}>
            Arsipkan produk
          </Button>
        </Section>
      )}

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Arsipkan ${p?.name ?? "produk"}?`}
        description="Produk tidak bisa dipilih untuk pengajuan baru."
        confirmLabel="Ya, arsipkan"
        destructive
        onConfirm={() => {
          toast.add({ title: "Produk diarsipkan.", type: "success" })
          router.push("/umkm/produk")
        }}
      />
    </AppShell>
  )
}
