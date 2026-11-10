"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { IconAlertCircle, IconInfoCircle } from "@tabler/icons-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { clearTokens, errorMessage, isApiError } from "@/lib/api"
import { clearCache, useApi, useSessionPresent } from "@/lib/use-api"
import type { Me } from "@/lib/types"
import {
  AuthCard,
  DEV_LOGIN,
  DevLoginForm,
  GoogleButton,
  PasswordLoginForm,
  signIn,
  type Credential,
} from "@/components/app/sign-in"

const DEMO_ADMINS = [
  { email: "admin@ritelhub.local", label: "Superadmin" },
  { email: "nadia@ritelhub.local", label: "Staff" },
]

function safeNext(next: string | null) {
  return next && next.startsWith("/admin") && !next.startsWith("/admin/masuk") ? next : null
}

const REASONS: Record<string, { text: string; tone: "danger" | "info" }> = {
  not_admin: { text: "Akun ini tidak memiliki akses admin.", tone: "danger" },
  suspended: { text: "Akun Anda dinonaktifkan.", tone: "danger" },
  expired: { text: "Sesi berakhir, silakan masuk lagi.", tone: "info" },
  idle: { text: "Anda keluar otomatis karena tidak ada aktivitas selama 30 menit.", tone: "info" },
}

/** A01 · Masuk admin. */
export function AdminLoginCard() {
  const params = useSearchParams()
  const router = useRouter()
  const next = safeNext(params.get("next"))
  const [reason, setReason] = React.useState(params.get("reason"))
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const msg = reason ? REASONS[reason] : null

  // Admin already signed in → A02.
  const present = useSessionPresent("admin")
  const meQ = useApi<Me>("admin", present && !busy ? "/me" : null)
  React.useEffect(() => {
    if (meQ.data?.is_admin) router.replace(next ?? "/admin")
  }, [meQ.data, next, router])

  const run = async (credential: Credential) => {
    setBusy(true)
    setReason(null)
    setError(null)
    try {
      const res = await signIn("admin", credential)
      if (!res.user.is_admin) {
        clearTokens("admin")
        clearCache("admin")
        setReason("not_admin")
        setBusy(false)
        return
      }
      router.replace(next ?? "/admin")
    } catch (e) {
      setBusy(false)
      if (isApiError(e) && e.code === "account_suspended") setReason("suspended")
      else if (isApiError(e) && e.code === "invalid_credentials") setError("Email atau kata sandi salah.")
      else setError(errorMessage(e, "Gagal masuk. Coba lagi."))
    }
  }

  return (
    <AuthCard title="Panel Admin" description="Khusus pengelola platform." badge="Admin" logoHref={null}>
      {msg && (
        <Alert variant={msg.tone === "danger" ? "destructive" : "default"}>
          {msg.tone === "danger" ? <IconAlertCircle /> : <IconInfoCircle />}
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PasswordLoginForm busy={busy} onSubmit={(email, password) => void run({ email, password })} />

      <GoogleButton onCredential={(id_token) => void run({ id_token })} />

      {DEV_LOGIN && <DevLoginForm accounts={DEMO_ADMINS} disabled={busy} onSubmit={(dev_email) => void run({ dev_email })} />}

      <div className="border-t pt-6">
        <Link href="/" className="text-xs font-semibold tracking-widest uppercase hover:underline">
          Buka aplikasi pengguna →
        </Link>
      </div>
    </AuthCard>
  )
}
