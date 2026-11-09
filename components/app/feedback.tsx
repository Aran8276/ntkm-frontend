"use client"

import * as React from "react"
import Link from "next/link"
import { IconAlertTriangle, IconLock, IconRefresh, IconSearch } from "@tabler/icons-react"

import { ApiError, errorMessage, isApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"

/**
 * Error → UI mapping shared by the PWA and the admin panel (spec "Pemetaan
 * error API ke UI"): field errors stay with the form, 409 opens a dialog with
 * a reload button, 429 and the rest become toasts.
 */

// ---------------------------------------------------------------------------
// Conflict dialog (409) — one global instance, opened from anywhere.
// ---------------------------------------------------------------------------

interface ConflictState {
  title: string
  message: string
  /** Choices allowed by the server (`details.allowed`). */
  allowed?: string[]
  /** Related objects (`details.application_ids` → links). */
  links?: { href: string; label: string }[]
  extra?: React.ReactNode
  onReload?: () => void
}

let conflict: ConflictState | null = null
const conflictListeners = new Set<() => void>()
const setConflict = (next: ConflictState | null) => {
  conflict = next
  conflictListeners.forEach((l) => l())
}

export function showConflict(state: ConflictState) {
  setConflict(state)
}

export function ConflictDialogHost() {
  const state = React.useSyncExternalStore(
    (cb) => {
      conflictListeners.add(cb)
      return () => conflictListeners.delete(cb)
    },
    () => conflict,
    () => null
  )
  return (
    <AlertDialog open={!!state} onOpenChange={(o) => !o && setConflict(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state?.title}</AlertDialogTitle>
          <AlertDialogDescription>{state?.message}</AlertDialogDescription>
        </AlertDialogHeader>
        {state?.allowed && state.allowed.length > 0 && (
          <div className="text-sm">
            <p className="mb-1 text-muted-foreground">Pilihan yang diizinkan:</p>
            <ul className="list-inside list-disc">
              {state.allowed.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        )}
        {state?.links && state.links.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {state.links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setConflict(null)} className="font-mono text-xs underline underline-offset-4">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {state?.extra}
        <AlertDialogFooter>
          <AlertDialogCancel>Tutup</AlertDialogCancel>
          {state?.onReload && (
            <Button
              onClick={() => {
                state.onReload?.()
                setConflict(null)
              }}
            >
              <IconRefresh /> Muat ulang
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ---------------------------------------------------------------------------
// Mutation error handling
// ---------------------------------------------------------------------------

export interface HandleErrorOptions {
  /** Refetch page data (409 "Muat ulang"). */
  onReload?: () => void
  /** Field errors from `details.<field>` (400); return true when the form showed them. */
  onFieldErrors?: (fields: Record<string, string>, err: ApiError) => boolean | void
  /** Admin panel wording/links. */
  admin?: boolean
  /** Message for a 409 (defaults to the server message). */
  conflictTitle?: string
}

/** Show the right UI for a failed mutation. Returns the ApiError (if any). */
export function handleApiError(err: unknown, opts: HandleErrorOptions = {}): ApiError | undefined {
  if (!isApiError(err)) {
    toast.add({ title: "Terjadi kesalahan. Coba lagi.", type: "error" })
    return undefined
  }
  switch (err.code) {
    case "validation_error": {
      const fields = err.fieldErrors()
      const shown = opts.onFieldErrors?.(fields, err)
      if (!shown) toast.add({ title: err.message || "Periksa kembali isian Anda.", description: Object.values(fields)[0], type: "error" })
      break
    }
    case "conflict":
    case "has_active_relations": {
      const ids = (err.details.application_ids as string[] | undefined) ?? []
      const allowed = err.details.allowed as string[] | undefined
      showConflict({
        title: err.code === "has_active_relations" ? "Tidak bisa dilanjutkan" : (opts.conflictTitle ?? "Data sudah berubah"),
        message: err.message,
        allowed: Array.isArray(allowed) ? allowed.map(String) : undefined,
        links: opts.admin ? ids.map((id) => ({ href: `/admin/pengajuan/${id}`, label: `Pengajuan ${id.slice(0, 8)}` })) : undefined,
        onReload: opts.onReload,
      })
      break
    }
    case "superadmin_required":
      toast.add({ title: "Hanya superadmin yang bisa melakukan aksi ini.", type: "error" })
      break
    case "rate_limited":
      toast.add({
        title: opts.admin ? "Terlalu banyak permintaan. Coba lagi sebentar lagi." : "Terlalu banyak percobaan. Coba lagi sebentar lagi.",
        type: "error",
      })
      break
    case "unauthenticated":
    case "account_suspended":
      // The client already redirects to the login page.
      break
    default:
      toast.add({ title: errorMessage(err), type: "error" })
  }
  return err
}

/** Form-level message for a validation error without a field (`non_field_errors`, `legal`, …). */
export function formLevelError(err: ApiError | undefined, knownFields: string[] = []) {
  if (!err || err.code !== "validation_error") return undefined
  const fields = err.fieldErrors()
  const rest = Object.entries(fields).filter(([k]) => !knownFields.some((f) => k === f || k.startsWith(`${f}.`)))
  if (!rest.length) return Object.keys(fields).length ? undefined : err.message
  return rest.map(([, v]) => v).join(" ")
}

// ---------------------------------------------------------------------------
// Load errors (GET)
// ---------------------------------------------------------------------------

/** "Gagal memuat data" banner with retry; 404/403 get their own variants. */
export function LoadError({
  error,
  onRetry,
  backHref = "/",
  backLabel = "Kembali ke beranda",
  className,
}: {
  error: ApiError | undefined
  onRetry?: () => void
  backHref?: string
  backLabel?: string
  className?: string
}) {
  if (error?.code === "not_found")
    return (
      <div className={cn("flex flex-col items-center gap-4 bg-background p-10 text-center shadow-sm ring-1 ring-foreground/5", className)}>
        <span className="flex size-14 items-center justify-center bg-muted">
          <IconSearch className="size-6" stroke={1.5} />
        </span>
        <p className="text-sm font-medium">Halaman atau data tidak ditemukan.</p>
        <Link href={backHref} className={buttonVariants({ variant: "outline" })}>
          {backLabel}
        </Link>
      </div>
    )
  if (error?.code === "permission_denied")
    return (
      <div className={cn("flex flex-col items-center gap-4 bg-background p-10 text-center shadow-sm ring-1 ring-foreground/5", className)}>
        <span className="flex size-14 items-center justify-center bg-muted">
          <IconLock className="size-6" stroke={1.5} />
        </span>
        <p className="text-sm font-medium">Akses tidak tersedia.</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Link href={backHref} className={buttonVariants({ variant: "outline" })}>
          {backLabel}
        </Link>
      </div>
    )
  return (
    <Alert variant="destructive" className={className}>
      <IconAlertTriangle />
      <AlertTitle>Gagal memuat data</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>{error ? errorMessage(error) : "Coba lagi sebentar lagi."}</span>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <IconRefresh /> Coba lagi
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

/** Run an async mutation with a pending flag (disables double submits). */
export function useMutation<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [pending, setPending] = React.useState(false)
  const fnRef = React.useRef(fn)
  React.useEffect(() => {
    fnRef.current = fn
  })
  const run = React.useCallback(async (...args: A): Promise<R | undefined> => {
    setPending(true)
    try {
      return await fnRef.current(...args)
    } finally {
      setPending(false)
    }
  }, [])
  return [run, pending] as const
}
