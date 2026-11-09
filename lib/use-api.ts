"use client"

import * as React from "react"

import { ApiError, buildUrl, hasSession, request, subscribeSession, type Query, type Scope } from "@/lib/api"

/**
 * Tiny stale-while-revalidate cache for GET requests, read through
 * useSyncExternalStore. Data stays cached per URL, so navigating back to a
 * page shows the last result immediately while it is refetched.
 */

export interface ApiState<T> {
  data: T | undefined
  error: ApiError | undefined
  /** No data yet (first load or waiting for a dependency/session). */
  loading: boolean
  /** A request for this key is in flight (also during background refresh). */
  validating: boolean
}

interface Entry {
  scope: Scope
  /** Path as passed by the caller (used for prefix revalidation). */
  path: string
  url: string
  snap: ApiState<unknown>
  inflight?: Promise<void>
  fetchedAt: number
  listeners: Set<() => void>
}

const LOADING: ApiState<never> = { data: undefined, error: undefined, loading: true, validating: false }
const entries = new Map<string, Entry>()

const keyOf = (scope: Scope, url: string) => `${scope} ${url}`

function entryFor(scope: Scope, path: string, url: string) {
  const key = keyOf(scope, url)
  let e = entries.get(key)
  if (!e) {
    e = { scope, path, url, snap: LOADING, fetchedAt: 0, listeners: new Set() }
    entries.set(key, e)
  }
  return e
}

function setSnap(e: Entry, patch: Partial<ApiState<unknown>>) {
  const next = { ...e.snap, ...patch }
  next.loading = next.data === undefined && next.error === undefined
  e.snap = next
  e.listeners.forEach((l) => l())
}

function toError(err: unknown) {
  return err instanceof ApiError ? err : new ApiError(0, "network_error", "Gagal memuat data.")
}

function revalidateEntry(e: Entry, force = false): Promise<void> {
  if (e.inflight) return e.inflight
  if (!hasSession(e.scope)) return Promise.resolve()
  // Several components mounting with the same key share one request.
  if (!force && Date.now() - e.fetchedAt < 1500 && e.snap.data !== undefined) return Promise.resolve()
  setSnap(e, { validating: true })
  const run = request<unknown>(e.scope, e.url)
    .then((data) => {
      e.fetchedAt = Date.now()
      setSnap(e, { data, error: undefined, validating: false })
    })
    .catch((err) => {
      setSnap(e, { error: toError(err), validating: false })
    })
    .finally(() => {
      e.inflight = undefined
    })
  e.inflight = run
  return run
}

/**
 * Refetch every cached GET of `scope` whose path starts with one of
 * `prefixes` (all when omitted). Unmounted entries refetch on next mount.
 */
export function revalidate(scope: Scope, ...prefixes: string[]) {
  const runs: Promise<void>[] = []
  for (const e of entries.values()) {
    if (e.scope !== scope) continue
    if (prefixes.length && !prefixes.some((p) => e.path.startsWith(p))) continue
    if (e.listeners.size) runs.push(revalidateEntry(e, true))
    else e.fetchedAt = 0
  }
  return Promise.all(runs).then(() => undefined)
}

/** Replace cached data for one GET (e.g. with the response of a mutation). */
export function mutate<T>(scope: Scope, path: string, query: Query | undefined, data: T) {
  const e = entryFor(scope, path, buildUrl(path, query))
  e.fetchedAt = Date.now()
  setSnap(e, { data, error: undefined })
}

/** Forget everything cached for a scope (logout). */
export function clearCache(scope: Scope) {
  for (const [k, e] of entries) {
    if (e.scope !== scope) continue
    e.fetchedAt = 0
    if (e.listeners.size) setSnap(e, { data: undefined, error: undefined, validating: false })
    else entries.delete(k)
  }
}

const noop = () => () => {}

export interface UseApiOptions {
  /** Poll every N ms while mounted and visible. */
  refreshInterval?: number
  /** Refetch when the tab becomes visible again. */
  revalidateOnFocus?: boolean
}

export interface UseApiResult<T> extends ApiState<T> {
  reload: () => Promise<void>
  mutate: (data: T) => void
}

/**
 * GET `path` with `query` in `scope`. Pass `null` as path to wait (e.g. for a
 * dependency); the result then reports `loading`.
 */
export function useApi<T>(
  scope: Scope,
  path: string | null,
  query?: Query,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const url = path ? buildUrl(path, query) : null

  const subscribe = React.useCallback(
    (cb: () => void) => {
      if (!url || !path) return noop()
      const e = entryFor(scope, path, url)
      e.listeners.add(cb)
      const unsubSession = subscribeSession(cb)
      return () => {
        e.listeners.delete(cb)
        unsubSession()
      }
    },
    [scope, path, url]
  )
  const getSnapshot = React.useCallback(
    () => (url ? (entries.get(keyOf(scope, url))?.snap ?? LOADING) : LOADING) as ApiState<T>,
    [scope, url]
  )
  const snap = React.useSyncExternalStore(subscribe, getSnapshot, () => LOADING as ApiState<T>)

  React.useEffect(() => {
    if (url && path) revalidateEntry(entryFor(scope, path, url))
  }, [scope, path, url])

  const { refreshInterval, revalidateOnFocus } = options
  React.useEffect(() => {
    if (!url || !path || !refreshInterval) return
    const t = window.setInterval(() => {
      if (document.visibilityState === "visible") revalidateEntry(entryFor(scope, path, url), true)
    }, refreshInterval)
    return () => window.clearInterval(t)
  }, [scope, path, url, refreshInterval])

  React.useEffect(() => {
    if (!url || !path || !revalidateOnFocus) return
    const onVisible = () => {
      if (document.visibilityState === "visible") revalidateEntry(entryFor(scope, path, url), true)
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [scope, path, url, revalidateOnFocus])

  const reload = React.useCallback(async () => {
    if (url && path) await revalidateEntry(entryFor(scope, path, url), true)
  }, [scope, path, url])

  const setData = React.useCallback(
    (data: T) => {
      if (!url || !path) return
      const e = entryFor(scope, path, url)
      e.fetchedAt = Date.now()
      setSnap(e, { data, error: undefined })
    },
    [scope, path, url]
  )

  return { ...snap, reload, mutate: setData }
}

/** True after hydration, false during SSR and the hydration pass. */
export function useHydrated() {
  return React.useSyncExternalStore(
    noop,
    () => true,
    () => false
  )
}

/** Whether tokens exist for `scope`; false during SSR/hydration. */
export function useSessionPresent(scope: Scope) {
  return React.useSyncExternalStore(
    subscribeSession,
    () => hasSession(scope),
    () => false
  )
}

const minuteNow = () => Math.floor(Date.now() / 60_000) * 60_000
function subscribeMinute(cb: () => void) {
  const t = window.setInterval(cb, 30_000)
  return () => window.clearInterval(t)
}

/** Current time (minute resolution) on the client; null during SSR/hydration. */
export function useNow(): Date | null {
  const t = React.useSyncExternalStore(subscribeMinute, minuteNow, () => null)
  return React.useMemo(() => (t == null ? null : new Date(t)), [t])
}
