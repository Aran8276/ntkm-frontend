"use client"

import * as React from "react"
import { IconCategory, IconEdit, IconGripVertical, IconPlus, IconTrash } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { ADMIN_CATEGORIES, slugify } from "@/lib/admin-mock"
import type { AdminCategory } from "@/lib/admin-types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ConfirmDialog, EmptyState } from "@/components/app/blocks"
import { FormField } from "@/components/app/form-field"
import { AdminPage } from "@/components/admin/admin-page"

/** A19 · Kategori. */
export function CategoriesManager() {
  const [rows, setRows] = React.useState(ADMIN_CATEGORIES)
  const [dragging, setDragging] = React.useState<string | null>(null)
  const [form, setForm] = React.useState<{ open: boolean; cat: AdminCategory | null }>({ open: false, cat: null })
  const [deactivate, setDeactivate] = React.useState<AdminCategory | null>(null)
  const [remove, setRemove] = React.useState<AdminCategory | null>(null)

  const setActive = (c: AdminCategory, v: boolean) => {
    setRows((r) => r.map((x) => (x.id === c.id ? { ...x, is_active: v } : x)))
    toast.add({ title: v ? "Kategori diaktifkan." : "Kategori dinonaktifkan.", type: "success" })
  }

  const onDrop = (targetId: string) => {
    if (!dragging || dragging === targetId) return
    setRows((r) => {
      const from = r.findIndex((x) => x.id === dragging)
      const to = r.findIndex((x) => x.id === targetId)
      const next = [...r]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next.map((x, i) => ({ ...x, sort_order: (i + 1) * 10 }))
    })
    setDragging(null)
    toast.add({ title: "Urutan disimpan.", type: "success" })
  }

  const add = (
    <Button onClick={() => setForm({ open: true, cat: null })}>
      <IconPlus data-icon="inline-start" /> Kategori
    </Button>
  )

  return (
    <AdminPage title="Kategori" description="Kategori produk dan peluang. Seret baris untuk mengubah urutan." actions={add}>
      {rows.length === 0 ? (
        <EmptyState icon={IconCategory} action={add}>
          Belum ada kategori. Tambahkan kategori agar UMKM bisa mengisi produk.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto bg-background shadow-sm ring-1 ring-foreground/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs tracking-wider text-muted-foreground uppercase">
                <th className="w-12 py-3 pl-5" aria-label="Urutan" />
                <th className="px-3 py-3 font-medium">Nama</th>
                <th className="px-3 py-3 font-medium">Slug</th>
                <th className="px-3 py-3 text-right font-medium">Produk</th>
                <th className="px-3 py-3 text-right font-medium">Peluang</th>
                <th className="px-3 py-3 font-medium">Aktif</th>
                <th className="px-3 py-3 pr-5 text-right font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const used = c.usage.products + c.usage.opportunities > 0
                return (
                  <tr
                    key={c.id}
                    draggable
                    onDragStart={() => setDragging(c.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(c.id)}
                    onDragEnd={() => setDragging(null)}
                    className={cn("border-b last:border-0 hover:bg-muted/40", dragging === c.id && "opacity-40", !c.is_active && "text-muted-foreground")}
                  >
                    <td className="py-3 pl-5">
                      <IconGripVertical className="size-4 cursor-grab text-muted-foreground" aria-label="Seret untuk mengubah urutan" />
                    </td>
                    <td className="px-3 py-3 font-medium">{c.name}</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{c.usage.products}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{c.usage.opportunities}</td>
                    <td className="px-3 py-3">
                      <Switch
                        checked={c.is_active}
                        aria-label={`Aktif: ${c.name}`}
                        onCheckedChange={(v) => (v ? setActive(c, true) : setDeactivate(c))}
                      />
                    </td>
                    <td className="px-3 py-3 pr-5">
                      <span className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`Ubah ${c.name}`} onClick={() => setForm({ open: true, cat: c })}>
                          <IconEdit />
                        </Button>
                        {used ? (
                          <Tooltip>
                            <TooltipTrigger render={<span tabIndex={0} />}>
                              <Button variant="ghost" size="icon-sm" disabled aria-label={`Hapus ${c.name}`}>
                                <IconTrash />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Nonaktifkan saja, kategori masih dipakai.</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Button variant="ghost" size="icon-sm" className="text-destructive" aria-label={`Hapus ${c.name}`} onClick={() => setRemove(c)}>
                            <IconTrash />
                          </Button>
                        )}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <CategoryFormModal
        open={form.open}
        category={form.cat}
        onOpenChange={(o) => setForm((f) => ({ ...f, open: o }))}
        existing={rows}
      />
      <ConfirmDialog
        open={!!deactivate}
        onOpenChange={(o) => !o && setDeactivate(null)}
        title={`Nonaktifkan ${deactivate?.name ?? ""}?`}
        description="Kategori tidak bisa dipilih untuk produk/peluang baru. Data lama tetap."
        confirmLabel="Nonaktifkan"
        onConfirm={() => deactivate && setActive(deactivate, false)}
      />
      <ConfirmDialog
        open={!!remove}
        onOpenChange={(o) => !o && setRemove(null)}
        title={`Hapus kategori ${remove?.name ?? ""}?`}
        description="Kategori belum dipakai produk atau peluang mana pun."
        confirmLabel="Hapus"
        destructive
        onConfirm={() => {
          setRows((r) => r.filter((x) => x.id !== remove?.id))
          toast.add({ title: "Kategori dihapus.", type: "success" })
        }}
      />
    </AdminPage>
  )
}

function CategoryFormModal({
  open,
  onOpenChange,
  category,
  existing,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  category: AdminCategory | null
  existing: AdminCategory[]
}) {
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [slugTouched, setSlugTouched] = React.useState(false)
  const [active, setActive] = React.useState(true)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [busy, setBusy] = React.useState(false)
  const [wasOpen, setWasOpen] = React.useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setName(category?.name ?? "")
      setSlug(category?.slug ?? "")
      setSlugTouched(!!category)
      setActive(category?.is_active ?? true)
      setErrors({})
      setBusy(false)
    }
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = "Nama wajib diisi."
    else if (existing.some((c) => c.id !== category?.id && c.name.toLowerCase() === name.trim().toLowerCase())) e.name = "Nama kategori sudah dipakai."
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) e.slug = "Gunakan huruf kecil, angka, dan tanda hubung."
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      onOpenChange(false)
      toast.add({ title: category ? "Kategori diubah." : "Kategori ditambahkan.", type: "success" })
    }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Ubah kategori" : "Tambah kategori"}</DialogTitle>
          <DialogDescription>Kategori baru ditaruh di urutan terakhir.</DialogDescription>
        </DialogHeader>
        <form
          id="cat-form"
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <FormField label="Nama" htmlFor="cat-name" required error={errors.name}>
            <Input
              id="cat-name"
              value={name}
              aria-invalid={!!errors.name || undefined}
              onChange={(e) => {
                setName(e.target.value)
                if (!slugTouched) setSlug(slugify(e.target.value))
              }}
            />
          </FormField>
          <FormField label="Slug" htmlFor="cat-slug" required error={errors.slug} description="Terisi otomatis dari nama.">
            <Input
              id="cat-slug"
              value={slug}
              className="font-mono"
              aria-invalid={!!errors.slug || undefined}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
            />
          </FormField>
          <label className="flex items-center justify-between gap-4 border-y py-4">
            <span className="text-xs font-semibold tracking-widest uppercase">Aktif</span>
            <Switch checked={active} onCheckedChange={setActive} />
          </label>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Batal
          </Button>
          <Button type="submit" form="cat-form" data-save disabled={busy}>
            {busy && <Spinner data-icon="inline-start" />}
            {category ? "Simpan" : "Tambah"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
