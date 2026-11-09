"use client"

import * as React from "react"

import { Toaster } from "@/components/ui/toast"
import { ConflictDialogHost } from "@/components/app/feedback"
import { api, clearTokens, getTokens } from "@/lib/api"
import { clearCache, useApi, useSessionPresent, type UseApiResult } from "@/lib/use-api"
import type { Me, Role } from "@/lib/types"

const STORAGE_KEY = "active-role"

interface SessionValue {
  /** Active role (`as=` for lists); always one the user owns once `me` is loaded. */
  role: Role
  roles: Role[]
  setRole: (role: Role) => void
  /** Tokens exist on this device (false during SSR/hydration). */
  signedIn: boolean
  /** `GET /me`; undefined while loading or signed out. */
  me: Me | undefined
  meQuery: UseApiResult<Me>
  reloadMe: () => Promise<void>
  logout: () => Promise<void>
}

const SessionContext = React.createContext<SessionValue | null>(null)

// Active role lives in localStorage; read it as an external store so SSR
// renders the default ("store") and the client picks up the saved value.
const listeners = new Set<() => void>()
let memoryRole: Role = "store"

function readRole(): Role {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === "store" || saved === "umkm") return saved
  } catch {}
  return memoryRole
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener("storage", cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("storage", cb)
  }
}

export function writeActiveRole(next: Role) {
  memoryRole = next
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {}
  listeners.forEach((l) => l())
}

export function Providers({ children }: { children: React.ReactNode }) {
  const savedRole = React.useSyncExternalStore(subscribe, readRole, () => "store" as Role)
  const signedIn = useSessionPresent("user")
  const meQuery = useApi<Me>("user", signedIn ? "/me" : null)
  const me = signedIn ? meQuery.data : undefined
  const roles = React.useMemo(() => me?.roles ?? [], [me])

  // Default: the only role owned; with two roles, the last one used.
  const role: Role = roles.length === 1 ? roles[0] : savedRole

  const logout = React.useCallback(async () => {
    const refresh = getTokens("user")?.refresh
    try {
      if (refresh) await api.post("/auth/logout", { refresh })
    } catch {}
    clearTokens("user")
    clearCache("user")
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }, [])

  const { reload } = meQuery
  const value = React.useMemo<SessionValue>(
    () => ({ role, roles, setRole: writeActiveRole, signedIn, me, meQuery, reloadMe: reload, logout }),
    [role, roles, signedIn, me, meQuery, reload, logout]
  )

  return (
    <SessionContext.Provider value={value}>
      <Toaster timeout={4000}>
        {children}
        <ConflictDialogHost />
      </Toaster>
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = React.useContext(SessionContext)
  if (!ctx) throw new Error("useSession must be used within <Providers>")
  return ctx
}

/** Active role helpers (kept for existing components). */
export function useRole() {
  const { role, roles, setRole } = useSession()
  return { role, roles, setRole }
}

export function onboardingDone(me: Me, role: Role) {
  return role === "store" ? me.onboarding.store_completed : me.onboarding.umkm_completed
}
