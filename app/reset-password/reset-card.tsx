"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { IconAlertCircle } from "@tabler/icons-react"

import { clearTokens, errorMessage, isApiError, request } from "@/lib/api"
import { clearCache } from "@/lib/use-api"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { FormField } from "@/components/app/form-field"
import { AuthCard, PASSWORD_HINT, PasswordInput, SubmitButton, passwordProblem } from "@/components/app/sign-in"

/** Buat kata sandi baru dari tautan email (`POST /auth/password/reset`). */
export function ResetCard() {
  const params = useSearchParams()
  const router = useRouter()
  const uid = params.get("uid")
  const token = params.get("token")

  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [errors, setErrors] = React.useState<{ password?: string; confirm?: string }>({})
  const [error, setError] = React.useState<string | null>(null)
  const [invalidLink, setInvalidLink] = React.useState(false)
  const [busy, setBusy] = React.useState(false)

  const submit = async () => {
    const found: typeof errors = {}
    const problem = passwordProblem(password)
    if (problem) found.password = problem
    else if (confirm !== password) found.confirm = "Kata sandi tidak sama."
    setErrors(found)
    setError(null)
    if (Object.keys(found).length) return

    setBusy(true)
    try {
      await request("user", "/auth/password/reset", {
        method: "POST",
        body: { uid, token, new_password: password },
        anonymous: true,
      })
      // The reset signs every session out on the server; drop the local one too.
      clearTokens("user")
      clearCache("user")
      router.replace("/masuk?reason=reset")
    } catch (e) {
      setBusy(false)
      if (isApiError(e) && (e.isNetwork || e.code === "rate_limited" || e.code === "server_error")) {
        setError(errorMessage(e))
        return
      }
      const passwordError = isApiError(e) ? (e.field("new_password") ?? e.field("password")) : undefined
      if (passwordError) setErrors({ password: passwordError })
      else setInvalidLink(true)
    }
  }

  if (!uid || !token || invalidLink)
    return (
      <AuthCard title="Tautan tidak berlaku">
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertDescription>
            Tautan atur ulang kata sandi ini tidak lengkap, sudah dipakai, atau sudah lewat 60 menit. Minta tautan baru untuk
            melanjutkan.
          </AlertDescription>
        </Alert>
        <Link href="/lupa-kata-sandi" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          Minta tautan baru
        </Link>
        <div className="border-t pt-6">
          <Link href="/masuk" className="text-xs font-semibold tracking-widest uppercase hover:underline">
            ← Kembali ke halaman masuk
          </Link>
        </div>
      </AuthCard>
    )

  return (
    <AuthCard title="Kata sandi baru" description="Buat kata sandi baru untuk akun Anda. Semua perangkat lain akan keluar otomatis.">
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
        <FormField label="Kata sandi baru" htmlFor="reset-password" error={errors.password} description={PASSWORD_HINT}>
          <PasswordInput
            id="reset-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password || undefined}
            disabled={busy}
          />
        </FormField>
        <FormField label="Ulangi kata sandi baru" htmlFor="reset-confirm" error={errors.confirm}>
          <PasswordInput
            id="reset-confirm"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={!!errors.confirm || undefined}
            disabled={busy}
          />
        </FormField>
        <SubmitButton busy={busy}>{busy ? "Menyimpan…" : "Simpan kata sandi"}</SubmitButton>
      </form>
    </AuthCard>
  )
}
