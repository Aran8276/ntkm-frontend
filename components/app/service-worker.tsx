"use client"

import * as React from "react"

/**
 * Registers /sw.js (offline page + cached build assets) in production builds.
 * In development an old worker is removed so it never serves stale chunks.
 */
export function ServiceWorker() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => void r.unregister()))
      return
    }
    const register = () =>
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
        // Not fatal: the app works without offline support.
      })
    if (document.readyState === "complete") void register()
    else {
      window.addEventListener("load", register, { once: true })
      return () => window.removeEventListener("load", register)
    }
  }, [])
  return null
}
