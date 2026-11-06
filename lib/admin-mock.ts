/**
 * Mock data for the admin panel (A01–A25). Built on top of the user-app mock
 * data so names, products and applications stay consistent across both apps.
 */
import {
  CATEGORIES,
  FEED_OPPORTUNITIES,
  MY_OPPORTUNITIES,
  MY_PRODUCTS,
  MY_STORE,
  MY_UMKM,
  STORE_APPLICATIONS,
  UMKM_APPLICATIONS,
  getTimeline,
} from "@/lib/mock-data"
import type { Application, ApplicationStatus, Opportunity, Product, Store, Umkm } from "@/lib/types"
import type {
  AccountStatus,
  ActivityItem,
  AdminApplication,
  AdminCategory,
  AdminFile,
  AdminLevel,
  AdminNotification,
  AdminOpportunity,
  AdminProduct,
  AdminStockRow,
  AdminStore,
  AdminTimelineEvent,
  AdminUmkm,
  AdminUser,
  AuditAction,
  AuditLog,
  LegalDecision,
  LegalKind,
  TargetType,
  VerificationStatus,
} from "@/lib/admin-types"

const uniqueById = <T extends { id: number }>(items: T[]) =>
  [...new Map(items.map((x) => [x.id, x])).values()].sort((a, b) => a.id - b.id)

const USER_APPS = [...STORE_APPLICATIONS, ...UMKM_APPLICATIONS]
/** Other stores / UMKMs / products of the user-app mock, derived from its feed and applications. */
const STORES: Store[] = uniqueById(FEED_OPPORTUNITIES.map((o) => o.store))
const UMKMS: Umkm[] = uniqueById(USER_APPS.map((a) => a.umkm)).filter((u) => u.id !== MY_UMKM.id)
const OTHER_PRODUCTS: Product[] = uniqueById(USER_APPS.flatMap((a) => a.items.map((i) => i.product))).filter(
  (p) => !MY_PRODUCTS.some((m) => m.id === p.id),
)

export const TODAY = "2026-11-04"
export const NOW_ISO = "2026-11-04T16:00:00+07:00"

/** Deterministic UUID-looking id so SSR and client agree. */
export function uid(seed: string) {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  let hex = ""
  for (let round = 0; hex.length < 32; round++) {
    for (const ch of `${seed}:${round}`) {
      h1 = Math.imul(h1 ^ ch.charCodeAt(0), 16777619) >>> 0
      h2 = Math.imul(h2 + ch.charCodeAt(0), 2246822519) >>> 0
    }
    hex += ((h1 ^ h2) >>> 0).toString(16).padStart(8, "0")
  }
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

// ---------------------------------------------------------------------------
// Admins & users
// ---------------------------------------------------------------------------

export const ADMIN_ME = { id: uid("user-admin-1"), name: "Aran Pratama", email: "aran@raklokal.id" }
const NADIA = { id: uid("user-admin-2"), name: "Nadia Putri" }
const RIZKY = { id: uid("user-admin-3"), name: "Rizky Hidayat" }

interface UserSeed {
  key: string
  name: string
  email: string
  status?: AccountStatus
  store?: number
  umkm?: number
  admin?: AdminLevel
  invitedBy?: { id: string; name: string } | null
  lastLogin?: string | null
  created: string
  suspended?: { at: string; reason: string }
  deleted?: { at: string; by: string }
}

const USER_SEEDS: UserSeed[] = [
  { key: "admin-1", name: ADMIN_ME.name, email: ADMIN_ME.email, admin: "superadmin", lastLogin: "2026-11-04T15:42:00+07:00", created: "2026-09-01T08:00:00+07:00", invitedBy: null },
  { key: "admin-2", name: NADIA.name, email: "nadia@raklokal.id", admin: "staff", lastLogin: "2026-11-04T09:15:00+07:00", created: "2026-09-02T10:00:00+07:00" },
  { key: "admin-3", name: RIZKY.name, email: "rizky@raklokal.id", admin: "staff", lastLogin: "2026-11-01T13:40:00+07:00", created: "2026-09-10T10:00:00+07:00" },
  { key: "rina", name: "Rina Wulandari", email: "rina.wulandari@contoh.id", store: 10, umkm: 20, lastLogin: "2026-11-04T14:58:00+07:00", created: "2026-09-12T09:30:00+07:00" },
  { key: "hendra", name: "Hendra Gunawan", email: "hendra.berkah@contoh.id", store: 11, lastLogin: "2026-11-04T08:10:00+07:00", created: "2026-09-12T10:00:00+07:00" },
  { key: "sri", name: "Sri Wahyuni", email: "bu.sri.kelontong@contoh.id", store: 12, lastLogin: "2026-11-03T19:22:00+07:00", created: "2026-09-13T11:00:00+07:00" },
  {
    key: "yohanes",
    name: "Yohanes Kurniawan",
    email: "yohanes.sinarmas@contoh.id",
    store: 13,
    status: "suspended",
    lastLogin: "2026-10-29T16:05:00+07:00",
    created: "2026-09-14T09:00:00+07:00",
    suspended: { at: "2026-11-02T10:20:00+07:00", reason: "Laporan UMKM: barang diterima tetapi tidak dipajang di rak selama 2 minggu." },
  },
  { key: "agus", name: "Agus Salim", email: "agus.sanan@contoh.id", umkm: 21, lastLogin: "2026-11-04T14:50:00+07:00", created: "2026-09-15T09:00:00+07:00" },
  { key: "siti-rahma", name: "Siti Rahma", email: "siti.rahma@contoh.id", umkm: 22, lastLogin: "2026-11-02T07:45:00+07:00", created: "2026-09-15T10:00:00+07:00" },
  { key: "bayu", name: "Bayu Pratama", email: "bayu.arjuno@contoh.id", umkm: 23, lastLogin: "2026-11-03T12:30:00+07:00", created: "2026-09-16T09:00:00+07:00" },
  { key: "hana", name: "Hana Lestari", email: "ummi.hana@contoh.id", umkm: 24, lastLogin: "2026-11-04T10:12:00+07:00", created: "2026-09-18T09:00:00+07:00" },
  { key: "siti-aminah", name: "Siti Aminah", email: "siti.aminah@contoh.id", umkm: 26, lastLogin: "2026-11-02T20:11:00+07:00", created: "2026-10-28T09:00:00+07:00" },
  { key: "dewi", name: "Dewi Anggraini", email: "dewi.anggraini@contoh.id", status: "invited", lastLogin: null, created: "2026-11-03T13:00:00+07:00" },
  { key: "fajar", name: "Fajar Nugroho", email: "fajar.toko@contoh.id", status: "invited", lastLogin: null, created: "2026-11-04T09:30:00+07:00", invitedBy: NADIA },
  {
    key: "lina",
    name: "Lina Marlina",
    email: "lina.rengginang@contoh.id",
    umkm: 25,
    lastLogin: "2026-10-10T09:00:00+07:00",
    created: "2026-09-20T09:00:00+07:00",
    deleted: { at: "2026-10-25T11:00:00+07:00", by: NADIA.name },
  },
]

const userId = (key: string) => uid(`user-${key}`)
const storeId = (n: number) => uid(`store-${n}`)
const umkmId = (n: number) => uid(`umkm-${n}`)
const oppId = (n: number) => uid(`opportunity-${n}`)
const productId = (n: number) => uid(`product-${n}`)
const applicationId = (n: number) => uid(`application-${n}`)

/** Two extra UMKMs only the admin panel sees (deleted, waiting for verification). */
const EXTRA_UMKMS: Umkm[] = [
  {
    id: 25,
    business_name: "Rengginang Bu Lina",
    owner_name: "Lina Marlina",
    phone: "081244455566",
    description: "Rengginang ketan putih dan merah.",
    address: "Jl. Gadang No. 9, Malang",
    legal: { nib: null, pirt_number: null, halal_number: null, has_nib: false, has_pirt: false, has_halal: false },
    updated_at: "2026-10-10T09:00:00+07:00",
  },
  {
    id: 26,
    business_name: "Bakpia Siti",
    owner_name: "Siti Aminah",
    phone: "081266677788",
    description: "Bakpia isi kacang hijau dan keju, dipanggang setiap hari.",
    address: "Jl. Kawi No. 14, Klojen, Malang",
    legal: {
      nib: "9120307654321",
      pirt_number: "2063573010987-26",
      halal_number: "ID35110000987650824",
      has_nib: true,
      has_pirt: true,
      has_halal: true,
    },
    updated_at: "2026-11-02T20:15:00+07:00",
  },
]

const ALL_STORES_RAW: Store[] = [MY_STORE, ...STORES]
const ALL_UMKMS_RAW: Umkm[] = [MY_UMKM, ...UMKMS, ...EXTRA_UMKMS]

const seedOfStore = (n: number) => USER_SEEDS.find((s) => s.store === n)!
const seedOfUmkm = (n: number) => USER_SEEDS.find((s) => s.umkm === n)!

const statusOf = (s: UserSeed): AccountStatus => s.status ?? "active"

// ---------------------------------------------------------------------------
// Applications (needed early: stats are derived from them)
// ---------------------------------------------------------------------------

const RAW_APPLICATIONS: Application[] = [
  ...STORE_APPLICATIONS,
  ...UMKM_APPLICATIONS.filter((a) => !STORE_APPLICATIONS.some((s) => s.id === a.id)),
]

const ACTIVE: ApplicationStatus[] = ["submitted", "approved", "in_delivery", "received"]

/** Product id → owning UMKM id (numeric, from the user-app mock). */
function umkmOfProduct(pid: number) {
  if (pid >= 301 && pid <= 305) return 20
  return ({ 401: 21, 402: 21, 403: 22, 404: 23, 405: 23, 406: 24 } as Record<number, number>)[pid] ?? 21
}

export const ADMIN_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted: ["cancelled"],
  approved: ["submitted", "cancelled"],
  in_delivery: ["approved", "received", "cancelled"],
  received: ["in_delivery", "completed", "cancelled"],
  completed: ["received"],
  rejected: ["submitted"],
  cancelled: ["submitted"],
}

export const TRANSITION_EFFECT: Partial<Record<`${ApplicationStatus}>${ApplicationStatus}`, string>> = {
  "submitted>cancelled": "Pengajuan dibatalkan.",
  "approved>submitted": "Persetujuan dibatalkan; semua keputusan produk dan slot antar dikosongkan; kuota peluang dikembalikan 1.",
  "approved>cancelled": "Pengajuan dibatalkan; kuota peluang dikembalikan 1.",
  "in_delivery>approved": "UMKM dianggap belum berangkat; slot tetap.",
  "in_delivery>received": "Barang dianggap sudah diterima; isi jumlah diterima per produk.",
  "in_delivery>cancelled": "Pengajuan dibatalkan; kuota peluang dikembalikan 1.",
  "received>in_delivery": "Konfirmasi terima dibatalkan; jumlah diterima dan stok dikosongkan.",
  "received>completed": "Kerja sama diselesaikan.",
  "received>cancelled": "Barang ditarik; stok jadi habis tanpa notifikasi stok habis; kuota dikembalikan 1.",
  "rejected>submitted": "Peninjauan dibuka ulang; keputusan dan alasan tolak dikosongkan.",
  "cancelled>submitted": "Pengajuan dibuka ulang; keputusan dikosongkan.",
  "completed>received": "Kerja sama dibuka kembali; stok bisa diubah lagi.",
}

const LEGAL_VERIFICATION: Record<number, Record<LegalKind, LegalDecision>> = (() => {
  const d = (status: VerificationStatus, note = "", by: string | null = null, at: string | null = null): LegalDecision => ({
    status,
    note,
    decided_by: by,
    decided_at: at,
  })
  return {
    20: {
      nib: d("verified", "", NADIA.name, "2026-10-02T10:00:00+07:00"),
      pirt: d("unverified"),
      halal: d("pending"),
    },
    21: {
      nib: d("verified", "", ADMIN_ME.name, "2026-09-20T09:00:00+07:00"),
      pirt: d("verified", "", ADMIN_ME.name, "2026-09-20T09:00:00+07:00"),
      halal: d("verified", "", ADMIN_ME.name, "2026-09-20T09:00:00+07:00"),
    },
    22: {
      nib: d("verified", "", NADIA.name, "2026-09-22T11:00:00+07:00"),
      pirt: d("verified", "", NADIA.name, "2026-09-22T11:00:00+07:00"),
      halal: d("unverified"),
    },
    23: {
      nib: d("rejected", "Nomor NIB tidak cocok dengan dokumen yang diunggah.", RIZKY.name, "2026-10-30T14:00:00+07:00"),
      pirt: d("unverified"),
      halal: d("unverified"),
    },
    24: {
      nib: d("unverified"),
      pirt: d("pending"),
      halal: d("verified", "", NADIA.name, "2026-10-05T15:30:00+07:00"),
    },
    25: { nib: d("unverified"), pirt: d("unverified"), halal: d("unverified") },
    26: { nib: d("pending"), pirt: d("pending"), halal: d("pending") },
  }
})()

const WAITING_SINCE: Record<number, string> = {
  20: "2026-11-01T09:00:00+07:00",
  24: "2026-11-03T16:30:00+07:00",
  26: "2026-11-02T20:15:00+07:00",
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

const fileOwner = (s: UserSeed) => ({ id: userId(s.key), name: s.name, email: s.email })

function legalDocs(n: number): AdminFile[] {
  const umkm = ALL_UMKMS_RAW.find((u) => u.id === n)!
  const owner = fileOwner(seedOfUmkm(n))
  const docs: [string, string][] = []
  if (umkm.legal.nib) docs.push(["nib", "image/jpeg"])
  if (umkm.legal.pirt_number) docs.push(["pirt", "application/pdf"])
  if (umkm.legal.halal_number) docs.push(["sertifikat-halal", "application/pdf"])
  return docs.map(([name, mime], i) => ({
    id: uid(`file-legal-${n}-${i}`),
    purpose: "legal_document",
    name: `${name}-${umkm.business_name.toLowerCase().replace(/\s+/g, "-")}.${mime === "application/pdf" ? "pdf" : "jpg"}`,
    mime,
    size_kb: mime === "application/pdf" ? 812 + i * 37 : 1460,
    owner,
    used_in: [{ label: `Dokumen legalitas ${umkm.business_name}`, href: `/admin/verifikasi?umkm=${umkmId(n)}` }],
    is_removed: false,
    created_at: umkm.updated_at,
  }))
}

// ---------------------------------------------------------------------------
// Stores & UMKMs
// ---------------------------------------------------------------------------

export const ADMIN_STORES: AdminStore[] = ALL_STORES_RAW.map((s) => {
  const seed = seedOfStore(s.id)
  const apps = RAW_APPLICATIONS.filter((a) => a.store.id === s.id)
  return {
    id: storeId(s.id),
    owner: { id: userId(seed.key), name: seed.name, email: seed.email, status: statusOf(seed) },
    name: s.name,
    phone: s.phone,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    operating_hours: s.operating_hours,
    created_at: seed.created,
    updated_at: s.updated_at,
    deleted_at: null,
    deleted_by: null,
    stats: {
      opportunities_open: [...MY_OPPORTUNITIES, ...FEED_OPPORTUNITIES].filter((o) => o.store.id === s.id && o.status === "open").length,
      applications_active: apps.filter((a) => ACTIVE.includes(a.status)).length,
      items_on_shelf: apps
        .filter((a) => a.status === "received")
        .flatMap((a) => a.items)
        .filter((i) => i.stock_status === "available").length,
    },
  }
})

export const ADMIN_UMKMS: AdminUmkm[] = ALL_UMKMS_RAW.map((u) => {
  const seed = seedOfUmkm(u.id)
  const apps = RAW_APPLICATIONS.filter((a) => a.umkm.id === u.id)
  const products = [...MY_PRODUCTS, ...OTHER_PRODUCTS].filter((p) => umkmOfProduct(p.id) === u.id)
  return {
    id: umkmId(u.id),
    owner: { id: userId(seed.key), name: seed.name, email: seed.email, status: statusOf(seed) },
    business_name: u.business_name,
    owner_name: u.owner_name,
    phone: u.phone,
    address: u.address,
    description: u.description,
    legal: { nib: u.legal.nib, pirt_number: u.legal.pirt_number, halal_number: u.legal.halal_number },
    legal_verification: LEGAL_VERIFICATION[u.id],
    legal_documents: legalDocs(u.id),
    waiting_since: WAITING_SINCE[u.id] ?? null,
    created_at: seed.created,
    updated_at: u.updated_at,
    deleted_at: seed.deleted?.at ?? null,
    deleted_by: seed.deleted?.by ?? null,
    stats: {
      products_active: products.filter((p) => p.is_active).length,
      applications_active: apps.filter((a) => ACTIVE.includes(a.status)).length,
      items_on_shelf: apps
        .filter((a) => a.status === "received")
        .flatMap((a) => a.items)
        .filter((i) => i.stock_status === "available").length,
    },
  }
})

const adminStoreOf = (n: number) => ADMIN_STORES.find((s) => s.id === storeId(n))!
const adminUmkmOf = (n: number) => ADMIN_UMKMS.find((u) => u.id === umkmId(n))!

export const ADMIN_USERS: AdminUser[] = USER_SEEDS.map((s) => {
  const store = s.store ? adminStoreOf(s.store) : null
  const umkm = s.umkm ? adminUmkmOf(s.umkm) : null
  const apps = RAW_APPLICATIONS.filter((a) => a.store.id === s.store || a.umkm.id === s.umkm)
  const roles = [...(s.store ? (["store"] as const) : []), ...(s.umkm ? (["umkm"] as const) : [])]
  return {
    id: userId(s.key),
    name: s.name,
    email: s.email,
    roles: s.key === "dewi" ? ["umkm"] : s.key === "fajar" ? ["store"] : roles,
    status: statusOf(s),
    is_admin: !!s.admin,
    admin_role: s.admin ?? null,
    store_profile: store ? { id: store.id, name: store.name } : null,
    umkm_profile: umkm ? { id: umkm.id, business_name: umkm.business_name } : null,
    invited_by: s.invitedBy === undefined ? ADMIN_ME : s.invitedBy,
    last_login_at: s.lastLogin ?? null,
    created_at: s.created,
    suspended_at: s.suspended?.at ?? null,
    suspended_reason: s.suspended?.reason ?? null,
    deleted_at: s.deleted?.at ?? null,
    deleted_by: s.deleted?.by ?? null,
    stats: {
      opportunities: s.store ? [...MY_OPPORTUNITIES, ...FEED_OPPORTUNITIES].filter((o) => o.store.id === s.store).length : 0,
      products: s.umkm ? [...MY_PRODUCTS, ...OTHER_PRODUCTS].filter((p) => umkmOfProduct(p.id) === s.umkm).length : 0,
      applications_active: apps.filter((a) => ACTIVE.includes(a.status)).length,
      applications_total: apps.length,
    },
  }
})

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------

function toAdminOpportunity(o: Opportunity, extra: Partial<AdminOpportunity> = {}): AdminOpportunity {
  const store = adminStoreOf(o.store.id)
  const rest = { ...o } as Partial<Opportunity>
  delete rest.match
  delete rest.my_application
  return {
    ...(rest as Opportunity),
    id: oppId(o.id),
    store: { id: store.id, name: store.name, owner_id: store.owner.id, operating_hours: store.operating_hours },
    created_by: { name: store.owner.name, is_admin: false },
    updated_at: o.created_at,
    expired: o.valid_until < TODAY,
    deleted_at: null,
    deleted_by: null,
    ...extra,
  }
}

const EXTRA_OPPORTUNITY: Opportunity = {
  ...MY_OPPORTUNITIES[2],
  id: 115,
  title: "Frozen food untuk freezer dekat kasir",
  description: "Freezer kecil 2 rak untuk nugget, dimsum, dan bakso lokal.",
  store: STORES[1],
  categories: [CATEGORIES[5]],
  status: "closed",
  quota: 2,
  quota_used: 0,
  quota_remaining: 2,
  valid_until: "2026-10-20",
  created_at: "2026-09-25T10:00:00+07:00",
  application_counts: {},
}

export const ADMIN_OPPORTUNITIES: AdminOpportunity[] = [
  ...[...MY_OPPORTUNITIES, ...FEED_OPPORTUNITIES].map((o) =>
    o.id === 112
      ? toAdminOpportunity(o, { created_by: { name: NADIA.name, is_admin: true } })
      : toAdminOpportunity(o),
  ),
  toAdminOpportunity(EXTRA_OPPORTUNITY, {
    created_by: { name: ADMIN_ME.name, is_admin: true },
    deleted_at: "2026-10-21T09:00:00+07:00",
    deleted_by: ADMIN_ME.name,
  }),
]

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export const ADMIN_PRODUCTS: AdminProduct[] = [...MY_PRODUCTS, ...OTHER_PRODUCTS].map((p, i) => {
  const u = adminUmkmOf(umkmOfProduct(p.id))
  const history = RAW_APPLICATIONS.flatMap((a) =>
    a.items
      .filter((it) => it.product.id === p.id)
      .map((it) => ({
        id: applicationId(a.id),
        store: a.store.name,
        status: a.status,
        decision: it.decision,
        sell_price: it.sell_price,
        stock_status: it.stock_status,
        stock_quantity: it.stock_quantity,
      })),
  )
  const { id: _id, ...rest } = p
  void _id
  return {
    ...rest,
    id: productId(p.id),
    umkm: { id: u.id, business_name: u.business_name, owner_id: u.owner.id },
    created_by: p.id === 406 ? { name: RIZKY.name, is_admin: true } : { name: u.owner.name, is_admin: false },
    created_at: `2026-10-${String(1 + i * 2).padStart(2, "0")}T10:00:00+07:00`,
    updated_at: `2026-10-${String(12 + i).padStart(2, "0")}T14:30:00+07:00`,
    deleted_at: null,
    deleted_by: null,
    applications: history,
  }
})

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

function toAdminTimeline(a: Application) {
  const events: AdminTimelineEvent[] = getTimeline(a).map((e, i, all) => ({
    id: e.id,
    from_status: i === 0 ? null : all[i - 1].to_status,
    to_status: e.to_status,
    label: e.label,
    actor: e.actor.name,
    note: e.note,
    is_admin_override: false,
    admin_reason: null,
    created_at: e.created_at,
  }))
  if (a.id === 1005 || a.id === 1006) {
    const last = events.at(-1)!
    events.push({
      id: events.length + 1,
      from_status: last.to_status,
      to_status: last.to_status,
      label: "Stok dikoreksi admin",
      actor: NADIA.name,
      note: "",
      is_admin_override: true,
      admin_reason: "Hasil cek fisik rak 3 Nov: stok tinggal 4 bungkus.",
      created_at: "2026-11-03T17:10:00+07:00",
    })
  }
  return events
}

/** Admin-only: a couple of submissions waiting > 48 hours so the A15 quick view has data. */
const AGED: Record<number, string> = {
  201: "2026-11-01T19:00:00+07:00",
  1002: "2026-11-02T09:10:00+07:00",
}

export const ADMIN_APPLICATIONS: AdminApplication[] = RAW_APPLICATIONS.map((raw) => {
  const a = AGED[raw.id] ? { ...raw, created_at: AGED[raw.id], updated_at: AGED[raw.id] } : raw
  const store = adminStoreOf(a.store.id)
  const umkm = adminUmkmOf(a.umkm.id)
  const timeline = toAdminTimeline(a)
  const overrides = timeline.filter((e) => e.is_admin_override).length
  const { available_actions: _actions, ...rest } = a
  void _actions
  return {
    ...rest,
    id: applicationId(a.id),
    store: { id: store.id, name: store.name, phone: store.phone, owner_id: store.owner.id },
    umkm: {
      id: umkm.id,
      business_name: umkm.business_name,
      phone: umkm.phone,
      owner_id: umkm.owner.id,
      legal_verification: {
        nib: umkm.legal_verification.nib.status,
        pirt: umkm.legal_verification.pirt.status,
        halal: umkm.legal_verification.halal.status,
      },
    },
    opportunity: { ...a.opportunity, id: oppId(a.opportunity.id) },
    has_override: overrides > 0,
    override_count: overrides,
    admin_can_review: a.status === "submitted",
    admin_transitions: ADMIN_TRANSITIONS[a.status],
    timeline,
  }
})

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

export const ADMIN_STOCK: AdminStockRow[] = ADMIN_APPLICATIONS.filter((a) => a.status === "received").flatMap((a) =>
  a.items
    .filter((i) => i.decision === "approved" && i.stock_status)
    .map((i) => ({
      application_id: a.id,
      item_id: i.id,
      product: { name: i.product.name },
      umkm: { id: a.umkm.id, business_name: a.umkm.business_name },
      store: { id: a.store.id, name: a.store.name },
      sell_price: i.sell_price ?? i.product.suggested_retail_price,
      stock_mode: a.stock_mode,
      stock_quantity: i.stock_quantity,
      stock_status: i.stock_status!,
      stock_updated_at: i.stock_updated_at!,
      stock_updated_by: a.has_override ? NADIA.name : null,
    })),
)

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "dan")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

export { slugify }

export const ADMIN_CATEGORIES: AdminCategory[] = [
  ...CATEGORIES.map((c, i) => ({
    id: uid(`category-${c.id}`),
    name: c.name,
    slug: slugify(c.name),
    is_active: true,
    sort_order: (i + 1) * 10,
    usage: {
      products: [...MY_PRODUCTS, ...OTHER_PRODUCTS].filter((p) => p.category.id === c.id).length,
      opportunities: [...MY_OPPORTUNITIES, ...FEED_OPPORTUNITIES].filter((o) => o.categories.some((x) => x.id === c.id)).length,
    },
  })),
  { id: uid("category-8"), name: "Kerajinan", slug: "kerajinan", is_active: false, sort_order: 80, usage: { products: 0, opportunities: 0 } },
]

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export const ADMIN_FILES: AdminFile[] = [
  ...ADMIN_PRODUCTS.slice(0, 6).map((p, i) => {
    const owner = ADMIN_USERS.find((u) => u.id === p.umkm.owner_id)!
    return {
      id: uid(`file-product-${i}`),
      purpose: "product_photo" as const,
      name: `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`,
      mime: "image/jpeg",
      size_kb: 640 + i * 53,
      owner: { id: owner.id, name: owner.name, email: owner.email },
      used_in: [{ label: `Produk · ${p.name}`, href: `/admin/produk/${p.id}` }],
      is_removed: i === 4,
      created_at: p.created_at,
    }
  }),
  ...ADMIN_STORES.slice(0, 3).map((s, i) => ({
    id: uid(`file-store-${i}`),
    purpose: "store_photo" as const,
    name: `foto-${s.name.toLowerCase().replace(/\s+/g, "-")}.jpg`,
    mime: "image/jpeg",
    size_kb: 1120 + i * 80,
    owner: { id: s.owner.id, name: s.owner.name, email: s.owner.email },
    used_in: [{ label: `Profil toko · ${s.name}`, href: `/admin/pengguna/${s.owner.id}?tab=toko` }],
    is_removed: false,
    created_at: s.created_at,
  })),
  ...ADMIN_UMKMS.slice(0, 2).map((u, i) => ({
    id: uid(`file-logo-${i}`),
    purpose: "umkm_logo" as const,
    name: `logo-${u.business_name.toLowerCase().replace(/\s+/g, "-")}.png`,
    mime: "image/png",
    size_kb: 210 + i * 12,
    owner: { id: u.owner.id, name: u.owner.name, email: u.owner.email },
    used_in: [{ label: `Profil UMKM · ${u.business_name}`, href: `/admin/pengguna/${u.owner.id}?tab=umkm` }],
    is_removed: false,
    created_at: u.created_at,
  })),
  ...ADMIN_UMKMS.flatMap((u) => u.legal_documents),
]

// ---------------------------------------------------------------------------
// Notifications log
// ---------------------------------------------------------------------------

const userRef = (key: string) => {
  const u = ADMIN_USERS.find((x) => x.id === userId(key))!
  return { id: u.id, name: u.name, email: u.email }
}

export const ADMIN_NOTIFICATIONS: AdminNotification[] = [
  {
    id: uid("notif-1"),
    user: userRef("rina"),
    type: "application_submitted",
    title: "Pengajuan baru dari Keripik Tempe Sanan",
    body: "Keripik Tempe Sanan mengajukan 2 produk ke peluang Cari camilan lokal untuk rak dekat kasir.",
    data: { label: "Pengajuan Keripik Tempe Sanan", href: `/admin/pengajuan/${applicationId(1001)}` },
    email_status: "sent",
    email_attempts: 1,
    email_error: null,
    read_at: null,
    created_at: "2026-11-04T14:55:00+07:00",
  },
  {
    id: uid("notif-2"),
    user: userRef("hana"),
    type: "legal_verified",
    title: "Sertifikat halal terverifikasi",
    body: "Sertifikat halal Kue Kering Ummi Hana sudah diverifikasi admin.",
    data: { label: "Profil UMKM Kue Kering Ummi Hana", href: `/admin/pengguna/${userId("hana")}?tab=umkm` },
    email_status: "failed",
    email_attempts: 3,
    email_error: "550 5.1.1 Mailbox ummi.hana@contoh.id tidak ditemukan (bounce).",
    read_at: "2026-11-04T10:15:00+07:00",
    created_at: "2026-11-04T09:58:00+07:00",
  },
  {
    id: uid("notif-3"),
    user: userRef("yohanes"),
    type: "admin_action",
    title: "Akun Anda disuspend",
    body: "Akun Anda dinonaktifkan sementara oleh admin. Hubungi pengelola platform untuk informasi lebih lanjut.",
    data: null,
    email_status: "sent",
    email_attempts: 1,
    email_error: null,
    read_at: null,
    created_at: "2026-11-02T10:20:00+07:00",
  },
  {
    id: uid("notif-4"),
    user: userRef("bayu"),
    type: "legal_rejected",
    title: "NIB ditolak",
    body: "Nomor NIB tidak cocok dengan dokumen yang diunggah. Perbarui data legalitas Anda.",
    data: { label: "Profil UMKM Kopi Lereng Arjuno", href: `/admin/pengguna/${userId("bayu")}?tab=umkm` },
    email_status: "failed",
    email_attempts: 2,
    email_error: "Timeout saat menghubungi server SMTP (30 detik).",
    read_at: null,
    created_at: "2026-10-30T14:00:00+07:00",
  },
  {
    id: uid("notif-5"),
    user: userRef("agus"),
    type: "stock_out",
    title: "Stok habis di Toko Sumber Rejeki",
    body: "Keripik Tempe Original 100 g habis di rak. Siapkan kiriman berikutnya.",
    data: { label: "Pengajuan Keripik Tempe Sanan", href: `/admin/pengajuan/${applicationId(1005)}` },
    email_status: "pending",
    email_attempts: 0,
    email_error: null,
    read_at: null,
    created_at: "2026-11-04T15:40:00+07:00",
  },
  {
    id: uid("notif-6"),
    user: userRef("sri"),
    type: "announcement",
    title: "Jadwal pilot diperpanjang",
    body: "Masa pilot Rak Lokal diperpanjang hingga 31 Desember 2026. Terima kasih atas partisipasinya!",
    data: null,
    email_status: "sent",
    email_attempts: 1,
    email_error: null,
    read_at: "2026-11-01T08:00:00+07:00",
    created_at: "2026-10-31T16:00:00+07:00",
  },
  {
    id: uid("notif-7"),
    user: userRef("bayu"),
    type: "application_approved",
    title: "Pengajuan disetujui Toko Sumber Rejeki",
    body: "Antar barang pada Kamis, 5 Nov 2026, 08.00–10.00.",
    data: { label: "Pengajuan Kopi Lereng Arjuno", href: `/admin/pengajuan/${applicationId(1003)}` },
    email_status: "skipped",
    email_attempts: 0,
    email_error: null,
    read_at: "2026-11-03T12:00:00+07:00",
    created_at: "2026-11-03T11:30:00+07:00",
  },
  {
    id: uid("notif-8"),
    user: userRef("hendra"),
    type: "application_status_changed",
    title: "Pengingat antar besok",
    body: "Dapur Mbok Darmi dijadwalkan antar Kamis, 5 Nov 2026, 08.00–10.00.",
    data: { label: "Pengajuan Dapur Mbok Darmi", href: `/admin/pengajuan/${applicationId(202)}` },
    email_status: "sent",
    email_attempts: 1,
    email_error: null,
    read_at: null,
    created_at: "2026-11-04T07:30:00+07:00",
  },
]

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

const ADMIN_REFS = { aran: ADMIN_ME, nadia: NADIA, rizky: RIZKY }
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"

function log(
  n: number,
  who: keyof typeof ADMIN_REFS,
  action: AuditAction,
  target_type: TargetType,
  target_id: string,
  target_label: string,
  target_href: string | null,
  reason: string,
  created_at: string,
  changes: AuditLog["changes"] = [],
): AuditLog {
  return {
    id: uid(`audit-${n}`),
    admin: { id: ADMIN_REFS[who].id, name: ADMIN_REFS[who].name },
    action,
    target_type,
    target_id,
    target_label,
    target_href,
    reason,
    changes,
    ip_address: who === "aran" ? "103.147.8.21" : who === "nadia" ? "182.253.40.117" : "36.72.215.9",
    user_agent: UA,
    created_at,
  }
}

const yohanes = userId("yohanes")
const sambal = applicationId(1005)

export const AUDIT_LOGS: AuditLog[] = [
  log(1, "nadia", "stock_correction", "application", sambal, "Keripik Tempe Sanan → Toko Sumber Rejeki", `/admin/pengajuan/${sambal}`, "Hasil cek fisik rak 3 Nov: stok tinggal 4 bungkus.", "2026-11-03T17:10:00+07:00", [
    { field: "items[0].stock_quantity", before: "9", after: "4" },
  ]),
  log(2, "aran", "suspend", "user", yohanes, "Yohanes Kurniawan", `/admin/pengguna/${yohanes}`, "Laporan UMKM: barang diterima tetapi tidak dipajang di rak selama 2 minggu.", "2026-11-02T10:20:00+07:00", [
    { field: "status", before: "active", after: "suspended" },
  ]),
  log(3, "rizky", "verify_legal", "umkm", umkmId(23), "Kopi Lereng Arjuno", `/admin/pengguna/${userId("bayu")}?tab=umkm`, "Nomor NIB tidak cocok dengan dokumen yang diunggah.", "2026-10-30T14:00:00+07:00", [
    { field: "legal_verification.nib.status", before: "pending", after: "rejected" },
  ]),
  log(4, "nadia", "invite", "user", userId("fajar"), "Fajar Nugroho", `/admin/pengguna/${userId("fajar")}`, "Peserta pilot gelombang 2 (toko).", "2026-11-04T09:30:00+07:00"),
  log(5, "aran", "invite", "user", userId("dewi"), "Dewi Anggraini", `/admin/pengguna/${userId("dewi")}`, "Peserta pilot gelombang 2 (UMKM).", "2026-11-03T13:00:00+07:00"),
  log(6, "nadia", "delete", "user", userId("lina"), "Lina Marlina", `/admin/pengguna/${userId("lina")}`, "Permintaan pemilik: berhenti ikut pilot.", "2026-10-25T11:00:00+07:00", [
    { field: "deleted_at", before: null, after: "2026-10-25T11:00:00+07:00" },
  ]),
  log(7, "aran", "delete", "opportunity", oppId(115), "Frozen food untuk freezer dekat kasir", `/admin/peluang/${oppId(115)}`, "Duplikat peluang, dibuat ulang oleh toko.", "2026-10-21T09:00:00+07:00"),
  log(8, "nadia", "create", "opportunity", oppId(112), "Oleh-oleh khas Malang untuk wisatawan", `/admin/peluang/${oppId(112)}`, "Dibuat atas permintaan toko via WhatsApp.", "2026-10-15T10:00:00+07:00"),
  log(9, "rizky", "create", "product", productId(406), "Kastengel 250 g", `/admin/produk/${productId(406)}`, "Input data awal dari formulir kertas UMKM.", "2026-10-11T10:00:00+07:00"),
  log(10, "aran", "update", "opportunity", oppId(101), "Cari camilan lokal untuk rak dekat kasir", `/admin/peluang/${oppId(101)}`, "Toko minta kuota ditambah.", "2026-10-28T15:00:00+07:00", [
    { field: "quota", before: "3", after: "5" },
    { field: "valid_until", before: "2026-11-15", after: "2026-11-30" },
  ]),
  log(11, "nadia", "resend_email", "notification", uid("notif-4"), "NIB ditolak → Bayu Pratama", "/admin/notifikasi?tab=log", "", "2026-10-31T08:00:00+07:00"),
  log(12, "aran", "broadcast", "notification", uid("notif-6"), "Jadwal pilot diperpanjang", "/admin/notifikasi?tab=log&type=announcement", "Pengumuman perpanjangan pilot.", "2026-10-31T16:00:00+07:00"),
  log(13, "aran", "grant_admin", "user", RIZKY.id, RIZKY.name, `/admin/pengguna/${RIZKY.id}`, "Tim operasional lapangan.", "2026-09-10T10:05:00+07:00", [
    { field: "is_admin", before: "false", after: "true" },
    { field: "admin_role", before: null, after: "staff" },
  ]),
  log(14, "aran", "grant_admin", "user", NADIA.id, NADIA.name, `/admin/pengguna/${NADIA.id}`, "Koordinator pilot.", "2026-09-02T10:05:00+07:00", [
    { field: "is_admin", before: "false", after: "true" },
    { field: "admin_role", before: null, after: "staff" },
  ]),
  log(15, "nadia", "export", "application", "applications", "Ekspor pengajuan (Okt 2026)", null, "Laporan bulanan pilot.", "2026-11-01T09:00:00+07:00"),
  log(16, "rizky", "remove_file", "file", uid("file-product-4"), "Foto produk Nastar Keju 250 g", "/admin/file", "Foto memuat nomor telepon pribadi.", "2026-10-27T13:00:00+07:00"),
  log(17, "nadia", "force_status", "application", applicationId(1006), "Kopi Lereng Arjuno → Toko Sumber Rejeki", `/admin/pengajuan/${applicationId(1006)}`, "UMKM konfirmasi via telepon barang sudah diterima.", "2026-11-03T16:45:00+07:00", [
    { field: "status", before: "in_delivery", after: "received" },
  ]),
].sort((a, b) => b.created_at.localeCompare(a.created_at))

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

const countBy = (s: ApplicationStatus) => ADMIN_APPLICATIONS.filter((a) => a.status === s).length

export const DASHBOARD = {
  updated_at: "2026-11-04T15:58:00+07:00",
  attention: {
    legal_pending: ADMIN_UMKMS.filter((u) => Object.values(u.legal_verification).some((v) => v.status === "pending")).length,
    applications_waiting_over_48h: ADMIN_APPLICATIONS.filter(
      (a) => a.status === "submitted" && new Date(a.created_at).getTime() < new Date(NOW_ISO).getTime() - 48 * 3600_000,
    ).length,
    deliveries_today: ADMIN_APPLICATIONS.filter((a) => a.delivery_slot?.date === TODAY).length,
    emails_failed_24h: ADMIN_NOTIFICATIONS.filter((n) => n.email_status === "failed" && n.created_at >= "2026-11-03T16:00:00+07:00").length,
  },
  users: {
    total: ADMIN_USERS.filter((u) => !u.deleted_at).length,
    store: ADMIN_USERS.filter((u) => u.store_profile && !u.deleted_at).length,
    umkm: ADMIN_USERS.filter((u) => u.umkm_profile && !u.deleted_at).length,
    invited: ADMIN_USERS.filter((u) => u.status === "invited").length,
    suspended: ADMIN_USERS.filter((u) => u.status === "suspended").length,
  },
  opportunities: {
    open: ADMIN_OPPORTUNITIES.filter((o) => o.status === "open" && !o.deleted_at).length,
    full: ADMIN_OPPORTUNITIES.filter((o) => o.status === "full" && !o.deleted_at).length,
    closed: ADMIN_OPPORTUNITIES.filter((o) => o.status === "closed" && !o.deleted_at).length,
  },
  products: {
    active: ADMIN_PRODUCTS.filter((p) => p.is_active).length,
    archived: ADMIN_PRODUCTS.filter((p) => !p.is_active).length,
  },
  stock: {
    items_on_shelf: ADMIN_STOCK.length,
    out_of_stock: ADMIN_STOCK.filter((s) => s.stock_status === "out_of_stock").length,
  },
  applications: {
    by_status: {
      submitted: countBy("submitted"),
      approved: countBy("approved"),
      in_delivery: countBy("in_delivery"),
      received: countBy("received"),
      completed: countBy("completed"),
      rejected: countBy("rejected"),
      cancelled: countBy("cancelled"),
    } as Record<ApplicationStatus, number>,
    created_in_period: ADMIN_APPLICATIONS.length,
    approval_rate: 78,
    median_hours_to_review: 9.5,
  },
  recent_activity: ([
    ...ADMIN_APPLICATIONS.map(
      (a): ActivityItem => ({
        id: `a-${a.id}`,
        kind: "application",
        label: `${a.umkm.business_name} → ${a.store.name}: ${a.timeline.at(-1)!.label.toLowerCase()}`,
        href: `/admin/pengajuan/${a.id}`,
        created_at: a.updated_at,
      }),
    ),
    ...ADMIN_USERS.filter((u) => u.status === "invited").map(
      (u): ActivityItem => ({
        id: `u-${u.id}`,
        kind: "user",
        label: `${u.name} diundang ke pilot`,
        href: `/admin/pengguna/${u.id}`,
        created_at: u.created_at,
      }),
    ),
    {
      id: "o-101",
      kind: "opportunity",
      label: "Toko Sumber Rejeki memperbarui peluang Cari camilan lokal",
      href: `/admin/peluang/${oppId(101)}`,
      created_at: "2026-10-28T15:00:00+07:00",
    },
    {
      id: "p-406",
      kind: "product",
      label: "Kastengel 250 g ditambahkan untuk Kue Kering Ummi Hana",
      href: `/admin/produk/${productId(406)}`,
      created_at: "2026-10-11T10:00:00+07:00",
    },
  ] as ActivityItem[])
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20),
}

/** Sidebar badges. */
export const BADGES = {
  legal: DASHBOARD.attention.legal_pending,
  applications: DASHBOARD.attention.applications_waiting_over_48h,
  notifications: DASHBOARD.attention.emails_failed_24h,
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export const findUser = (id: string) => ADMIN_USERS.find((u) => u.id === id)
export const findStore = (id: string) => ADMIN_STORES.find((s) => s.id === id)
export const findUmkm = (id: string) => ADMIN_UMKMS.find((u) => u.id === id)
export const findOpportunity = (id: string) => ADMIN_OPPORTUNITIES.find((o) => o.id === id)
export const findProduct = (id: string) => ADMIN_PRODUCTS.find((p) => p.id === id)
export const findApplication = (id: string) => ADMIN_APPLICATIONS.find((a) => a.id === id)

export const auditFor = (type: TargetType, id: string) =>
  AUDIT_LOGS.filter((l) => l.target_type === type && l.target_id === id)

export const auditBy = (adminId: string) => AUDIT_LOGS.filter((l) => l.admin.id === adminId)
