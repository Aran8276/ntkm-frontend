/**
 * User PWA types, matching the Django API responses (`backend/core/presenters.py`).
 * IDs are UUID strings, except application items and timeline events (integers).
 */

export type Role = "store" | "umkm"

export type Day = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

export type ApplicationStatus =
  | "submitted"
  | "approved"
  | "in_delivery"
  | "received"
  | "completed"
  | "rejected"
  | "cancelled"

export type Decision = "pending" | "approved" | "rejected"
export type OpportunityStatus = "open" | "full" | "closed"
export type StockStatus = "available" | "out_of_stock"
export type MatchLevel = "high" | "medium" | "low"
export type StockMode = "count" | "boolean"
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected"
export type LegalKind = "nib" | "pirt" | "halal"

export type ApplicationAction =
  | "review"
  | "ship"
  | "receive"
  | "complete"
  | "cancel"
  | "update_stock"

export interface Commission {
  type: "percent" | "fixed"
  value: number
}

export interface ReceivingSlot {
  day: Day
  start: string
  end: string
}

export interface OperatingHour {
  day: Day
  open: string
  close: string
  is_closed: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
}

/** `POST /uploads` response and nested file objects. */
export interface FileBrief {
  id: string
  url: string | null
  name: string
  mime: string
  size: number
  purpose: "product_photo" | "store_photo" | "umkm_logo" | "legal_document"
  is_removed: boolean
}

export interface Me {
  id: string
  name: string
  email: string
  avatar_url: string | null
  roles: Role[]
  status: "invited" | "active" | "suspended"
  onboarding: { store_completed: boolean; umkm_completed: boolean }
  store_profile: { id: string; name: string } | null
  umkm_profile: { id: string; business_name: string } | null
  is_admin: boolean
  admin_role: "superadmin" | "staff" | null
  unread_notifications: number
  /** False for accounts that never set a password (invited or Google-only). */
  has_password?: boolean
}

export interface Store {
  id: string
  name: string
  phone: string
  address: string
  lat: number
  lng: number
  photo_url: string | null
  distance_km?: number
  operating_hours: OperatingHour[]
  updated_at: string
}

/** `GET /me/store-profile`. */
export interface StoreProfile extends Store {
  photo_file_id: string | null
  photo: FileBrief | null
  created_at: string
}

export interface UmkmLegal {
  nib: string | null
  pirt_number: string | null
  halal_number: string | null
  has_nib: boolean
  has_pirt: boolean
  has_halal: boolean
  verification: Record<LegalKind, VerificationStatus>
}

export interface Umkm {
  id: string
  business_name: string
  owner_name: string
  phone: string
  description: string
  address: string
  lat: number
  lng: number
  logo_url: string | null
  legal: UmkmLegal
  updated_at: string
}

/** `GET /me/umkm-profile`. */
export interface UmkmProfile extends Umkm {
  logo_file_id: string | null
  logo: FileBrief | null
  legal_document_file_ids: string[]
  legal_documents: FileBrief[]
  created_at: string
}

export interface MatchReason {
  ok: boolean
  label: string
}

export interface Match {
  level: MatchLevel
  score: number
  reasons: MatchReason[]
}

export interface Requirements {
  min_shelf_life_days: number | null
  max_retail_price: number | null
  requires_nib: boolean
  requires_pirt: boolean
  requires_halal: boolean
  notes: string
}

export interface Opportunity {
  id: string
  title: string
  description: string
  store: Store
  categories: Category[]
  requirements: Requirements
  quota: number
  quota_used: number
  quota_remaining: number
  max_products_per_umkm: number
  commission: Commission
  receiving_schedule: ReceivingSlot[]
  valid_until: string
  is_expired: boolean
  status: OpportunityStatus
  created_at: string
  updated_at: string
  application_counts?: Partial<Record<ApplicationStatus, number>>
  match?: Match
  my_application?: { id: string; status: ApplicationStatus } | null
}

/** `GET /opportunities/{id}` adds the UMKM's products with eligibility. */
export interface FeedOpportunityDetail extends Opportunity {
  my_products: (Product & { eligible: boolean; ineligible_reasons: string[] })[]
  is_available: boolean
}

export interface Product {
  id: string
  name: string
  category: Category
  description: string
  tags: string[]
  base_price: number
  suggested_retail_price: number
  shelf_life_days: number | null
  expiry_date: string | null
  active_placements: number
  is_active: boolean
  photo_count: number
  photo_url: string | null
  photo_file_ids: string[]
  photos: FileBrief[]
  created_at: string
  updated_at: string
}

/** Product snapshot stored on an application item. */
export interface ItemProduct {
  id: string
  name: string
  category: { name: string }
  base_price: number
  suggested_retail_price: number
  shelf_life_days: number | null
  expiry_date: string | null
  photo_url: string | null
}

export interface ApplicationItem {
  id: number
  product: ItemProduct
  decision: Decision
  approved_quantity: number | null
  sell_price: number | null
  commission_per_unit: number | null
  umkm_income_per_unit: number | null
  reject_reason: string | null
  received_quantity: number | null
  stock_quantity: number | null
  stock_status: StockStatus | null
  stock_updated_at: string | null
}

export interface DeliverySlot {
  date: string
  start: string
  end: string
  start_at: string
  end_at: string
}

/** The other party as seen by the viewer (`as=store` → UMKM, `as=umkm` → store). */
export interface Counterpart {
  type: Role
  id: string
  name: string
  image_url: string | null
  phone: string
  address?: string
}

export interface Application {
  id: string
  opportunity: { id: string; title: string; commission: Commission; receiving_schedule: ReceivingSlot[] }
  store: Store
  umkm: Umkm
  counterpart: Counterpart
  status: ApplicationStatus
  items: ApplicationItem[]
  items_count: number
  approved_count: number
  note: string
  review_note: string
  stock_mode: StockMode
  delivery_slot: DeliverySlot | null
  created_at: string
  updated_at: string
  viewer_role: Role
  available_actions: ApplicationAction[]
}

export interface TimelineEvent {
  id: number
  from_status: ApplicationStatus | null
  to_status: ApplicationStatus
  label: string
  actor: { name: string; role: Role | "admin" | null }
  note: string
  is_admin_override: boolean
  admin_reason: string | null
  created_at: string
}

export interface StockRow {
  application_id: string
  item_id: number
  product: ItemProduct
  store: { id: string; name: string; photo_url: string | null; phone: string }
  umkm: { id: string; business_name: string; logo_url: string | null; phone: string }
  counterpart: Counterpart
  sell_price: number
  stock_mode: StockMode
  received_quantity: number | null
  stock_quantity: number | null
  stock_status: StockStatus
  stock_updated_at: string | null
  can_update: boolean
}

export type NotificationType =
  | "application_submitted"
  | "application_approved"
  | "application_rejected"
  | "application_status_changed"
  | "stock_out"
  | "admin_action"
  | "announcement"
  | "legal_verified"
  | "legal_rejected"

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  read_at: string | null
  created_at: string
  data: { deeplink?: string; role?: Role; application_id?: string; [key: string]: unknown } | null
}
