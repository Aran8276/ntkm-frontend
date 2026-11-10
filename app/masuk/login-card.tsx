"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { IconAlertCircle, IconBuildingStore, IconCircleCheck, IconInfoCircle, IconPlant2 } from "@tabler/icons-react"

import { errorMessage, isApiError } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { homeFor } from "@/components/app/app-shell"
import { useSession } from "@/components/app/providers"
import {
  AuthCard,
  DEV_LOGIN,
  DevLoginForm,
  GoogleButton,
  PasswordLoginForm,
  safeNext,
  signIn,
  useAfterSignIn,
  type Credential,
} from "@/components/app/sign-in"

const DEMO_ACCOUNTS = [
  { email: "rina.wulandari@contoh.id", label: "Rina (toko + UMKM)" },
  { email: "hendra.berkah@contoh.id", label: "Hendra (toko)" },
  { email: "agus.sanan@contoh.id", label: "Agus (UMKM)" },
]

const REASONS: Record<string, string> = {
  expired: "Sesi Anda berakhir, silakan masuk lagi.",
  suspended: "Akun Anda dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.",
}

/** Query string carried between the login, register and forgot-password pages. */
export function authQuery(role: string | null, next: string | null) {
  const sp = new URLSearchParams()
  if (role === "store" || role === "umkm") sp.set("role", role)
  if (next) sp.set("next", next)
  const qs = sp.toString()
  return qs ? `?${qs}` : ""
}

export function RoleNotice({ role, verb }: { role: string | null; verb: string }) {
  if (role !== "store" && role !== "umkm") return null
  return (
    <div className="flex items-center gap-3 bg-muted/70 p-4 text-sm">
      <span className="flex size-9 shrink-0 items-center justify-center bg-background">
        {role === "store" ? <IconBuildingStore className="size-4.5" /> : <IconPlant2 className="size-4.5" />}
      </span>
      Anda akan {verb} sebagai {role === "store" ? "pemilik toko" : "pelaku UMKM"}
    </div>
  )
}

export function LoginCard() {
  const params = useSearchParams()
  const router = useRouter()
  const { me, role: activeRole } = useSession()
  const role = params.get("role")
  const next = safeNext(params.get("next"))
  const reason = params.get("reason")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const finish = useAfterSignIn(role, next)

  // Already signed in → dashboard of the active role.
  React.useEffect(() => {
    if (me && !busy) router.replace(homeFor(me, activeRole))
  }, [me, busy, activeRole, router])

  const run = async (credential: Credential) => {
    setBusy(true)
    setError(null)
    try {
      const res = await signIn("user", credential)
      await finish(res.user)
    } catch (e) {
      setBusy(false)
      if (isApiError(e) && e.code === "account_suspended") setError(REASONS.suspended)
      else if (isApiError(e) && e.code === "invalid_credentials") setError("Email atau kata sandi salah.")
      else if ("id_token" in credential) setError("Gagal masuk dengan Google. Silakan coba lagi.")
      else setError(errorMessage(e, "Gagal masuk. Silakan coba lagi."))
    }
  }

  const qs = authQuery(role, next)

  return (
    <AuthCard title="Masuk" description="Satu akun untuk toko maupun UMKM.">
      <RoleNotice role={role} verb="masuk" />

      {reason === "reset" && !error && (
        <Alert>
          <IconCircleCheck />
          <AlertDescription>Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru.</AlertDescription>
        </Alert>
      )}
      {reason && REASONS[reason] && !error && (
        <Alert>
          <IconInfoCircle />
          <AlertDescription>{REASONS[reason]}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <PasswordLoginForm
        busy={busy}
        onSubmit={(email, password) => void run({ email, password })}
        aside={
          <Link href="/lupa-kata-sandi" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Lupa kata sandi?
          </Link>
        }
      />

      <GoogleButton onCredential={(id_token) => void run({ id_token })} onLoadError={() => undefined} />

      {DEV_LOGIN && <DevLoginForm accounts={DEMO_ACCOUNTS} disabled={busy} onSubmit={(dev_email) => void run({ dev_email })} />}

      <div className="flex flex-col gap-4 border-t pt-6 text-sm text-muted-foreground">
        <p>
          Belum punya akun?{" "}
          <Link href={`/daftar${qs}`} className="font-medium text-foreground underline underline-offset-4">
            Daftar gratis
          </Link>
        </p>
        <Link href="/" className="text-xs font-semibold tracking-widest text-foreground uppercase hover:underline">
          ← Kembali ke beranda
        </Link>
      </div>
    </AuthCard>
  )
}
