import {
  ADMIN_CATEGORIES,
  ADMIN_OPPORTUNITIES,
  ADMIN_STORES,
  ADMIN_UMKMS,
  ADMIN_USERS,
} from "@/lib/admin-mock"
import type { EntityOption } from "@/components/admin/pickers"

/** Option lists for entity pickers and table filters (mock of list endpoints with ?search=). */
export const userOptions: EntityOption[] = ADMIN_USERS.filter((u) => !u.deleted_at).map((u) => ({
  value: u.id,
  label: u.name,
  description: u.email,
}))

export const adminOptions: EntityOption[] = ADMIN_USERS.filter((u) => u.is_admin).map((u) => ({
  value: u.id,
  label: u.name,
  description: u.email,
}))

export const storeOptions: EntityOption[] = ADMIN_STORES.filter((s) => !s.deleted_at).map((s) => ({
  value: s.id,
  label: s.name,
  description: s.owner.email,
}))

export const umkmOptions: EntityOption[] = ADMIN_UMKMS.filter((u) => !u.deleted_at).map((u) => ({
  value: u.id,
  label: u.business_name,
  description: u.owner.email,
}))

export const opportunityOptions: EntityOption[] = ADMIN_OPPORTUNITIES.filter((o) => !o.deleted_at).map((o) => ({
  value: o.id,
  label: o.title,
  description: o.store.name,
}))

export const categoryOptions = ADMIN_CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))
