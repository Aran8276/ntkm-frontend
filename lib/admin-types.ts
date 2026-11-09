/**
 * Admin panel types, matching `backend/core/admin_api/presenters.py`.
 */
import type {
  ApplicationItem,
  ApplicationStatus,
  Commission,
  DeliverySlot,
  Decision,
  FileBrief,
  LegalKind,
  Opportunity,
  Product,
  ReceivingSlot,
  Role,
  StockMode,
  StockStatus,
  StoreProfile,
  TimelineEvent,
  UmkmLegal,
  UmkmProfile,
  VerificationStatus,
} from "@/lib/types"

export type { LegalKind, VerificationStatus }

export type AccountStatus = "invited" | "active" | "suspended"
export type AdminLevel = "superadmin" | "staff"
export type EmailStatus = "pending" | "sent" | "failed" | "skipped"
export type TargetType =
  | "user"
  | "store"
  | "umkm"
  | "opportunity"
  | "product"
  | "application"
  | "category"
  | "file"
  | "notification"

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

export interface PersonRef {
  id: string
  name: string
}

export interface SoftDelete {
  deleted_at: string | null
  deleted_by: PersonRef | null
}

export interface OwnerRef {
  id: string
  name: string
  email: string
  status: AccountStatus
}

export interface AdminUser extends SoftDelete {
  id: string
  name: string
  email: string
  avatar_url: string | null
  roles: Role[]
  status: AccountStatus
  is_admin: boolean
  admin_role: AdminLevel | null
  store_profile: { id: string; name: string; is_deleted: boolean } | null
  umkm_profile: { id: string; business_name: string; is_deleted: boolean } | null
  last_login_at: string | null
  created_at: string
}

/** `GET /admin/users/{id}`. */
export interface AdminUserDetail extends AdminUser {
  invited_by: PersonRef | null
  suspended_at: string | null
  suspended_reason: string | null
  stats: { opportunities: number; products: number; applications_active: number; applications_total: number }
}

export interface AdminStore extends StoreProfile, SoftDelete {
  owner: OwnerRef
  stats: { opportunities_open: number; applications_active: number; items_on_shelf: number }
}

export interface LegalDecision {
  status: VerificationStatus
  number: string | null
  note: string | null
  decided_by: PersonRef | null
  decided_at: string | null
  submitted_at: string | null
}

export interface AdminUmkm extends UmkmProfile, SoftDelete {
  owner: OwnerRef
  legal_verification: Record<LegalKind, LegalDecision>
  waiting_since: string | null
  stats: { products_active: number; applications_active: number; items_on_shelf: number }
}

/** `GET /admin/legal-verifications` item. */
export interface LegalQueueItem {
  umkm: { id: string; business_name: string; owner_name: string; owner_id: string }
  kinds: LegalKind[]
  waiting_since: string | null
  decided_at: string | null
}

export interface CreatedBy {
  id: string
  name: string
  is_admin: boolean
}

export interface AdminOpportunity extends Omit<Opportunity, "store" | "match" | "my_application">, SoftDelete {
  store: Opportunity["store"] & { owner_id: string; is_deleted: boolean }
  created_by: CreatedBy | null
  has_applications: boolean
}

export interface ProductHistoryRow {
  application_id: string
  item_id: number
  store: { id: string; name: string }
  status: ApplicationStatus
  decision: Decision
  sell_price: number | null
  stock_status: StockStatus | null
  stock_quantity: number | null
  created_at: string
}

export interface AdminProduct extends Product, SoftDelete {
  umkm: { id: string; business_name: string; owner_id: string }
  created_by: CreatedBy | null
  has_applications: boolean
  /** Detail only. */
  applications?: ProductHistoryRow[]
}

export type AdminTimelineEvent = TimelineEvent

/** `GET /admin/applications` item. */
export interface AdminApplicationRow {
  id: string
  store: { id: string; name: string; owner_id: string }
  umkm: { id: string; business_name: string; owner_id: string }
  opportunity: { id: string; title: string }
  status: ApplicationStatus
  items_count: number
  approved_count: number
  delivery_slot: DeliverySlot | null
  has_override: boolean
  created_at: string
  updated_at: string
}

/** `GET /admin/applications/{id}`. */
export interface AdminApplication extends Omit<AdminApplicationRow, "store" | "umkm" | "opportunity"> {
  store: { id: string; name: string; phone: string; address: string; owner_id: string; photo_url: string | null }
  umkm: {
    id: string
    business_name: string
    owner_name: string
    phone: string
    owner_id: string
    logo_url: string | null
    legal: UmkmLegal
  }
  opportunity: {
    id: string
    title: string
    commission: Commission
    current_commission: Commission
    receiving_schedule: ReceivingSlot[]
  }
  items: ApplicationItem[]
  note: string
  review_note: string
  stock_mode: StockMode
  timeline: AdminTimelineEvent[]
  override_count: number
  admin_can_review: boolean
  admin_transitions: ApplicationStatus[]
  created_by: CreatedBy | null
}

export interface AdminStockRow {
  application_id: string
  item_id: number
  product: { id: string; name: string; photo_url: string | null }
  umkm: { id: string; business_name: string }
  store: { id: string; name: string }
  sell_price: number | null
  stock_mode: StockMode
  received_quantity: number | null
  stock_quantity: number | null
  stock_status: StockStatus | null
  stock_updated_at: string | null
  stock_updated_by: CreatedBy | null
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  is_active: boolean
  sort_order: number
  usage: { products: number; opportunities: number }
}

export type FilePurpose = FileBrief["purpose"]

export interface FileUsage {
  type: "store" | "umkm" | "legal_document" | "product"
  id: string
  label: string
  owner_id?: string
}

export interface AdminFile extends FileBrief {
  owner: { id: string; name: string; email: string }
  uploaded_by: PersonRef | null
  used_in: FileUsage[]
  removed_at: string | null
  removed_by: PersonRef | null
  created_at: string
}

export type AdminNotificationType =
  | "application_submitted"
  | "application_approved"
  | "application_rejected"
  | "application_status_changed"
  | "stock_out"
  | "admin_action"
  | "announcement"
  | "legal_verified"
  | "legal_rejected"

export interface AdminNotification {
  id: string
  user: { id: string; name: string; email: string }
  type: AdminNotificationType
  title: string
  body: string
  data: { deeplink?: string; role?: Role; application_id?: string; [key: string]: unknown } | null
  email_status: EmailStatus
  email_attempts: number
  email_error: string | null
  read_at: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  admin: { id: string | null; name: string }
  action: AuditAction
  target_type: TargetType
  target_id: string
  target_label: string
  reason: string | null
  changes: { field: string; before: unknown; after: unknown }[]
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface ActivityItem {
  kind: "application" | "user" | "opportunity" | "product"
  label: string
  target: { type: TargetType; id: string }
  created_at: string
}

/** `GET /admin/dashboard`. */
export interface Dashboard {
  period: { from: string; to: string }
  updated_at: string
  attention: {
    legal_pending: number
    applications_waiting_over_48h: number
    deliveries_today: number
    emails_failed_24h: number
  }
  users: { total: number; store: number; umkm: number; invited: number; suspended: number }
  opportunities: { open: number; full: number; closed: number }
  products: { active: number; archived: number }
  stock: { items_on_shelf: number; out_of_stock: number }
  applications: {
    by_status: Partial<Record<ApplicationStatus, number>>
    created_in_period: number
    approval_rate: number | null
    median_hours_to_review: number | null
  }
  recent_activity: ActivityItem[]
}
