"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { IconAlertCircle, IconBuildingStore, IconPlant2 } from "@tabler/icons-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Logo } from "@/components/app/logo"

function GoogleMark() {
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
  const role = params.get("role")
  const next = params.get("next")
  const [state, setState] = React.useState<"idle" | "loading" | "error" | "popup">(
    params.get("error") === "popup" ? "popup" : params.get("error") ? "error" : "idle"
  )

  const signIn = () => {
    setState("loading")
    // Mock: POST /auth/google → route per spec flow.
    setTimeout(() => {
      if (next) router.push(next)
      else if (role === "store") router.push("/onboarding/toko")
      else if (role === "umkm") router.push("/onboarding/umkm")
      else router.push("/pilih-peran")
    }, 900)
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

      {(state === "error" || state === "popup") && (
        <Alert variant="destructive">
          <IconAlertCircle />
          <AlertDescription>
            {state === "popup"
              ? "Izinkan pop-up untuk masuk dengan Google."
              : "Gagal masuk dengan Google. Silakan coba lagi."}
          </AlertDescription>
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
