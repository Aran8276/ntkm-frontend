"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

/**
 * Keeps a single string value in the URL query (tabs, filters) so it survives
 * navigation and can be shared. Components using it must sit under <Suspense>.
 */
export function useQueryState<T extends string>(key: string, fallback: T) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const value = (params.get(key) as T | null) ?? fallback

  const setValue = React.useCallback(
    (next: T) => {
      const sp = new URLSearchParams(params.toString())
      if (next === fallback) sp.delete(key)
      else sp.set(key, next)
      const qs = sp.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [params, router, pathname, key, fallback]
  )

  return [value, setValue] as const
}
