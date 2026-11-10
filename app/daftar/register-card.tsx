"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { IconAlertCircle } from "@tabler/icons-react"

import { errorMessage, isApiError } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/app/form-field"
import { homeFor } from "@/components/app/app-shell"
import { useSession } from "@/components/app/providers"
import {
  AuthCard,
  PASSWORD_HINT,
  PasswordInput,
  SubmitButton,
  passwordProblem,
  register,
  safeNext,
  useAfterSignIn,
} from "@/components/app/sign-in"
import { RoleNotice, authQuery } from "@/app/masuk/login-card"

type Errors = Partial<Record<"name" | "email" | "password" | "confirm", string>>

/** Daftar dengan email dan kata sandi (`POST /auth/register`). */
export function RegisterCard() {
  const params = useSearchParams()
  const router = useRouter()
  const { me, role: activeRole } = useSession()
  const role = params.get("role")
  const next = safeNext(params.get("next"))
  const finish = useAfterSignIn(role, next)

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [errors, setErrors] = React.useState<Errors>({})
  const [error, setError] = React.useState<React.ReactNode>(null)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (me && !busy) router.replace(homeFor(me, activeRole))
  }, [me, busy, activeRole, router])

  const qs = authQuery(role, next)

  const submit = async () => {
    const found: Errors = {}
    if (!name.trim()) found.name = "Masukkan nama Anda."
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) found.email = "Masukkan alamat email yang benar."
    const problem = passwordProblem(password)
    if (problem) found.password = problem
    if (!found.password && confirm !== password) found.confirm = "Kata sandi tidak sama."
    setErrors(found)
    setError(null)
    if (Object.keys(found).length) return

    setBusy(true)
    try {
      const res = await register({ email: email.trim().toLowerCase(), password, name: name.trim() })
      await finish(res.user)
    } catch (e) {
      setBusy(false)
      if (isApiError(e) && e.code === "email_taken") {
        setErrors({ email: "Email ini sudah terdaftar." })
        setError(
          <>
            Email ini sudah terdaftar.{" "}
            <Link href={`/masuk${qs}`} className="underline underline-offset-4">
              Masuk
            </Link>{" "}
            atau{" "}
            <Link href="/lupa-kata-sandi" className="underline underline-offset-4">
              atur ulang kata sandi
            </Link>
            .
          </>
        )
      } else if (isApiError(e) && e.code === "validation_error") {
        const fields = e.fieldErrors()
        const mapped: Errors = { name: fields.name, email: fields.email, password: fields.password }
        setErrors(mapped)
        if (!mapped.name && !mapped.email && !mapped.password) setError(errorMessage(e, "Periksa kembali isian Anda."))
      } else setError(errorMessage(e, "Gagal mendaftar. Silakan coba lagi."))
    }
  }

  return (
    <AuthCard title="Daftar" description="Gratis. Satu akun untuk toko maupun UMKM.">
      <RoleNotice role={role} verb="mendaftar" />

      {error && (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <FormField label="Nama lengkap" htmlFor="reg-name" error={errors.name}>
          <Input
            id="reg-name"
            autoComplete="name"
            maxLength={150}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name || undefined}
            disabled={busy}
          />
        </FormField>
        <FormField label="Email" htmlFor="reg-email" error={errors.email}>
          <Input
            id="reg-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email || undefined}
            disabled={busy}
          />
        </FormField>
        <FormField label="Kata sandi" htmlFor="reg-password" error={errors.password} description={PASSWORD_HINT}>
          <PasswordInput
            id="reg-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password || undefined}
            disabled={busy}
          />
        </FormField>
        <FormField label="Ulangi kata sandi" htmlFor="reg-confirm" error={errors.confirm}>
          <PasswordInput
            id="reg-confirm"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={!!errors.confirm || undefined}
            disabled={busy}
          />
        </FormField>
        <SubmitButton busy={busy}>{busy ? "Membuat akun…" : "Buat akun"}</SubmitButton>
      </form>

      <div className="flex flex-col gap-4 border-t pt-6 text-sm text-muted-foreground">
        <p>
          Sudah punya akun?{" "}
          <Link href={`/masuk${qs}`} className="font-medium text-foreground underline underline-offset-4">
            Masuk
          </Link>
        </p>
        <Link href="/" className="text-xs font-semibold tracking-widest text-foreground uppercase hover:underline">
          ← Kembali ke beranda
        </Link>
      </div>
    </AuthCard>
  )
}
