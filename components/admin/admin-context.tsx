"use client"

import * as React from "react"

import type { AdminLevel } from "@/lib/admin-types"
import { ADMIN_ME } from "@/lib/admin-mock"

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

// "admin_role" normally comes from GET /me; the mock lets you preview staff mode.
const levelStore = createStoredValue<AdminLevel>("admin-preview-level", "superadmin", ["superadmin", "staff"])
const sidebarStore = createStoredValue<"open" | "collapsed">("admin-sidebar", "open", ["open", "collapsed"])

interface AdminContextValue {
  me: typeof ADMIN_ME
  level: AdminLevel
  isSuperadmin: boolean
  setLevel: (l: AdminLevel) => void
  collapsed: boolean
  setCollapsed: (c: boolean) => void
}

const AdminContext = React.createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const level = React.useSyncExternalStore(levelStore.subscribe, levelStore.read, () => levelStore.fallback)
  const sidebar = React.useSyncExternalStore(sidebarStore.subscribe, sidebarStore.read, () => sidebarStore.fallback)

  const value = React.useMemo<AdminContextValue>(
    () => ({
      me: ADMIN_ME,
      level,
      isSuperadmin: level === "superadmin",
      setLevel: levelStore.write,
      collapsed: sidebar === "collapsed",
      setCollapsed: (c) => sidebarStore.write(c ? "collapsed" : "open"),
    }),
    [level, sidebar]
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = React.useContext(AdminContext)
  if (!ctx) throw new Error("useAdmin must be used within <AdminProvider>")
  return ctx
}
