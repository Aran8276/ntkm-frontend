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
  id: number
  name: string
}

export interface Me {
  id: number
  name: string
  email: string
  avatar_url: string | null
  roles: Role[]
  onboarding: { store_completed: boolean; umkm_completed: boolean }
}

export interface Store {
  id: number
  name: string
  phone: string
  address: string
  lat: number
  lng: number
  distance_km?: number
  operating_hours: OperatingHour[]
  updated_at: string
}

export interface UmkmLegal {
  nib: string | null
  pirt_number: string | null
  halal_number: string | null
  has_nib: boolean
  has_pirt: boolean
  has_halal: boolean
}

export interface Umkm {
  id: number
  business_name: string
  owner_name: string
  phone: string
  description: string
  address: string
  legal: UmkmLegal
  updated_at: string
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

export interface Opportunity {
  id: number
  title: string
  description: string
  store: Store
  categories: Category[]
  requirements: {
    min_shelf_life_days: number | null
    max_retail_price: number | null
    requires_nib: boolean
    requires_pirt: boolean
    requires_halal: boolean
    notes: string
  }
  quota: number
  quota_used: number
  quota_remaining: number
  max_products_per_umkm: number
  commission: Commission
  receiving_schedule: ReceivingSlot[]
  valid_until: string
  status: OpportunityStatus
  created_at: string
  application_counts: Partial<Record<ApplicationStatus, number>>
  match?: Match
  my_application?: { id: number; status: ApplicationStatus } | null
}

export interface Product {
  id: number
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
}

export interface ApplicationItem {
  id: number
  product: Product
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
}

export interface Application {
  id: number
  opportunity: Pick<Opportunity, "id" | "title" | "commission" | "receiving_schedule">
  store: Store
  umkm: Umkm
  status: ApplicationStatus
  items: ApplicationItem[]
  note: string
  review_note: string
  stock_mode: StockMode
  delivery_slot: DeliverySlot | null
  created_at: string
  updated_at: string
  available_actions: ApplicationAction[]
}

export interface TimelineEvent {
  id: number
  to_status: ApplicationStatus
  label: string
  actor: { name: string; role: Role }
  note: string
  created_at: string
}

export interface StockRow {
  application_id: number
  item_id: number
  product: Product
  store: Store
  umkm: Umkm
  sell_price: number
  stock_mode: StockMode
  stock_quantity: number | null
  stock_status: StockStatus
  stock_updated_at: string
}

export type NotificationType =
  | "application_submitted"
  | "application_approved"
  | "application_rejected"
  | "application_status_changed"
  | "stock_out"

export interface AppNotification {
  id: number
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  created_at: string
  data: { deeplink: string; role: Role }
}
