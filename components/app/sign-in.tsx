"use client"

import * as React from "react"
import { IconLogin2 } from "@tabler/icons-react"

import { request, setTokens, type Scope } from "@/lib/api"
import { mutate } from "@/lib/use-api"
import type { Me } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""
/** Local testing without Google: `POST /auth/dev-login` (backend needs DEBUG + AUTH_DEV_LOGIN). */
export const DEV_LOGIN = process.env.NEXT_PUBLIC_DEV_LOGIN === "true" || !GOOGLE_CLIENT_ID

interface AuthResponse {
  access: string
  refresh: string
  is_new_user: boolean
  user: Me
}

/** Exchange a Google `id_token` (or a dev-login email) for tokens and cache `GET /me`. */
export async function signIn(scope: Scope, credential: { id_token: string } | { email: string }) {
  const path = "id_token" in credential ? "/auth/google" : "/auth/dev-login"
  const res = await request<AuthResponse>(scope, path, { method: "POST", body: credential, anonymous: true })
  setTokens(scope, { access: res.access, refresh: res.refresh })
  mutate(scope, "/me", undefined, res.user)
  return res
}

interface GoogleId {
  accounts: {
    id: {
      initialize: (opts: { client_id: string; callback: (r: { credential: string }) => void; ux_mode?: string }) => void
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void
    }
  }
}

let gisPromise: Promise<GoogleId> | null = null
function loadGis(): Promise<GoogleId> {
  const w = window as unknown as { google?: GoogleId }
  if (w.google?.accounts?.id) return Promise.resolve(w.google)
  gisPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script")
    s.src = "https://accounts.google.com/gsi/client"
    s.async = true
    s.onload = () => (w.google ? resolve(w.google) : reject(new Error("gis")))
    s.onerror = () => {
      gisPromise = null
      reject(new Error("gis"))
    }
    document.head.appendChild(s)
  })
  return gisPromise
}

/** Official Google Identity Services button ("Masuk dengan Google"). */
export function GoogleButton({
  onCredential,
  onLoadError,
}: {
  onCredential: (idToken: string) => void
  onLoadError?: () => void
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const cb = React.useRef(onCredential)
  const errCb = React.useRef(onLoadError)
  React.useEffect(() => {
    cb.current = onCredential
    errCb.current = onLoadError
  })

  React.useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false
    loadGis()
      .then((google) => {
        const el = ref.current
        if (cancelled || !el) return
        google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => cb.current(r.credential) })
        google.accounts.id.renderButton(el, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "signin_with",
          logo_alignment: "center",
          locale: "id",
          width: Math.min(el.offsetWidth || 320, 400),
        })
      })
      .catch(() => errCb.current?.())
    return () => {
      cancelled = true
    }
  }, [])

  if (!GOOGLE_CLIENT_ID) return null
  return <div ref={ref} className="flex min-h-11 w-full justify-center" />
}

/** Email-only login for local development (demo accounts from `seed_demo`). */
export function DevLoginForm({
  accounts,
  disabled,
  onSubmit,
}: {
  accounts: { email: string; label: string }[]
  disabled?: boolean
  onSubmit: (email: string) => void
}) {
  const [email, setEmail] = React.useState("")
  return (
    <div className="flex flex-col gap-3 border border-dashed p-4">
      <p className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">Mode pengembangan · masuk tanpa Google</p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (email.trim()) onSubmit(email.trim())
        }}
      >
        <Input
          type="email"
          placeholder="email@contoh.id"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email akun"
          disabled={disabled}
        />
        <Button type="submit" variant="outline" disabled={disabled || !email.trim()}>
          <IconLogin2 /> Masuk
        </Button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {accounts.map((a) => (
          <button
            key={a.email}
            type="button"
            disabled={disabled}
            onClick={() => onSubmit(a.email)}
            className="border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
