"use client"

import * as React from "react"

import { api, errorMessage, isApiError, setTokens } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { Section } from "@/components/app/blocks"
import { FormField } from "@/components/app/form-field"
import { useSession } from "@/components/app/providers"
import { PASSWORD_HINT, PasswordInput, passwordProblem } from "@/components/app/sign-in"

type Errors = Partial<Record<"current" | "password" | "confirm" | "form", string>>

/** Ubah (atau buat) kata sandi: `POST /me/password`. */
export function PasswordSection() {
  const { me, reloadMe } = useSession()
  // Accounts without a password (invited, Google-only) set their first one without the current password.
  const hasPassword = me?.has_password !== false
  const [open, setOpen] = React.useState(false)
  const [current, setCurrent] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [errors, setErrors] = React.useState<Errors>({})
  const [busy, setBusy] = React.useState(false)

  const close = () => {
    setOpen(false)
    setCurrent("")
    setPassword("")
    setConfirm("")
    setErrors({})
  }

  const submit = async () => {
    const found: Errors = {}
    if (hasPassword && !current) found.current = "Masukkan kata sandi saat ini."
    const problem = passwordProblem(password)
    if (problem) found.password = problem
    else if (confirm !== password) found.confirm = "Kata sandi tidak sama."
    else if (hasPassword && password === current) found.password = "Kata sandi baru harus berbeda dari yang lama."
    setErrors(found)
    if (Object.keys(found).length) return

    setBusy(true)
    try {
      const res = await api.post<{ access?: string; refresh?: string } | undefined>("/me/password", {
        ...(hasPassword ? { current_password: current } : {}),
        new_password: password,
      })
      // Other sessions are signed out; keep this one if the server issued fresh tokens.
      if (res?.access && res.refresh) setTokens("user", { access: res.access, refresh: res.refresh })
      close()
      toast.add({
        title: hasPassword ? "Kata sandi diubah" : "Kata sandi dibuat",
        description: "Perangkat lain yang masih masuk akan keluar otomatis.",
        type: "success",
      })
      void reloadMe()
    } catch (e) {
      if (isApiError(e) && e.code === "invalid_credentials") setErrors({ current: "Kata sandi saat ini salah." })
      else if (isApiError(e) && e.code === "validation_error") {
        const next: Errors = { current: e.field("current_password"), password: e.field("new_password") }
        setErrors(next.current || next.password ? next : { form: errorMessage(e, "Periksa kembali isian Anda.") })
      } else setErrors({ form: errorMessage(e, "Gagal menyimpan kata sandi. Coba lagi.") })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section
      title="Kata sandi"
      description={
        hasPassword
          ? "Dipakai bersama email Anda untuk masuk."
          : "Akun ini belum punya kata sandi. Buat kata sandi agar bisa masuk dengan email."
      }
      action={
        !open && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            {hasPassword ? "Ubah" : "Buat"}
          </Button>
        )
      }
    >
      {open && (
        <form
          noValidate
          className="flex max-w-md flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          {errors.form && <p className="bg-destructive/10 px-4 py-3 text-sm text-destructive">{errors.form}</p>}
          {hasPassword && (
            <FormField label="Kata sandi saat ini" htmlFor="pw-current" error={errors.current}>
              <PasswordInput
                id="pw-current"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                aria-invalid={!!errors.current || undefined}
                disabled={busy}
              />
            </FormField>
          )}
          <FormField label="Kata sandi baru" htmlFor="pw-new" error={errors.password} description={PASSWORD_HINT}>
            <PasswordInput
              id="pw-new"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password || undefined}
              disabled={busy}
            />
          </FormField>
          <FormField label="Ulangi kata sandi baru" htmlFor="pw-confirm" error={errors.confirm}>
            <PasswordInput
              id="pw-confirm"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={!!errors.confirm || undefined}
              disabled={busy}
            />
          </FormField>
          <div className="flex gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan kata sandi"}
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={close}>
              Batal
            </Button>
          </div>
        </form>
      )}
    </Section>
  )
}
