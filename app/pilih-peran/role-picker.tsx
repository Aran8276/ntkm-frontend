"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import { Spinner } from "@/components/ui/spinner"
import { Logo } from "@/components/app/logo"

const OPTIONS = [
  { value: "store", title: "Pemilik toko", desc: "Cari produk UMKM lokal untuk rak toko Anda." },
  { value: "umkm", title: "Pelaku UMKM", desc: "Titipkan produk Anda di toko ritel terdekat." },
  { value: "both", title: "Keduanya", desc: "Saya punya toko dan juga memproduksi barang." },
] as const

type Choice = (typeof OPTIONS)[number]["value"]

export function RolePicker() {
  const params = useSearchParams()
  const router = useRouter()
  const fromProfile = params.get("dari") === "profil"
  const preset = params.get("pilih") as Choice | null
  const [value, setValue] = React.useState<Choice | null>(preset ?? (fromProfile ? "both" : null))
  const [saving, setSaving] = React.useState(false)

  const submit = () => {
    setSaving(true)
    // Mock: PUT /me/roles → GET /me → first unfinished onboarding.
    setTimeout(() => {
      if (fromProfile) {
        toast.add({ title: "Peran diperbarui.", type: "success" })
        router.push("/profil")
      } else router.push(value === "umkm" ? "/onboarding/umkm" : "/onboarding/toko")
    }, 700)
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-8 bg-background p-8 shadow-sm ring-1 ring-foreground/5 sm:p-10">
      <Logo href={null} />
      <div className="flex flex-col gap-2">
        <h1 className="text-xl leading-snug font-semibold tracking-wider uppercase">
          Anda ingin memakai aplikasi sebagai apa?
        </h1>
        <p className="text-sm text-muted-foreground">Bisa diubah kapan saja di Profil.</p>
      </div>

      <RadioGroup value={value} onValueChange={(v) => setValue(v as Choice)} aria-label="Peran">
        {OPTIONS.map((o) => (
          <FieldLabel key={o.value} htmlFor={`role-${o.value}`}>
            <Field orientation="horizontal">
              <RadioGroupItem value={o.value} id={`role-${o.value}`} />
              <FieldContent>
                <FieldTitle>{o.title}</FieldTitle>
                <FieldDescription>{o.desc}</FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>

      <Button size="lg" disabled={!value || saving} onClick={submit}>
        {saving ? (
          <>
            <Spinner data-icon="inline-start" /> Menyimpan…
          </>
        ) : (
          "Lanjutkan"
        )}
      </Button>
    </div>
  )
}
