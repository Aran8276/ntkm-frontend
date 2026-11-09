"use client"

import type { Paginated, Query } from "@/lib/api"
import { useApi } from "@/lib/use-api"
import type { AdminCategory, AdminOpportunity, AdminStore, AdminUmkm, AdminUser } from "@/lib/admin-types"
import type { EntityOption } from "@/components/admin/pickers"

/**
 * Option lists for entity pickers and table filters, loaded from the admin
 * list endpoints (first 100 rows; pickers filter them as the admin types).
 */
function useList<T>(path: string | null, query?: Query) {
  return useApi<Paginated<T>>("admin", path, { page_size: 100, ...query }).data?.results ?? []
}

export function useUserOptions(query?: Query, enabled = true): EntityOption[] {
  return useList<AdminUser>(enabled ? "/admin/users" : null, query).map((u) => ({
    value: u.id,
    label: u.name || u.email,
    description: u.email,
  }))
}

export function useAdminOptions(enabled = true): EntityOption[] {
  return useUserOptions({ is_admin: true }, enabled)
}

/** Raw user rows (forms that disable ineligible accounts). */
export function useUsers(query?: Query, enabled = true) {
  return useList<AdminUser>(enabled ? "/admin/users" : null, query)
}

export function useStoreOptions(enabled = true): EntityOption[] {
  return useList<AdminStore>(enabled ? "/admin/stores" : null).map((s) => ({
    value: s.id,
    label: s.name,
    description: s.owner.email,
  }))
}

export function useUmkmOptions(enabled = true): EntityOption[] {
  return useList<AdminUmkm>(enabled ? "/admin/umkms" : null).map((u) => ({
    value: u.id,
    label: u.business_name,
    description: u.owner.email,
  }))
}

export function useOpportunityOptions(query?: Query, enabled = true): EntityOption[] {
  return useList<AdminOpportunity>(enabled ? "/admin/opportunities" : null, query).map((o) => ({
    value: o.id,
    label: o.title,
    description: o.store.name,
  }))
}

export function useCategories(): AdminCategory[] {
  return useApi<AdminCategory[]>("admin", "/admin/categories").data ?? []
}

/** Category filter options (value = slug, as the list endpoints expect). */
export function useCategoryOptions() {
  return useCategories().map((c) => ({ value: c.slug, label: c.name }))
}
