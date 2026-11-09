"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { IconAlertCircle, IconBuildingStore, IconInfoCircle, IconPlant2 } from "@tabler/icons-react"

import { api, isApiError } from "@/lib/api"
import type { Me, Role } from "@/lib/types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Logo } from "@/components/app/logo"
import { homeFor } from "@/components/app/app-shell"
import { useSession } from "@/components/app/providers"
import { DEV_LOGIN, DevLoginForm, GOOGLE_CLIENT_ID, GoogleButton, signIn } from "@/components/app/sign-in"

const DEMO_ACCOUNTS = [
  { email: "rina.wulandari@contoh.id", label: "Rina (toko + UMKM)" },
  { email: "hendra.berkah@contoh.id", label: "Hendra (toko)" },
  { email: "agus.sanan@contoh.id", label: "Agus (UMKM)" },
]

const REASONS: Record<string, string> = {
  expired: "Sesi Anda berakhir, silakan masuk lagi.",
  suspended: "Akun Anda dinonaktifkan. Hubungi admin untuk informasi lebih lanjut.",
}

/** Only same-origin app paths are allowed as `next`. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/admin") ? next : null
}

/** Official multi-colour Google "G" (also used by the admin login, A01). */
export function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

export function LoginCard() {
  const params = useSearchParams()
  const router = useRouter()
  const { me, role: activeRole, setRole, reloadMe } = useSession()
  const role = params.get("role")
  const next = safeNext(params.get("next"))
  const reason = params.get("reason")
  const [state, setState] = React.useState<"idle" | "loading" | "error" | "popup" | "suspended">(
    params.get("error") === "popup" ? "popup" : params.get("error") ? "error" : "idle"
  )

  // Already signed in → dashboard of the active role.
  const busy = state === "loading"
  React.useEffect(() => {
    if (me && !busy) router.replace(homeFor(me, activeRole))
  }, [me, busy, activeRole, router])

  const finish = async (user: Me) => {
    // Spec P02 flow: roles empty + ?role → PUT /me/roles → onboarding; empty → P03;
    // onboarding unfinished → P04/P05; otherwise ?next or the active dashboard.
    if (!user.roles.length && (role === "store" || role === "umkm")) {
      await api.put("/me/roles", { roles: [role] })
      setRole(role as Role)
      await reloadMe()
      router.replace(role === "store" ? "/onboarding/toko" : "/onboarding/umkm")
      return
    }
    if (user.roles.length === 1) setRole(user.roles[0])
    const home = homeFor(user, activeRole)
    router.replace(next && !home.startsWith("/onboarding") && home !== "/pilih-peran" ? next : home)
  }

  const run = async (credential: { id_token: string } | { email: string }) => {
    setState("loading")
    try {
      const res = await signIn("user", credential)
      await finish(res.user)
    } catch (e) {
      setState(isApiError(e) && e.code === "account_suspended" ? "suspended" : "error")
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-8 bg-background p-8 shadow-sm ring-1 ring-foreground/5 sm:p-10">
      <Logo />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-wider uppercase">Masuk</h1>
        <p className="text-sm text-muted-foreground">Satu akun Google untuk toko maupun UMKM.</p>
      </div>

      {(role === "store" || role === "umkm") && (
        <div className="flex items-center gap-3 bg-muted/70 p-4 text-sm">
          <span className="flex size-9 items-center justify-center bg-background">
            {role === "store" ? <IconBuildingStore className="size-4.5" /> : <IconPlant2 className="size-4.5" />}
          </span>
          Anda akan masuk sebagai {role === "store" ? "pemilik toko" : "pelaku UMKM"}
        </div>
      )}

      {reason && REASONS[reason] && state === "idle" && (
        <Alert>
          <IconInfoCircle />
          <AlertDescription>{REASONS[reason]}</AlertDescription>
        </Alert>
      )}

      {(state === "error" || state === "popup" || state === "suspended") && (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertDescription>
            {state === "popup"
              ? "Izinkan pop-up untuk masuk dengan Google."
              : state === "suspended"
                ? REASONS.suspended
                : "Gagal masuk dengan Google. Silakan coba lagi."}
          </AlertDescription>
        </Alert>
      )}

      {state === "loading" ? (
        <div className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#1f1f1f]">
          <Spinner className="size-4" />
          Sedang masuk…
        </div>
      ) : GOOGLE_CLIENT_ID ? (
        <GoogleButton onCredential={(id_token) => run({ id_token })} onLoadError={() => setState("popup")} />
      ) : (
        <div className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#1f1f1f] opacity-60">
          <GoogleMark />
          Masuk dengan Google belum dikonfigurasi
        </div>
      )}

      {DEV_LOGIN && <DevLoginForm accounts={DEMO_ACCOUNTS} disabled={state === "loading"} onSubmit={(email) => run({ email })} />}

      <div className="flex flex-col gap-4 border-t pt-6 text-sm text-muted-foreground">
        <p>
          Dengan masuk, Anda menyetujui{" "}
          <Link href="/syarat-ketentuan" className="text-foreground underline underline-offset-4">
            Syarat & Ketentuan
          </Link>{" "}
          dan{" "}
          <Link href="/kebijakan-privasi" className="text-foreground underline underline-offset-4">
            Kebijakan Privasi
          </Link>
          .
        </p>
        <Link href="/" className="text-xs font-semibold tracking-widest text-foreground uppercase hover:underline">
          ← Kembali ke beranda
        </Link>
      </div>
    </div>
  )
}
