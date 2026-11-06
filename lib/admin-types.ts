import type {
  Application,
  ApplicationStatus,
  Opportunity,
  OperatingHour,
  Product,
  Role,
  StockMode,
  StockStatus,
} from "@/lib/types"

export type AccountStatus = "invited" | "active" | "suspended"
export type AdminLevel = "superadmin" | "staff"
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected"
export type EmailStatus = "pending" | "sent" | "failed" | "skipped"
export type LegalKind = "nib" | "pirt" | "halal"
export type TargetType = "user" | "store" | "umkm" | "opportunity" | "product" | "application" | "category" | "file" | "notification"

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "restore"
  | "hard_delete"
  | "invite"
  | "suspend"
  | "activate"
  | "grant_admin"
  | "revoke_admin"
  | "close"
  | "reopen"
  | "force_status"
  | "stock_correction"
  | "verify_legal"
  | "remove_file"
  | "resend_email"
  | "broadcast"
  | "export"

export interface SoftDelete {
  deleted_at: string | null
  deleted_by: string | null
}

export interface PersonRef {
  id: string
  name: string
}

export interface AdminUser extends SoftDelete {
  id: string
  name: string
  email: string
  roles: Role[]
  status: AccountStatus
  is_admin: boolean
  admin_role: AdminLevel | null
  store_profile: { id: string; name: string } | null
  umkm_profile: { id: string; business_name: string } | null
  invited_by: PersonRef | null
  last_login_at: string | null
  created_at: string
  suspended_at: string | null
  suspended_reason: string | null
  stats: { opportunities: number; products: number; applications_active: number; applications_total: number }
}

export interface AdminStore extends SoftDelete {
  id: string
  owner: { id: string; name: string; email: string; status: AccountStatus }
  name: string
  phone: string
  address: string
  lat: number
  lng: number
  operating_hours: OperatingHour[]
  created_at: string
  updated_at: string
  stats: { opportunities_open: number; applications_active: number; items_on_shelf: number }
}

export interface LegalDecision {
  status: VerificationStatus
  note: string
  decided_by: string | null
  decided_at: string | null
}

export interface AdminUmkm extends SoftDelete {
  id: string
  owner: { id: string; name: string; email: string; status: AccountStatus }
  business_name: string
  owner_name: string
  phone: string
  address: string
  description: string
  legal: { nib: string | null; pirt_number: string | null; halal_number: string | null }
  legal_verification: Record<LegalKind, LegalDecision>
  legal_documents: AdminFile[]
  waiting_since: string | null
  created_at: string
  updated_at: string
  stats: { products_active: number; applications_active: number; items_on_shelf: number }
}

export interface CreatedBy {
  name: string
  is_admin: boolean
}

export interface AdminOpportunity extends Omit<Opportunity, "id" | "store">, SoftDelete {
  id: string
  store: { id: string; name: string; owner_id: string; operating_hours: OperatingHour[] }
  created_by: CreatedBy
  updated_at: string
  expired: boolean
}

export interface AdminProduct extends Omit<Product, "id">, SoftDelete {
  id: string
  umkm: { id: string; business_name: string; owner_id: string }
  created_by: CreatedBy
  created_at: string
  updated_at: string
  applications: {
    id: string
    store: string
    status: ApplicationStatus
    decision: Application["items"][number]["decision"]
    sell_price: number | null
    stock_status: StockStatus | null
    stock_quantity: number | null
  }[]
}

export interface AdminTimelineEvent {
  id: number
  from_status: ApplicationStatus | null
  to_status: ApplicationStatus
  label: string
  actor: string
  note: string
  is_admin_override: boolean
  admin_reason: string | null
  created_at: string
}

export interface AdminApplication extends Omit<Application, "id" | "store" | "umkm" | "opportunity" | "available_actions"> {
  id: string
  store: { id: string; name: string; phone: string; owner_id: string }
  umkm: {
    id: string
    business_name: string
    phone: string
    owner_id: string
    legal_verification: Record<LegalKind, VerificationStatus>
  }
  opportunity: Pick<Opportunity, "title" | "commission" | "receiving_schedule"> & { id: string }
  has_override: boolean
  override_count: number
  admin_can_review: boolean
  admin_transitions: ApplicationStatus[]
  timeline: AdminTimelineEvent[]
}

export interface AdminStockRow {
  application_id: string
  item_id: number
  product: { name: string }
  umkm: { id: string; business_name: string }
  store: { id: string; name: string }
  sell_price: number
  stock_mode: StockMode
  stock_quantity: number | null
  stock_status: StockStatus
  stock_updated_at: string
  stock_updated_by: string | null
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  is_active: boolean
  sort_order: number
  usage: { products: number; opportunities: number }
}

export type FilePurpose = "product_photo" | "store_photo" | "umkm_logo" | "legal_document"

export interface AdminFile {
  id: string
  purpose: FilePurpose
  name: string
  mime: string
  size_kb: number
  owner: { id: string; name: string; email: string }
  used_in: { label: string; href: string }[]
  is_removed: boolean
  created_at: string
}

export interface AdminNotification {
  id: string
  user: { id: string; name: string; email: string }
  type:
    | "application_submitted"
    | "application_approved"
    | "application_rejected"
    | "application_status_changed"
    | "stock_out"
    | "admin_action"
    | "announcement"
    | "legal_verified"
    | "legal_rejected"
  title: string
  body: string
  data: { label: string; href: string } | null
  email_status: EmailStatus
  email_attempts: number
  email_error: string | null
  read_at: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  admin: { id: string; name: string }
  action: AuditAction
  target_type: TargetType
  target_id: string
  target_label: string
  target_href: string | null
  reason: string
  changes: { field: string; before: string | null; after: string | null }[]
  ip_address: string
  user_agent: string
  created_at: string
}

export interface ActivityItem {
  id: string
  kind: "application" | "user" | "opportunity" | "product"
  label: string
  href: string
  created_at: string
}
