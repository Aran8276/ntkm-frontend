"use client"

import * as React from "react"

import { Toaster } from "@/components/ui/toast"
import { ME } from "@/lib/mock-data"
import type { Role } from "@/lib/types"

const STORAGE_KEY = "active-role"

interface RoleContextValue {
  role: Role
  roles: Role[]
  setRole: (role: Role) => void
}

const RoleContext = React.createContext<RoleContextValue | null>(null)

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

export function Providers({ children }: { children: React.ReactNode }) {
  const role = React.useSyncExternalStore(subscribe, readRole, () => "store" as Role)

  const setRole = React.useCallback((next: Role) => {
    memoryRole = next
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {}
    listeners.forEach((l) => l())
  }, [])

  const value = React.useMemo(() => ({ role, roles: ME.roles, setRole }), [role, setRole])

  return (
    <RoleContext.Provider value={value}>
      <Toaster timeout={4000}>{children}</Toaster>
    </RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = React.useContext(RoleContext)
  if (!ctx) throw new Error("useRole must be used within <Providers>")
  return ctx
}
