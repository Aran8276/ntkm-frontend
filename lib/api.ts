/**
 * HTTP client for the Django REST API (`backend/`).
 *
 * Two independent sessions share this module: the user PWA ("user" scope,
 * tokens `access`/`refresh`) and the admin panel ("admin" scope, tokens
 * `admin_access`/`admin_refresh`), so signing in to one never logs out the
 * other. Every request attaches `Authorization: Bearer <access>`; a 401 is
 * retried once after `POST /auth/token/refresh`, and a failed refresh clears
 * the session and sends the browser to the matching login page.
 */

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1").replace(/\/$/, "")

export type Scope = "user" | "admin"

export type ErrorCode =
  | "validation_error"
  | "unauthenticated"
  | "permission_denied"
  | "account_suspended"
  | "superadmin_required"
  | "not_found"
  | "conflict"
  | "has_active_relations"
  | "rate_limited"
  | "server_error"
  | "network_error"
  | (string & {})

export type ErrorDetails = Record<string, unknown>

/** The backend's `{"error": {code, message, details}}` envelope as an exception. */
export class ApiError extends Error {
  status: number
  code: ErrorCode
  details: ErrorDetails

  constructor(status: number, code: ErrorCode, message: string, details: ErrorDetails = {}) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }

  /** Message for one field (`details.<field>`), flattening list values. */
  field(name: string): string | undefined {
    const v = this.details[name]
    if (v == null) return undefined
    if (Array.isArray(v)) return v.map(String).join(" ")
    if (typeof v === "object") return undefined
    return String(v)
  }

  /** `details` as `{field: message}` strings, for form error maps. */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(this.details)) {
      if (v == null) continue
      if (typeof v === "string") out[k] = v
      else if (Array.isArray(v)) out[k] = v.map(String).join(" ")
    }
    return out
  }

  get isNetwork() {
    return this.code === "network_error"
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError
}

/** Best-effort human message for any thrown value. */
export function errorMessage(e: unknown, fallback = "Terjadi kesalahan. Coba lagi.") {
  if (isApiError(e)) {
    if (e.code === "rate_limited") return "Terlalu banyak percobaan. Coba lagi sebentar lagi."
    if (e.code === "network_error") return "Gagal terhubung ke server. Periksa koneksi Anda."
    return e.message || fallback
  }
  return fallback
}

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

const KEYS: Record<Scope, { access: string; refresh: string }> = {
  user: { access: "access", refresh: "refresh" },
  admin: { access: "admin_access", refresh: "admin_refresh" },
}

export interface Tokens {
  access: string
  refresh: string
}

const sessionListeners = new Set<() => void>()

function read(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function getTokens(scope: Scope): Tokens | null {
  if (typeof window === "undefined") return null
  const access = read(KEYS[scope].access)
  const refresh = read(KEYS[scope].refresh)
  return access || refresh ? { access: access ?? "", refresh: refresh ?? "" } : null
}

export function hasSession(scope: Scope) {
  return getTokens(scope) !== null
}

export function setTokens(scope: Scope, tokens: Tokens) {
  try {
    window.localStorage.setItem(KEYS[scope].access, tokens.access)
    window.localStorage.setItem(KEYS[scope].refresh, tokens.refresh)
  } catch {}
  sessionListeners.forEach((l) => l())
}

export function clearTokens(scope: Scope) {
  try {
    window.localStorage.removeItem(KEYS[scope].access)
    window.localStorage.removeItem(KEYS[scope].refresh)
  } catch {}
  sessionListeners.forEach((l) => l())
}

/** Subscribe to sign-in/sign-out in this tab and in other tabs. */
export function subscribeSession(cb: () => void) {
  sessionListeners.add(cb)
  const onStorage = (e: StorageEvent) => {
    if (!e.key || Object.values(KEYS).some((k) => k.access === e.key || k.refresh === e.key)) cb()
  }
  window.addEventListener("storage", onStorage)
  return () => {
    sessionListeners.delete(cb)
    window.removeEventListener("storage", onStorage)
  }
}

// ---------------------------------------------------------------------------
// Session-ending redirects
// ---------------------------------------------------------------------------

function currentPath() {
  return window.location.pathname + window.location.search
}

/** Where to send the browser when the session can no longer be used. */
export function loginUrl(scope: Scope, reason: "expired" | "suspended" | "not_admin" | "idle") {
  const next = encodeURIComponent(currentPath())
  if (scope === "admin") return `/admin/masuk?reason=${reason}&next=${next}`
  return `/masuk?reason=${reason}&next=${next}`
}

let redirecting = false
function endSession(scope: Scope, reason: "expired" | "suspended") {
  clearTokens(scope)
  if (typeof window === "undefined" || redirecting) return
  const loginPath = scope === "admin" ? "/admin/masuk" : "/masuk"
  if (window.location.pathname === loginPath) return
  redirecting = true
  window.location.assign(loginUrl(scope, reason))
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export type QueryValue = string | number | boolean | null | undefined | readonly (string | number)[]
export type Query = Record<string, QueryValue>

/** `/path` + query → absolute URL; empty values are dropped, arrays joined by comma. */
export function buildUrl(path: string, query?: Query) {
  const url = path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`
  if (!query) return url
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v == null || v === "") continue
    if (Array.isArray(v)) {
      if (v.length) sp.set(k, v.join(","))
    } else sp.set(k, String(v))
  }
  const qs = sp.toString()
  return qs ? `${url}${url.includes("?") ? "&" : "?"}${qs}` : url
}

/** Stable cache key for a GET. */
export function requestKey(scope: Scope, path: string, query?: Query) {
  return `${scope} ${buildUrl(path, query)}`
}

const refreshing: Partial<Record<Scope, Promise<boolean>>> = {}

async function refreshTokens(scope: Scope): Promise<boolean> {
  const existing = refreshing[scope]
  if (existing) return existing
  const run = (async () => {
    const tokens = getTokens(scope)
    if (!tokens?.refresh) return false
    try {
      const res = await fetch(buildUrl("/auth/token/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: tokens.refresh }),
      })
      if (!res.ok) return false
      const data = (await res.json()) as { access: string; refresh?: string }
      setTokens(scope, { access: data.access, refresh: data.refresh ?? tokens.refresh })
      return true
    } catch {
      return false
    }
  })()
  refreshing[scope] = run
  try {
    return await run
  } finally {
    delete refreshing[scope]
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: unknown = null
  try {
    body = await res.json()
  } catch {}
  const env = (body as { error?: { code?: string; message?: string; details?: ErrorDetails } } | null)?.error
  if (env?.code) return new ApiError(res.status, env.code, env.message ?? "", env.details ?? {})
  if (res.status >= 500) return new ApiError(res.status, "server_error", "Terjadi kesalahan di server. Coba beberapa saat lagi.")
  return new ApiError(res.status, "error", `Permintaan gagal (${res.status}).`)
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  query?: Query
  body?: unknown
  /** Multipart body (uploads); `body` is ignored when set. */
  form?: FormData
  /** Skip auth (login endpoints). */
  anonymous?: boolean
  signal?: AbortSignal
}

async function rawFetch(scope: Scope, path: string, opts: RequestOptions, retry = true): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" }
  const tokens = opts.anonymous ? null : getTokens(scope)
  if (tokens?.access) headers.Authorization = `Bearer ${tokens.access}`
  let body: BodyInit | undefined
  if (opts.form) body = opts.form
  else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json"
    body = JSON.stringify(opts.body)
  }

  let res: Response
  try {
    res = await fetch(buildUrl(path, opts.query), { method: opts.method ?? "GET", headers, body, signal: opts.signal })
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e
    throw new ApiError(0, "network_error", "Gagal terhubung ke server. Periksa koneksi Anda.")
  }

  if (res.status === 401 && !opts.anonymous) {
    // A wrong current password (`POST /me/password`) is not an expired session.
    const code = await res
      .clone()
      .json()
      .then((b: { error?: { code?: string } } | null) => b?.error?.code)
      .catch(() => undefined)
    if (code === "invalid_credentials") return res
    if (retry && tokens?.refresh && (await refreshTokens(scope))) return rawFetch(scope, path, opts, false)
    endSession(scope, "expired")
  }
  return res
}

export async function request<T>(scope: Scope, path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await rawFetch(scope, path, opts)
  if (!res.ok) {
    const err = await toApiError(res)
    if (err.code === "account_suspended") endSession(scope, "suspended")
    throw err
  }
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

function client(scope: Scope) {
  return {
    scope,
    get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>(scope, path, { query, signal }),
    post: <T>(path: string, body?: unknown) => request<T>(scope, path, { method: "POST", body: body ?? {} }),
    put: <T>(path: string, body?: unknown) => request<T>(scope, path, { method: "PUT", body }),
    patch: <T>(path: string, body?: unknown) => request<T>(scope, path, { method: "PATCH", body }),
    del: <T = void>(path: string, opts: { query?: Query; body?: unknown } = {}) =>
      request<T>(scope, path, { method: "DELETE", ...opts }),
    /** `POST /uploads` (multipart `file` + `purpose`). */
    upload: (file: File | Blob, purpose: UploadPurpose) => {
      const form = new FormData()
      form.append("file", file)
      form.append("purpose", purpose)
      return request<UploadedFile>(scope, "/uploads", { method: "POST", form })
    },
    /** Authenticated download (CSV exports): saves the response as a file. */
    download: async (path: string, query: Query | undefined, filename: string) => {
      const res = await rawFetch(scope, path, { query })
      if (!res.ok) throw await toApiError(res)
      const blob = await res.blob()
      const disposition = res.headers.get("Content-Disposition") ?? ""
      const match = /filename="?([^";]+)"?/.exec(disposition)
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = match?.[1] ?? filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    },
  }
}

export type UploadPurpose = "product_photo" | "store_photo" | "umkm_logo" | "legal_document"

export interface UploadedFile {
  id: string
  url: string | null
  name: string
  mime: string
  size: number
  purpose: UploadPurpose
  is_removed: boolean
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** User PWA client (`/api/v1/...`). */
export const api = client("user")
/** Admin panel client; paths are relative to `/api/v1` (pass `/admin/...`). */
export const adminApi = client("admin")

export type ApiClient = ReturnType<typeof client>

/** Upload size/type check before `POST /uploads` (spec: jpg/png/webp/pdf, max 5 MB). */
export function validateUploadFile(file: File, purpose: UploadPurpose): string | null {
  const allowed =
    purpose === "legal_document"
      ? ["image/jpeg", "image/png", "image/webp", "application/pdf"]
      : ["image/jpeg", "image/png", "image/webp"]
  if (!allowed.includes(file.type))
    return purpose === "legal_document" ? "Format file harus JPG, PNG, WEBP, atau PDF." : "Format file harus JPG, PNG, atau WEBP."
  if (file.size > 5 * 1024 * 1024) return "Ukuran file maksimal 5 MB."
  return null
}
