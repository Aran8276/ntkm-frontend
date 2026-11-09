"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { adminApi, clearTokens, getTokens, loginUrl, type Paginated } from "@/lib/api"
import { clearCache, useApi, useHydrated, useSessionPresent } from "@/lib/use-api"
import type { AdminLevel, Dashboard } from "@/lib/admin-types"
import type { Me } from "@/lib/types"
import { LoadError } from "@/components/app/feedback"

/**
 * Small localStorage-backed store read through useSyncExternalStore, so the
 * server renders the default and the client picks up the saved value.
 */
function createStoredValue<T extends string>(key: string, fallback: T, valid: readonly T[]) {
  const listeners = new Set<() => void>()
  let memory = fallback
  const read = (): T => {
    try {
      const v = window.localStorage.getItem(key) as T | null
      if (v && valid.includes(v)) return v
    } catch {}
    return memory
  }
  const subscribe = (cb: () => void) => {
    listeners.add(cb)
    window.addEventListener("storage", cb)
    return () => {
      listeners.delete(cb)
      window.removeEventListener("storage", cb)
    }
  }
  const write = (v: T) => {
    memory = v
    try {
      window.localStorage.setItem(key, v)
    } catch {}
    listeners.forEach((l) => l())
  }
  return { read, subscribe, write, fallback }
}

const sidebarStore = createStoredValue<"open" | "collapsed">("admin-sidebar", "open", ["open", "collapsed"])

interface AdminContextValue {
  me: Me
  level: AdminLevel
  isSuperadmin: boolean
  collapsed: boolean
  setCollapsed: (c: boolean) => void
  /** Sidebar badges (A18 pending, A15 waiting > 48 h, A21 failed emails 24 h). */
  badges: { legal: number; applications: number; notifications: number }
  refreshBadges: () => void
  logout: () => Promise<void>
}

const AdminContext = React.createContext<AdminContextValue | null>(null)

const BADGE_INTERVAL = 5 * 60_000

/**
 * Admin guard (spec A01–A25): no token → A01 with `next`; `is_admin: false` →
 * clear tokens, A01 `reason=not_admin`; suspension is handled by the client
 * (403 `account_suspended` → A01 `reason=suspended`). Children render only
 * once `GET /me` confirms an admin.
 */
export function AdminProvider({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const router = useRouter()
  const hydrated = useHydrated()
  const present = useSessionPresent("admin")
  const sidebar = React.useSyncExternalStore(sidebarStore.subscribe, sidebarStore.read, () => sidebarStore.fallback)
  const meQ = useApi<Me>("admin", present ? "/me" : null)
  const me = meQ.data
  const isAdmin = !!me?.is_admin

  const dashboard = useApi<Dashboard>("admin", isAdmin ? "/admin/dashboard" : null, undefined, { refreshInterval: BADGE_INTERVAL })
  const legal = useApi<Paginated<unknown>>("admin", isAdmin ? "/admin/legal-verifications" : null, { status: "pending", page_size: 1 }, {
    refreshInterval: BADGE_INTERVAL,
  })

  const redirect = !hydrated ? null : !present ? "login" : me && !me.is_admin ? "not_admin" : null
  React.useEffect(() => {
    if (redirect === "login") {
      const next = window.location.pathname + window.location.search
      router.replace(`/admin/masuk?next=${encodeURIComponent(next)}`)
    } else if (redirect === "not_admin") {
      clearTokens("admin")
      clearCache("admin")
      router.replace(loginUrl("admin", "not_admin"))
    }
  }, [redirect, router])

  const reloadDashboard = dashboard.reload
  const reloadLegal = legal.reload
  const refreshBadges = React.useCallback(() => {
    void reloadDashboard()
    void reloadLegal()
  }, [reloadDashboard, reloadLegal])

  const logout = React.useCallback(async () => {
    const refresh = getTokens("admin")?.refresh
    try {
      if (refresh) await adminApi.post("/auth/logout", { refresh })
    } catch {}
    clearTokens("admin")
    clearCache("admin")
  }, [])

  const attention = dashboard.data?.attention
  const value = React.useMemo<AdminContextValue | null>(() => {
    if (!me || !me.is_admin) return null
    const level: AdminLevel = me.admin_role === "superadmin" ? "superadmin" : "staff"
    return {
      me,
      level,
      isSuperadmin: level === "superadmin",
      collapsed: sidebar === "collapsed",
      setCollapsed: (c) => sidebarStore.write(c ? "collapsed" : "open"),
      badges: {
        legal: legal.data?.count ?? attention?.legal_pending ?? 0,
        applications: attention?.applications_waiting_over_48h ?? 0,
        notifications: attention?.emails_failed_24h ?? 0,
      },
      refreshBadges,
      logout,
    }
  }, [me, sidebar, legal.data, attention, refreshBadges, logout])

  if (!value) {
    if (meQ.error && meQ.error.code !== "unauthenticated")
      return (
        <div className="flex min-h-svh flex-1 items-center justify-center bg-muted p-6">
          <LoadError error={meQ.error} onRetry={() => void meQ.reload()} className="max-w-lg" />
        </div>
      )
    return <>{fallback}</>
  }
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = React.useContext(AdminContext)
  if (!ctx) throw new Error("useAdmin must be used within <AdminProvider>")
  return ctx
}
