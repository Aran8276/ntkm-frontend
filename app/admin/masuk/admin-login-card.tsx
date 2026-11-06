"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { IconAlertCircle, IconInfoCircle } from "@tabler/icons-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Logo } from "@/components/app/logo"
import { GoogleMark } from "@/app/masuk/login-card"

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
  const next = params.get("next")
  const [reason, setReason] = React.useState(params.get("reason"))
  const [state, setState] = React.useState<"idle" | "loading" | "error">("idle")
  const msg = reason ? REASONS[reason] : null

  const signIn = () => {
    setState("loading")
    setReason(null)
    // Mock: id_token → POST /auth/google → GET /me (is_admin) → next or A02.
    setTimeout(() => router.push(next && next.startsWith("/admin") ? next : "/admin"), 900)
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

      <button
        type="button"
        onClick={signIn}
        disabled={state === "loading"}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#1f1f1f] transition-colors outline-none hover:bg-[#f8faff] focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-70"
      >
        {state === "loading" ? (
          <>
            <Spinner className="size-4" />
            Sedang masuk…
          </>
        ) : (
          <>
            <GoogleMark />
            Masuk dengan Google
          </>
        )}
      </button>

      <div className="border-t pt-6">
        <Link href="/" className="text-xs font-semibold tracking-widest uppercase hover:underline">
          Buka aplikasi pengguna →
        </Link>
      </div>
    </div>
  )
}
