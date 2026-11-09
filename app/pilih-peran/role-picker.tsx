"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field"
import { toast } from "@/components/ui/toast"
import { Spinner } from "@/components/ui/spinner"
import { Logo } from "@/components/app/logo"
import { api } from "@/lib/api"
import { useHydrated } from "@/lib/use-api"
import type { Me, Role } from "@/lib/types"
import { homeFor } from "@/components/app/app-shell"
import { handleApiError } from "@/components/app/feedback"
import { useSession } from "@/components/app/providers"

const OPTIONS = [
  { value: "store", title: "Pemilik toko", desc: "Cari produk UMKM lokal untuk rak toko Anda." },
  { value: "umkm", title: "Pelaku UMKM", desc: "Titipkan produk Anda di toko ritel terdekat." },
  { value: "both", title: "Keduanya", desc: "Saya punya toko dan juga memproduksi barang." },
] as const

type Choice = (typeof OPTIONS)[number]["value"]

const ROLES: Record<Choice, Role[]> = { store: ["store"], umkm: ["umkm"], both: ["store", "umkm"] }

function currentChoice(me: Me | undefined): Choice | null {
  const r = me?.roles ?? []
  if (r.includes("store") && r.includes("umkm")) return "both"
  return r[0] ?? null
}

/** P03 · Pilih peran: `PUT /me/roles` → `GET /me` → first unfinished onboarding. */
export function RolePicker() {
  const params = useSearchParams()
  const router = useRouter()
  const hydrated = useHydrated()
  const { signedIn, me, role, setRole, reloadMe } = useSession()
  const fromProfile = params.get("dari") === "profil"
  const preset = params.get("pilih") as Choice | null
  const [draft, setDraft] = React.useState<Choice | null>(null)
  const value = draft ?? preset ?? currentChoice(me)
  const [saving, setSaving] = React.useState(false)

  // Guard: login required; users who already have roles go to their dashboard
  // (unless they came from Profil to change roles).
  const redirect = !hydrated ? null : !signedIn ? "/masuk?next=/pilih-peran" : me && me.roles.length && !fromProfile ? homeFor(me, role) : null
  React.useEffect(() => {
    if (redirect) router.replace(redirect)
  }, [redirect, router])

  const submit = async () => {
    if (!value) return
    setSaving(true)
    try {
      const roles = ROLES[value]
      await api.put("/me/roles", { roles })
      await reloadMe()
      const fresh = await api.get<Me>("/me")
      if (roles.length === 1) setRole(roles[0])
      if (fromProfile) {
        toast.add({ title: "Peran diperbarui.", type: "success" })
        const pending = fresh.roles.find((r) => !(r === "store" ? fresh.onboarding.store_completed : fresh.onboarding.umkm_completed))
        router.push(pending ? (pending === "store" ? "/onboarding/toko" : "/onboarding/umkm") : "/profil")
      } else router.push(homeFor(fresh, roles[0]))
    } catch (e) {
      setSaving(false)
      // 409: a role with active applications cannot be removed — keep the previous choice.
      setDraft(null)
      handleApiError(e, { conflictTitle: "Peran tidak bisa diubah" })
    }
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

      <RadioGroup value={value} onValueChange={(v) => setDraft(v as Choice)} aria-label="Peran">
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

      <Button size="lg" disabled={!value || saving || !me} onClick={() => void submit()}>
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
