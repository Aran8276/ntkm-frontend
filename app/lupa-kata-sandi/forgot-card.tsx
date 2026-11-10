"use client"

import * as React from "react"
import Link from "next/link"
import { IconAlertCircle, IconMailCheck } from "@tabler/icons-react"

import { errorMessage, request } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/app/form-field"
import { AuthCard, SubmitButton } from "@/components/app/sign-in"

/** Minta tautan atur ulang kata sandi (`POST /auth/password/forgot`). */
export function ForgotCard() {
  const [email, setEmail] = React.useState("")
  const [fieldError, setFieldError] = React.useState<string>()
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [sentTo, setSentTo] = React.useState<string | null>(null)

  const submit = async () => {
    const value = email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setFieldError("Masukkan alamat email yang benar.")
      return
    }
    setFieldError(undefined)
    setError(null)
    setBusy(true)
    try {
      await request("user", "/auth/password/forgot", { method: "POST", body: { email: value }, anonymous: true })
      setSentTo(value)
    } catch (e) {
      setError(errorMessage(e, "Gagal mengirim tautan. Silakan coba lagi."))
    } finally {
      setBusy(false)
    }
  }

  const back = (
    <div className="border-t pt-6">
      <Link href="/masuk" className="text-xs font-semibold tracking-widest uppercase hover:underline">
        ← Kembali ke halaman masuk
      </Link>
    </div>
  )

  if (sentTo)
    return (
      <AuthCard title="Periksa email Anda">
        <Alert>
          <IconMailCheck />
          <AlertDescription>
            Jika <span className="font-medium text-foreground">{sentTo}</span> terdaftar, kami sudah mengirim tautan untuk
            mengatur ulang kata sandi. Tautan berlaku 60 menit dan hanya bisa dipakai sekali.
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Belum menerima email? Periksa folder spam, atau{" "}
          <button type="button" onClick={() => setSentTo(null)} className="text-foreground underline underline-offset-4">
            kirim ulang
          </button>
          .
        </p>
        {back}
      </AuthCard>
    )

  return (
    <AuthCard title="Lupa kata sandi" description="Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat kata sandi baru.">
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
        <FormField label="Email" htmlFor="forgot-email" error={fieldError}>
          <Input
            id="forgot-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!fieldError || undefined}
            disabled={busy}
          />
        </FormField>
        <SubmitButton busy={busy}>{busy ? "Mengirim…" : "Kirim tautan"}</SubmitButton>
      </form>
      {back}
    </AuthCard>
  )
}
