"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { IconAlertCircle, IconInfoCircle } from "@tabler/icons-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Logo } from "@/components/app/logo"
import { GoogleMark } from "@/app/masuk/login-card"
import { clearTokens, isApiError } from "@/lib/api"
import { clearCache, useApi, useSessionPresent } from "@/lib/use-api"
import type { Me } from "@/lib/types"
import { DEV_LOGIN, DevLoginForm, GOOGLE_CLIENT_ID, GoogleButton, signIn } from "@/components/app/sign-in"

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
  const [state, setState] = React.useState<"idle" | "loading" | "error">("idle")
  const msg = reason ? REASONS[reason] : null

  // Admin already signed in → A02.
  const present = useSessionPresent("admin")
  const meQ = useApi<Me>("admin", present && state !== "loading" ? "/me" : null)
  React.useEffect(() => {
    if (meQ.data?.is_admin) router.replace(next ?? "/admin")
  }, [meQ.data, next, router])

  const run = async (credential: { id_token: string } | { email: string }) => {
    setState("loading")
    setReason(null)
    try {
      const res = await signIn("admin", credential)
      if (!res.user.is_admin) {
        clearTokens("admin")
        clearCache("admin")
        setReason("not_admin")
        setState("idle")
        return
      }
      router.replace(next ?? "/admin")
    } catch (e) {
      if (isApiError(e) && e.code === "account_suspended") {
        setReason("suspended")
        setState("idle")
      } else setState("error")
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-8 bg-background p-8 shadow-sm ring-1 ring-foreground/5 sm:p-10">
      <div className="flex items-center gap-2">
        <Logo href={null} />
        <span className="bg-foreground px-1.5 py-0.5 text-[0.5625rem] font-semibold tracking-widest text-background uppercase">
          Admin
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-wider uppercase">Panel Admin</h1>
        <p className="text-sm text-muted-foreground">Khusus pengelola platform.</p>
      </div>

      {msg && (
        <Alert variant={msg.tone === "danger" ? "destructive" : "default"}>
          {msg.tone === "danger" ? <IconAlertCircle /> : <IconInfoCircle />}
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      )}
      {state === "error" && (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertDescription>Gagal masuk dengan Google. Coba lagi.</AlertDescription>
        </Alert>
      )}

      {state === "loading" ? (
        <div className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#1f1f1f]">
          <Spinner className="size-4" />
          Sedang masuk…
        </div>
      ) : GOOGLE_CLIENT_ID ? (
        <GoogleButton onCredential={(id_token) => run({ id_token })} onLoadError={() => setState("error")} />
      ) : (
        <div className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#1f1f1f] opacity-60">
          <GoogleMark />
          Masuk dengan Google belum dikonfigurasi
        </div>
      )}

      {DEV_LOGIN && <DevLoginForm accounts={DEMO_ADMINS} disabled={state === "loading"} onSubmit={(email) => run({ email })} />}

      <div className="border-t pt-6">
        <Link href="/" className="text-xs font-semibold tracking-widest uppercase hover:underline">
          Buka aplikasi pengguna →
        </Link>
      </div>
    </div>
  )
}
