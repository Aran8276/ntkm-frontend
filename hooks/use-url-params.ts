"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/**
 * Read/patch several query params at once (tables keep search, filters,
 * ordering and paging in the URL). Must sit under <Suspense>.
 */
export function useUrlParams() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const get = React.useCallback((key: string) => params.get(key), [params])

  const set = React.useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const sp = new URLSearchParams(params.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") sp.delete(k)
        else sp.set(k, v)
      }
      const qs = sp.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [params, router, pathname]
  )

  return { params, get, set, pathname }
}
