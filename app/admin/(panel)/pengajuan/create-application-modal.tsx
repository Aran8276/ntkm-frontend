"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconAlertCircle } from "@tabler/icons-react"

import { formatRupiah } from "@/lib/format"
import { ADMIN_APPLICATIONS, ADMIN_OPPORTUNITIES, ADMIN_PRODUCTS, ADMIN_UMKMS } from "@/lib/admin-mock"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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
import { CharCount } from "@/components/app/inputs"
import { EntityPicker } from "@/components/admin/pickers"
import { umkmOptions } from "@/components/admin/options"
import { ConflictModal } from "@/components/admin/risky-action"

/** Modal "Pengajuan atas nama UMKM" (A15). */
export function CreateApplicationModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter()
  const [umkmId, setUmkmId] = React.useState<string | null>(null)
  const [oppId, setOppId] = React.useState<string | null>(null)
  const [productIds, setProductIds] = React.useState<string[]>([])
  const [note, setNote] = React.useState("")
  const [skip, setSkip] = React.useState(false)
  const [reason, setReason] = React.useState("")
  const [notify, setNotify] = React.useState(true)
  const [problems, setProblems] = React.useState<string[]>([])
  const [conflict, setConflict] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [wasOpen, setWasOpen] = React.useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setUmkmId(null)
      setOppId(null)
      setProductIds([])
      setNote("")
      setSkip(false)
      setReason("")
      setNotify(true)
      setProblems([])
    }
  }

  const umkm = ADMIN_UMKMS.find((u) => u.id === umkmId)
  const opp = ADMIN_OPPORTUNITIES.find((o) => o.id === oppId)
  const products = ADMIN_PRODUCTS.filter((p) => p.umkm.id === umkmId && p.is_active && !p.deleted_at)
  const oppOptions = ADMIN_OPPORTUNITIES.filter((o) => o.status === "open" && !o.deleted_at).map((o) => ({
    value: o.id,
    label: o.title,
    description: `${o.store.name} · sisa kuota ${o.quota_remaining} · maks ${o.max_products_per_umkm} produk/UMKM`,
  }))
  const limit = opp?.max_products_per_umkm ?? 0
  const valid = !!umkmId && !!oppId && productIds.length > 0 && reason.trim().length >= 5 && note.length <= 300

  const submit = () => {
    if (!valid || !opp || !umkm) return
    // 409: already has an active application for this opportunity.
    if (ADMIN_APPLICATIONS.some((a) => a.opportunity.id === opp.id && a.umkm.id === umkm.id && ["submitted", "approved", "in_delivery", "received"].includes(a.status))) {
      setConflict(true)
      return
    }
    // 400: requirement check unless skipped.
    if (!skip) {
      const issues: string[] = []
      for (const p of products.filter((x) => productIds.includes(x.id))) {
        if (!opp.categories.some((c) => c.id === p.category.id)) issues.push(`${p.name}: kategori ${p.category.name} tidak dicari peluang ini.`)
        if (opp.requirements.max_retail_price && p.suggested_retail_price > opp.requirements.max_retail_price)
          issues.push(`${p.name}: harga jual ${formatRupiah(p.suggested_retail_price)} melebihi batas ${formatRupiah(opp.requirements.max_retail_price)}.`)
        if (opp.requirements.min_shelf_life_days && (p.shelf_life_days ?? 0) < opp.requirements.min_shelf_life_days)
          issues.push(`${p.name}: masa simpan kurang dari ${opp.requirements.min_shelf_life_days} hari.`)
      }
      if (opp.requirements.requires_pirt && umkm.legal_verification.pirt.status !== "verified") issues.push("UMKM belum punya PIRT terverifikasi.")
      if (opp.requirements.requires_halal && umkm.legal_verification.halal.status !== "verified") issues.push("UMKM belum punya sertifikat halal terverifikasi.")
      if (issues.length) {
        setProblems(issues)
        return
      }
    }
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      onOpenChange(false)
      toast.add({ title: "Pengajuan dibuat.", type: "success" })
      router.push(`/admin/pengajuan/${ADMIN_APPLICATIONS[0].id}`)
    }, 700)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
        <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Pengajuan atas nama UMKM</DialogTitle>
            <DialogDescription>Admin mengajukan produk UMKM ke peluang yang dibuka.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            {problems.length > 0 && (
              <Alert variant="destructive">
                <IconAlertCircle />
                <AlertDescription>
                  <p className="mb-1 font-medium">Produk tidak memenuhi syarat peluang:</p>
                  <ul className="list-disc pl-4">
                    {problems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <p className="mt-2">Nyalakan “Lewati cek syarat” bila pengajuan tetap perlu dibuat.</p>
                </AlertDescription>
              </Alert>
            )}
            <FormField label="1 · UMKM" required>
              <EntityPicker
                options={umkmOptions}
                value={umkmId}
                onChange={(v) => {
                  setUmkmId(v)
                  setProductIds([])
                  setProblems([])
                }}
                placeholder="Cari nama usaha…"
              />
            </FormField>
            <FormField label="2 · Peluang" required description="Hanya peluang yang dibuka.">
              <EntityPicker
                options={oppOptions}
                value={oppId}
                onChange={(v) => {
                  setOppId(v)
                  setProductIds([])
                  setProblems([])
                }}
                placeholder="Cari judul peluang…"
              />
            </FormField>
            <FormField label="3 · Produk" required description={opp ? `Maksimal ${limit} produk.` : "Pilih UMKM dan peluang dulu."}>
              {umkm && opp ? (
                products.length ? (
                  <div className="flex flex-col divide-y border-y">
                    {products.map((p) => {
                      const checked = productIds.includes(p.id)
                      const disabled = !checked && productIds.length >= limit
                      return (
                        <Label key={p.id} className="flex items-center gap-3 py-3 normal-case" data-disabled={disabled || undefined}>
                          <Checkbox
                            checked={checked}
                            disabled={disabled}
                            onCheckedChange={(v) => {
                              setProblems([])
                              setProductIds((prev) => (v ? [...prev, p.id] : prev.filter((x) => x !== p.id)))
                            }}
                          />
                          <span className="flex flex-1 flex-col text-sm font-normal tracking-normal">
                            {p.name}
                            <span className="text-xs text-muted-foreground">
                              {p.category.name} · setor {formatRupiah(p.base_price)} · jual {formatRupiah(p.suggested_retail_price)}
                            </span>
                          </span>
                        </Label>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">UMKM ini belum punya produk aktif.</p>
                )
              ) : (
                <p className="bg-muted/60 px-4 py-4 text-center text-sm text-muted-foreground">—</p>
              )}
            </FormField>
            <FormField label="4 · Catatan untuk toko" htmlFor="ca-note" aside={<CharCount value={note} max={300} />}>
              <Textarea id="ca-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-16" />
            </FormField>
            <label className="flex items-start justify-between gap-4 border-y py-4">
              <span className="flex flex-col gap-1">
                <span className="text-sm font-medium">5 · Lewati cek syarat legalitas, masa simpan, dan harga</span>
                <span className="text-xs text-muted-foreground">Kuota dan kepemilikan produk tetap dicek.</span>
              </span>
              <Switch checked={skip} onCheckedChange={(v) => { setSkip(v); setProblems([]) }} />
            </label>
            <FormField label="6 · Alasan" htmlFor="ca-reason" required description="Minimal 5 karakter. Tercatat di audit log.">
              <Textarea id="ca-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-16" placeholder="Mis. UMKM tidak punya HP Android, pengajuan diwakilkan pendamping." />
            </FormField>
            <Label className="flex items-center gap-2.5 normal-case">
              <Checkbox checked={notify} onCheckedChange={(v) => setNotify(!!v)} />
              <span className="text-sm font-normal tracking-normal">Beri tahu toko dan UMKM</span>
            </Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Batal
            </Button>
            <Button data-save disabled={!valid || busy} onClick={submit}>
              {busy && <Spinner data-icon="inline-start" />}
              Buat pengajuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConflictModal
        open={conflict}
        onOpenChange={setConflict}
        message="UMKM ini sudah punya pengajuan aktif untuk peluang tersebut."
        links={ADMIN_APPLICATIONS.filter((a) => a.opportunity.id === oppId && a.umkm.id === umkmId).map((a) => ({
          label: `Pengajuan ${a.id.slice(0, 8)}`,
          href: `/admin/pengajuan/${a.id}`,
        }))}
      />
    </>
  )
}
