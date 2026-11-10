"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconEye, IconEyeOff, IconLogin2 } from "@tabler/icons-react"

import { api, request, setTokens, type Scope } from "@/lib/api"
import { mutate } from "@/lib/use-api"
import type { Me, Role } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Logo } from "@/components/app/logo"
import { FormField } from "@/components/app/form-field"
import { homeFor } from "@/components/app/app-shell"
import { useSession } from "@/components/app/providers"

/** Optional: the Google button only renders when a client id is configured. */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""
/**
 * Email-only `POST /auth/dev-login` (backend needs DEBUG + AUTH_DEV_LOGIN).
 * On in `next dev`; a production build needs `NEXT_PUBLIC_DEV_LOGIN=true`.
 */
export const DEV_LOGIN =
  process.env.NEXT_PUBLIC_DEV_LOGIN === "true" ||
  (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_LOGIN !== "false")

interface AuthResponse {
  access: string
  refresh: string
  is_new_user?: boolean
  user: Me
}

export type Credential =
  | { email: string; password: string }
  | { id_token: string }
  | { dev_email: string }

function store(scope: Scope, res: AuthResponse) {
  setTokens(scope, { access: res.access, refresh: res.refresh })
  mutate(scope, "/me", undefined, res.user)
  return res
}

/** Exchange a password, a Google `id_token` or a dev-login email for tokens and cache `GET /me`. */
export async function signIn(scope: Scope, credential: Credential) {
  const [path, body] =
    "password" in credential
      ? ["/auth/login", credential]
      : "id_token" in credential
        ? ["/auth/google", credential]
        : ["/auth/dev-login", { email: credential.dev_email }]
  return store(scope, await request<AuthResponse>(scope, path, { method: "POST", body, anonymous: true }))
}

/** `POST /auth/register`: creates the account and signs it in. */
export async function register(body: { email: string; password: string; name?: string }) {
  return store("user", await request<AuthResponse>("user", "/auth/register", { method: "POST", body, anonymous: true }))
}

/** Same rules as the backend: 8–128 characters and not only digits. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Kata sandi minimal 8 karakter."
  if (password.length > 128) return "Kata sandi maksimal 128 karakter."
  if (/^\d+$/.test(password)) return "Kata sandi tidak boleh hanya angka."
  return null
}

export const PASSWORD_HINT = "Minimal 8 karakter, tidak hanya angka."

/** Only same-origin app paths are allowed as `next`. */
export function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/admin") ? next : null
}

/**
 * Where a user goes right after signing in or registering (spec P02): no roles
 * + `?role` → `PUT /me/roles` → onboarding; no roles → role picker; unfinished
 * onboarding → onboarding; otherwise `?next` or the active dashboard.
 */
export function useAfterSignIn(role: string | null, next: string | null) {
  const router = useRouter()
  const { role: activeRole, setRole, reloadMe } = useSession()
  return async (user: Me) => {
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
}

/** Shared frame of the sign-in, register and password-reset pages. */
export function AuthCard({
  title,
  description,
  badge,
  logoHref = "/",
  children,
}: {
  title: string
  description?: React.ReactNode
  badge?: string
  logoHref?: string | null
  children: React.ReactNode
}) {
  return (
    <div className="flex w-full max-w-md flex-col gap-8 bg-background p-8 shadow-sm ring-1 ring-foreground/5 sm:p-10">
      <div className="flex items-center gap-2">
        <Logo href={logoHref} />
        {badge && (
          <span className="bg-foreground px-1.5 py-0.5 text-[0.5625rem] font-semibold tracking-widest text-background uppercase">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-wider uppercase">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

/** Password input with a show / hide toggle. */
export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [shown, setShown] = React.useState(false)
  return (
    <div className="relative">
      <Input type={shown ? "text" : "password"} className={cn("pr-10", className)} {...props} />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        {shown ? <IconEyeOff className="size-4.5" stroke={1.75} /> : <IconEye className="size-4.5" stroke={1.75} />}
      </button>
    </div>
  )
}

/** Full-width submit button with a busy state. */
export function SubmitButton({ busy, children, ...props }: React.ComponentProps<typeof Button> & { busy?: boolean }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={busy || props.disabled} {...props}>
      {busy && <Spinner className="size-4" />}
      {children}
    </Button>
  )
}

/** Email + password form used by the user and admin login pages. */
export function PasswordLoginForm({
  busy,
  aside,
  onSubmit,
}: {
  busy?: boolean
  /** Shown next to the password label ("Lupa kata sandi?"). */
  aside?: React.ReactNode
  onSubmit: (email: string, password: string) => void
}) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({})

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        const next: typeof errors = {}
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Masukkan alamat email yang benar."
        if (!password) next.password = "Masukkan kata sandi Anda."
        setErrors(next)
        if (!Object.keys(next).length) onSubmit(email.trim().toLowerCase(), password)
      }}
    >
      <FormField label="Email" htmlFor="login-email" error={errors.email}>
        <Input
          id="login-email"
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
      <FormField label="Kata sandi" htmlFor="login-password" error={errors.password} aside={aside}>
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password || undefined}
          disabled={busy}
        />
      </FormField>
      <SubmitButton busy={busy}>{busy ? "Sedang masuk…" : "Masuk"}</SubmitButton>
    </form>
  )
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

/** Official Google Identity Services button; renders nothing without a client id. */
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
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        atau
      </div>
      <div ref={ref} className="flex min-h-11 w-full justify-center" />
    </div>
  )
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
      <p className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">Mode pengembangan · masuk tanpa kata sandi</p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (email.trim()) onSubmit(email.trim())
        }}
      >
        <Input
          type="email"
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
