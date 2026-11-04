/**
 * Static mock data so every page renders without the API.
 * Shapes follow docs/frontend-specs.md; swap for real fetches later.
 */
import { calcCommission } from "@/lib/format"
import type {
  AppNotification,
  Application,
  ApplicationAction,
  ApplicationItem,
  ApplicationStatus,
  Category,
  Me,
  OperatingHour,
  Opportunity,
  Product,
  Role,
  StockRow,
  Store,
  TimelineEvent,
  Umkm,
} from "@/lib/types"

export const CATEGORIES: Category[] = [
  { id: 1, name: "Camilan" },
  { id: 2, name: "Minuman" },
  { id: 3, name: "Sambal & Bumbu" },
  { id: 4, name: "Kue Kering" },
  { id: 5, name: "Kopi & Teh" },
  { id: 6, name: "Frozen Food" },
  { id: 7, name: "Oleh-oleh" },
]
const cat = (id: number) => CATEGORIES.find((c) => c.id === id)!

export const ME: Me = {
  id: 1,
  name: "Rina Wulandari",
  email: "rina.wulandari@contoh.id",
  avatar_url: null,
  roles: ["store", "umkm"],
  onboarding: { store_completed: true, umkm_completed: true },
}

const hours = (closedDays: string[] = ["sun"], open = "07:00", close = "21:00"): OperatingHour[] =>
  (["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map((day) => ({
    day,
    open,
    close,
    is_closed: closedDays.includes(day),
  }))

export const MY_STORE: Store = {
  id: 10,
  name: "Toko Sumber Rejeki",
  phone: "081234567890",
  address: "Jl. Soekarno Hatta No. 12, Lowokwaru, Malang",
  lat: -7.9467,
  lng: 112.6159,
  operating_hours: hours(["sun"]),
  updated_at: "2026-10-28T09:12:00+07:00",
}

const STORES: Store[] = [
  {
    id: 11,
    name: "Minimarket Berkah Jaya",
    phone: "081298765432",
    address: "Jl. MT Haryono No. 45, Dinoyo, Malang",
    lat: -7.94,
    lng: 112.61,
    distance_km: 1.8,
    operating_hours: hours([], "06:00", "22:00"),
    updated_at: "2026-10-20T10:00:00+07:00",
  },
  {
    id: 12,
    name: "Toko Kelontong Bu Sri",
    phone: "085711223344",
    address: "Jl. Kalpataru No. 8, Jatimulyo, Malang",
    lat: -7.93,
    lng: 112.62,
    distance_km: 3.6,
    operating_hours: hours(["fri"]),
    updated_at: "2026-10-18T10:00:00+07:00",
  },
  {
    id: 13,
    name: "Swalayan Sinar Mas",
    phone: "082199887766",
    address: "Jl. Borobudur No. 21, Blimbing, Malang",
    lat: -7.95,
    lng: 112.64,
    distance_km: 4.7,
    operating_hours: hours([], "08:00", "21:00"),
    updated_at: "2026-10-11T10:00:00+07:00",
  },
]

const legal = (nib: boolean, pirt: boolean, halal: boolean) => ({
  nib: nib ? "9120301234567" : null,
  pirt_number: pirt ? "2063573010123-25" : null,
  halal_number: halal ? "ID35110000123450824" : null,
  has_nib: nib,
  has_pirt: pirt,
  has_halal: halal,
})

export const MY_UMKM: Umkm = {
  id: 20,
  business_name: "Dapur Mbok Darmi",
  owner_name: "Rina Wulandari",
  phone: "081234567890",
  description: "Camilan rumahan dari resep keluarga sejak 1998. Tanpa pengawet, digoreng setiap pagi.",
  address: "Jl. Sanan Gg. 3 No. 17, Purwantoro, Malang",
  legal: legal(true, false, true),
  updated_at: "2026-10-30T14:20:00+07:00",
}

const UMKMS: Umkm[] = [
  {
    id: 21,
    business_name: "Keripik Tempe Sanan",
    owner_name: "Agus Salim",
    phone: "081377788899",
    description: "Keripik tempe tipis renyah khas Sanan.",
    address: "Jl. Sanan No. 5, Malang",
    legal: legal(true, true, true),
    updated_at: "2026-10-01T10:00:00+07:00",
  },
  {
    id: 22,
    business_name: "Sambal Bu Rudy KW",
    owner_name: "Siti Rahma",
    phone: "081355566677",
    description: "Sambal bawang dan sambal ijo dalam botol kaca.",
    address: "Jl. Ijen No. 30, Malang",
    legal: legal(true, true, false),
    updated_at: "2026-10-01T10:00:00+07:00",
  },
  {
    id: 23,
    business_name: "Kopi Lereng Arjuno",
    owner_name: "Bayu Pratama",
    phone: "081322233344",
    description: "Kopi robusta petik merah dari lereng Arjuno.",
    address: "Jl. Raya Karangploso No. 2, Malang",
    legal: legal(true, false, false),
    updated_at: "2026-10-01T10:00:00+07:00",
  },
  {
    id: 24,
    business_name: "Kue Kering Ummi Hana",
    owner_name: "Hana Lestari",
    phone: "081311122233",
    description: "Kue kering mentega untuk camilan harian.",
    address: "Jl. Bandung No. 4, Malang",
    legal: legal(false, true, true),
    updated_at: "2026-10-01T10:00:00+07:00",
  },
]

const product = (p: Partial<Product> & Pick<Product, "id" | "name" | "category">): Product => ({
  description: "",
  tags: [],
  base_price: 10000,
  suggested_retail_price: 12500,
  shelf_life_days: 90,
  expiry_date: null,
  active_placements: 0,
  is_active: true,
  photo_count: 3,
  ...p,
})

export const MY_PRODUCTS: Product[] = [
  product({
    id: 301,
    name: "Keripik Tempe Pedas 100 g",
    category: cat(1),
    description: "Keripik tempe tipis dengan bumbu cabai rawit asli.",
    tags: ["pedas", "oleh-oleh"],
    base_price: 9500,
    suggested_retail_price: 12500,
    shelf_life_days: 90,
    active_placements: 2,
  }),
  product({
    id: 302,
    name: "Keripik Singkong Balado 150 g",
    category: cat(1),
    tags: ["balado"],
    base_price: 8000,
    suggested_retail_price: 11000,
    shelf_life_days: 60,
    active_placements: 1,
  }),
  product({
    id: 303,
    name: "Sambal Bawang Mbok Darmi 150 ml",
    category: cat(3),
    tags: ["sambal", "pedas"],
    base_price: 18000,
    suggested_retail_price: 25000,
    shelf_life_days: 30,
    active_placements: 0,
  }),
  product({
    id: 304,
    name: "Nastar Keju 250 g",
    category: cat(4),
    base_price: 42000,
    suggested_retail_price: 55000,
    shelf_life_days: null,
    expiry_date: "2027-01-15",
    active_placements: 1,
  }),
  product({
    id: 305,
    name: "Rempeyek Kacang 200 g",
    category: cat(1),
    base_price: 11000,
    suggested_retail_price: 15000,
    shelf_life_days: 45,
    is_active: false,
  }),
]

const OTHER_PRODUCTS: Product[] = [
  product({ id: 401, name: "Keripik Tempe Original 100 g", category: cat(1), base_price: 9000, suggested_retail_price: 12000 }),
  product({ id: 402, name: "Keripik Tempe Rumput Laut 100 g", category: cat(1), base_price: 9500, suggested_retail_price: 12500 }),
  product({ id: 403, name: "Sambal Ijo 200 ml", category: cat(3), base_price: 20000, suggested_retail_price: 27000, shelf_life_days: 30 }),
  product({ id: 404, name: "Kopi Robusta Bubuk 200 g", category: cat(5), base_price: 32000, suggested_retail_price: 42000, shelf_life_days: 180 }),
  product({ id: 405, name: "Kopi Arabika Biji 250 g", category: cat(5), base_price: 58000, suggested_retail_price: 75000, shelf_life_days: 180 }),
  product({ id: 406, name: "Kastengel 250 g", category: cat(4), base_price: 45000, suggested_retail_price: 60000, shelf_life_days: 60 }),
]
const other = (id: number) => OTHER_PRODUCTS.find((p) => p.id === id)!
const mine = (id: number) => MY_PRODUCTS.find((p) => p.id === id)!

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------

const schedule = {
  monThu: [
    { day: "mon" as const, start: "08:00", end: "10:00" },
    { day: "thu" as const, start: "08:00", end: "10:00" },
  ],
  weekday: [
    { day: "tue" as const, start: "09:00", end: "11:00" },
    { day: "fri" as const, start: "13:00", end: "15:00" },
  ],
  sat: [{ day: "sat" as const, start: "07:00", end: "09:00" }],
}

const requirements = (r: Partial<Opportunity["requirements"]> = {}): Opportunity["requirements"] => ({
  min_shelf_life_days: null,
  max_retail_price: null,
  requires_nib: false,
  requires_pirt: false,
  requires_halal: false,
  notes: "",
  ...r,
})

/** Opportunities owned by MY_STORE (store side). */
export const MY_OPPORTUNITIES: Opportunity[] = [
  {
    id: 101,
    title: "Cari camilan lokal untuk rak dekat kasir",
    description:
      "Rak 3 susun di samping kasir, cocok untuk camilan kemasan kecil. Target pembeli: pelajar dan pekerja kantoran sekitar Soekarno Hatta.",
    store: MY_STORE,
    categories: [cat(1), cat(4)],
    requirements: requirements({
      min_shelf_life_days: 30,
      max_retail_price: 20000,
      requires_nib: true,
      notes: "Kemasan wajib mencantumkan komposisi dan tanggal produksi.",
    }),
    quota: 3,
    quota_used: 1,
    quota_remaining: 2,
    max_products_per_umkm: 3,
    commission: { type: "percent", value: 15 },
    receiving_schedule: schedule.monThu,
    valid_until: "2026-12-04",
    status: "open",
    created_at: "2026-10-20T09:00:00+07:00",
    application_counts: { submitted: 2, approved: 1, in_delivery: 1, received: 1, completed: 1, rejected: 1 },
  },
  {
    id: 102,
    title: "Kopi bubuk & minuman kemasan lokal",
    description: "Mengisi rak minuman dekat pintu masuk.",
    store: MY_STORE,
    categories: [cat(2), cat(5)],
    requirements: requirements({ min_shelf_life_days: 90, requires_pirt: true }),
    quota: 2,
    quota_used: 2,
    quota_remaining: 0,
    max_products_per_umkm: 2,
    commission: { type: "fixed", value: 2000 },
    receiving_schedule: schedule.weekday,
    valid_until: "2026-11-30",
    status: "full",
    created_at: "2026-10-05T09:00:00+07:00",
    application_counts: { submitted: 0, received: 2, cancelled: 1 },
  },
  {
    id: 103,
    title: "Sambal botol untuk rak bumbu",
    description: "Rak bumbu dapur, maksimal 6 botol per varian.",
    store: MY_STORE,
    categories: [cat(3)],
    requirements: requirements({ requires_halal: true, requires_pirt: true }),
    quota: 2,
    quota_used: 1,
    quota_remaining: 1,
    max_products_per_umkm: 2,
    commission: { type: "percent", value: 10 },
    receiving_schedule: schedule.sat,
    valid_until: "2026-10-31",
    status: "closed",
    created_at: "2026-09-01T09:00:00+07:00",
    application_counts: { completed: 1, rejected: 1 },
  },
]

/** Opportunities from other stores, as seen in the UMKM feed. */
export const FEED_OPPORTUNITIES: Opportunity[] = [
  {
    id: 111,
    title: "Camilan pedas untuk rak depan",
    description: "Rak depan dekat pintu masuk, ramai pembeli sore hari.",
    store: STORES[0],
    categories: [cat(1)],
    requirements: requirements({ min_shelf_life_days: 30, max_retail_price: 15000, requires_nib: true }),
    quota: 3,
    quota_used: 1,
    quota_remaining: 2,
    max_products_per_umkm: 3,
    commission: { type: "percent", value: 15 },
    receiving_schedule: schedule.monThu,
    valid_until: "2026-12-10",
    status: "open",
    created_at: "2026-11-02T09:00:00+07:00",
    application_counts: {},
    match: {
      level: "high",
      score: 85,
      reasons: [
        { ok: true, label: "Kategori Camilan sesuai produk Anda" },
        { ok: true, label: "Jarak 1,8 km dari lokasi usaha" },
        { ok: true, label: "Anda memiliki NIB" },
        { ok: true, label: "2 produk memenuhi harga jual maksimal" },
      ],
    },
    my_application: null,
  },
  {
    id: 112,
    title: "Oleh-oleh khas Malang untuk wisatawan",
    description: "Rak oleh-oleh khusus akhir pekan.",
    store: STORES[1],
    categories: [cat(1), cat(7)],
    requirements: requirements({ min_shelf_life_days: 60, requires_pirt: true }),
    quota: 5,
    quota_used: 3,
    quota_remaining: 2,
    max_products_per_umkm: 2,
    commission: { type: "fixed", value: 2000 },
    receiving_schedule: schedule.sat,
    valid_until: "2026-12-20",
    status: "open",
    created_at: "2026-10-30T09:00:00+07:00",
    application_counts: {},
    match: {
      level: "medium",
      score: 64,
      reasons: [
        { ok: true, label: "Kategori Camilan sesuai produk Anda" },
        { ok: true, label: "Jarak 3,6 km dari lokasi usaha" },
        { ok: false, label: "Toko mensyaratkan PIRT" },
      ],
    },
    my_application: null,
  },
  {
    id: 113,
    title: "Kue kering untuk rak premium",
    description: "Rak premium dengan pencahayaan khusus.",
    store: STORES[2],
    categories: [cat(4)],
    requirements: requirements({ requires_halal: true, max_retail_price: 70000 }),
    quota: 2,
    quota_used: 0,
    quota_remaining: 2,
    max_products_per_umkm: 2,
    commission: { type: "percent", value: 20 },
    receiving_schedule: schedule.weekday,
    valid_until: "2026-11-25",
    status: "open",
    created_at: "2026-10-28T09:00:00+07:00",
    application_counts: {},
    match: {
      level: "high",
      score: 78,
      reasons: [
        { ok: true, label: "Kategori Kue Kering sesuai produk Anda" },
        { ok: true, label: "Anda memiliki sertifikat halal" },
        { ok: false, label: "Jarak 4,7 km, sedikit di luar radius favorit" },
      ],
    },
    my_application: { id: 201, status: "submitted" },
  },
  {
    id: 114,
    title: "Sambal dan bumbu untuk rak dapur",
    description: "Butuh sambal botol dengan label lengkap.",
    store: STORES[0],
    categories: [cat(3)],
    requirements: requirements({ requires_pirt: true, requires_halal: true, min_shelf_life_days: 60 }),
    quota: 2,
    quota_used: 1,
    quota_remaining: 1,
    max_products_per_umkm: 1,
    commission: { type: "percent", value: 12 },
    receiving_schedule: schedule.weekday,
    valid_until: "2026-12-01",
    status: "open",
    created_at: "2026-10-25T09:00:00+07:00",
    application_counts: {},
    match: {
      level: "low",
      score: 32,
      reasons: [
        { ok: true, label: "Kategori Sambal & Bumbu sesuai produk Anda" },
        { ok: false, label: "Toko mensyaratkan PIRT" },
        { ok: false, label: "Masa simpan produk Anda di bawah 60 hari" },
      ],
    },
    my_application: null,
  },
]

export const ALL_OPPORTUNITIES = [...MY_OPPORTUNITIES, ...FEED_OPPORTUNITIES]

export function getOpportunity(id: number) {
  return ALL_OPPORTUNITIES.find((o) => o.id === id)
}

/** Eligibility of my products for an opportunity (P16 "Pilih produk"). */
export function productEligibility(opp: Opportunity, p: Product) {
  const reasons: string[] = []
  if (!p.is_active) reasons.push("Produk diarsipkan")
  if (!opp.categories.some((c) => c.id === p.category.id))
    reasons.push(`Kategori ${p.category.name} tidak dicari toko ini`)
  const r = opp.requirements
  if (r.min_shelf_life_days && p.shelf_life_days !== null && p.shelf_life_days < r.min_shelf_life_days)
    reasons.push(`Masa simpan kurang dari ${r.min_shelf_life_days} hari`)
  if (r.max_retail_price && p.suggested_retail_price > r.max_retail_price)
    reasons.push("Harga jual melebihi batas toko")
  if (r.requires_pirt && !MY_UMKM.legal.has_pirt) reasons.push("Belum memiliki PIRT")
  return { eligible: reasons.length === 0, ineligible_reasons: reasons }
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

function item(
  id: number,
  p: Product,
  status: ApplicationStatus,
  opts: {
    decision?: "approved" | "rejected" | "pending"
    qty?: number
    reason?: string
    stock?: number | null
    out?: boolean
    stockUpdated?: string
  } = {},
  commission: Opportunity["commission"] = { type: "percent", value: 15 },
): ApplicationItem {
  const decided = status !== "submitted"
  const decision = opts.decision ?? (decided ? "approved" : "pending")
  const approved = decision === "approved"
  const sell = approved ? p.suggested_retail_price : null
  const calc = sell ? calcCommission(sell, commission) : null
  const onShelf = status === "received" || status === "completed"
  const qty = opts.qty ?? 24
  const stock = opts.out ? 0 : (opts.stock ?? Math.round(qty * 0.6))
  return {
    id,
    product: p,
    decision,
    approved_quantity: approved ? qty : null,
    sell_price: sell,
    commission_per_unit: calc?.commission ?? null,
    umkm_income_per_unit: calc?.income ?? null,
    reject_reason: decision === "rejected" ? (opts.reason ?? "Harga tidak sesuai") : null,
    received_quantity: onShelf && approved ? qty : null,
    stock_quantity: onShelf && approved ? stock : null,
    stock_status: onShelf && approved ? (stock === 0 ? "out_of_stock" : "available") : null,
    stock_updated_at: onShelf && approved ? (opts.stockUpdated ?? "2026-11-04T11:20:00+07:00") : null,
  }
}

export function actionsFor(status: ApplicationStatus, role: Role): ApplicationAction[] {
  const map: Record<ApplicationStatus, Record<Role, ApplicationAction[]>> = {
    submitted: { store: ["review"], umkm: ["cancel"] },
    approved: { store: ["cancel"], umkm: ["ship", "cancel"] },
    in_delivery: { store: ["receive"], umkm: [] },
    received: { store: ["update_stock", "complete"], umkm: ["complete"] },
    completed: { store: [], umkm: [] },
    rejected: { store: [], umkm: [] },
    cancelled: { store: [], umkm: [] },
  }
  return map[status][role]
}

type AppSeed = Omit<Application, "available_actions" | "opportunity" | "stock_mode"> & {
  opp: Opportunity
  stock_mode?: Application["stock_mode"]
}

function app(seed: AppSeed, viewer: Role): Application {
  const { opp, ...rest } = seed
  return {
    stock_mode: "count",
    ...rest,
    opportunity: {
      id: opp.id,
      title: opp.title,
      commission: opp.commission,
      receiving_schedule: opp.receiving_schedule,
    },
    available_actions: actionsFor(seed.status, viewer),
  }
}

const opp101 = MY_OPPORTUNITIES[0]
const opp102 = MY_OPPORTUNITIES[1]
const opp103 = MY_OPPORTUNITIES[2]

/** Applications received by MY_STORE. */
export const STORE_APPLICATIONS: Application[] = [
  app(
    {
      id: 1001,
      opp: opp101,
      store: MY_STORE,
      umkm: UMKMS[0],
      status: "submitted",
      items: [item(1, other(401), "submitted"), item(2, other(402), "submitted")],
      note: "Kapasitas produksi 200 bungkus per minggu. Bisa antar Senin pagi.",
      review_note: "",
      delivery_slot: null,
      created_at: "2026-11-04T14:55:00+07:00",
      updated_at: "2026-11-04T14:55:00+07:00",
    },
    "store",
  ),
  app(
    {
      id: 1002,
      opp: opp101,
      store: MY_STORE,
      umkm: UMKMS[3],
      status: "submitted",
      items: [item(3, other(406), "submitted")],
      note: "",
      review_note: "",
      delivery_slot: null,
      created_at: "2026-11-04T09:10:00+07:00",
      updated_at: "2026-11-04T09:10:00+07:00",
    },
    "store",
  ),
  app(
    {
      id: 1003,
      opp: opp102,
      store: MY_STORE,
      umkm: UMKMS[2],
      status: "approved",
      items: [item(4, other(404), "approved", { qty: 12 }, opp102.commission)],
      note: "",
      review_note: "Mohon bawa nota serah terima rangkap dua.",
      delivery_slot: { date: "2026-11-04", start: "13:00", end: "15:00" },
      created_at: "2026-10-30T10:00:00+07:00",
      updated_at: "2026-11-02T08:30:00+07:00",
    },
    "store",
  ),
  app(
    {
      id: 1004,
      opp: opp101,
      store: MY_STORE,
      umkm: MY_UMKM,
      status: "in_delivery",
      items: [item(5, mine(302), "in_delivery", { qty: 20 })],
      note: "",
      review_note: "",
      delivery_slot: { date: "2026-11-05", start: "08:00", end: "10:00" },
      created_at: "2026-10-28T10:00:00+07:00",
      updated_at: "2026-11-04T07:45:00+07:00",
    },
    "store",
  ),
  app(
    {
      id: 1005,
      opp: opp101,
      store: MY_STORE,
      umkm: UMKMS[0],
      status: "received",
      items: [
        item(6, other(401), "received", { qty: 24, out: true, stockUpdated: "2026-11-04T10:05:00+07:00" }),
        item(7, other(402), "received", { qty: 24, stock: 18 }),
      ],
      note: "",
      review_note: "",
      delivery_slot: { date: "2026-10-26", start: "08:00", end: "10:00" },
      created_at: "2026-10-21T10:00:00+07:00",
      updated_at: "2026-11-04T10:05:00+07:00",
    },
    "store",
  ),
  app(
    {
      id: 1006,
      opp: opp102,
      store: MY_STORE,
      umkm: UMKMS[2],
      status: "received",
      stock_mode: "boolean",
      items: [item(8, other(405), "received", { qty: 10, stock: 6 }, opp102.commission)],
      note: "",
      review_note: "",
      delivery_slot: { date: "2026-10-23", start: "09:00", end: "11:00" },
      created_at: "2026-10-12T10:00:00+07:00",
      updated_at: "2026-11-03T16:40:00+07:00",
    },
    "store",
  ),
  app(
    {
      id: 1007,
      opp: opp103,
      store: MY_STORE,
      umkm: UMKMS[1],
      status: "completed",
      items: [item(9, other(403), "completed", { qty: 12, stock: 0 }, opp103.commission)],
      note: "",
      review_note: "",
      delivery_slot: { date: "2026-09-12", start: "07:00", end: "09:00" },
      created_at: "2026-09-05T10:00:00+07:00",
      updated_at: "2026-10-31T10:00:00+07:00",
    },
    "store",
  ),
  app(
    {
      id: 1008,
      opp: opp101,
      store: MY_STORE,
      umkm: UMKMS[1],
      status: "rejected",
      items: [item(10, other(403), "rejected", { decision: "rejected", reason: "Kategori sudah penuh" })],
      note: "",
      review_note: "",
      delivery_slot: null,
      created_at: "2026-10-22T10:00:00+07:00",
      updated_at: "2026-10-23T10:00:00+07:00",
    },
    "store",
  ),
]

/** Applications submitted by MY_UMKM. */
export const UMKM_APPLICATIONS: Application[] = [
  app(
    {
      id: 201,
      opp: FEED_OPPORTUNITIES[2],
      store: STORES[2],
      umkm: MY_UMKM,
      status: "submitted",
      items: [item(11, mine(304), "submitted")],
      note: "Bisa antar setiap Selasa.",
      review_note: "",
      delivery_slot: null,
      created_at: "2026-11-03T19:00:00+07:00",
      updated_at: "2026-11-03T19:00:00+07:00",
    },
    "umkm",
  ),
  app(
    {
      id: 202,
      opp: FEED_OPPORTUNITIES[0],
      store: STORES[0],
      umkm: MY_UMKM,
      status: "approved",
      items: [
        item(12, mine(301), "approved", { qty: 24 }),
        item(13, mine(302), "approved", { decision: "rejected", reason: "Harga tidak sesuai" }),
      ],
      note: "",
      review_note: "Bawa nota serah terima. Parkir di samping toko.",
      delivery_slot: { date: "2026-11-05", start: "08:00", end: "10:00" },
      created_at: "2026-11-01T10:00:00+07:00",
      updated_at: "2026-11-04T13:30:00+07:00",
    },
    "umkm",
  ),
  { ...STORE_APPLICATIONS[3], available_actions: actionsFor("in_delivery", "umkm") },
  app(
    {
      id: 204,
      opp: FEED_OPPORTUNITIES[1],
      store: STORES[1],
      umkm: MY_UMKM,
      status: "received",
      items: [
        item(14, mine(301), "received", { qty: 30, out: true, stockUpdated: "2026-11-04T15:10:00+07:00" }),
        item(15, mine(304), "received", { qty: 10, stock: 7 }),
      ],
      note: "",
      review_note: "",
      delivery_slot: { date: "2026-10-17", start: "07:00", end: "09:00" },
      created_at: "2026-10-10T10:00:00+07:00",
      updated_at: "2026-11-04T15:10:00+07:00",
    },
    "umkm",
  ),
  app(
    {
      id: 205,
      opp: FEED_OPPORTUNITIES[3],
      store: STORES[0],
      umkm: MY_UMKM,
      status: "rejected",
      items: [item(16, mine(303), "rejected", { decision: "rejected", reason: "Kemasan belum memenuhi syarat" })],
      note: "",
      review_note: "",
      delivery_slot: null,
      created_at: "2026-10-20T10:00:00+07:00",
      updated_at: "2026-10-21T10:00:00+07:00",
    },
    "umkm",
  ),
  app(
    {
      id: 206,
      opp: FEED_OPPORTUNITIES[1],
      store: STORES[1],
      umkm: MY_UMKM,
      status: "cancelled",
      items: [item(17, mine(302), "cancelled")],
      note: "",
      review_note: "",
      delivery_slot: { date: "2026-10-10", start: "07:00", end: "09:00" },
      created_at: "2026-10-01T10:00:00+07:00",
      updated_at: "2026-10-08T10:00:00+07:00",
    },
    "umkm",
  ),
]

export function getApplication(id: number) {
  return [...STORE_APPLICATIONS, ...UMKM_APPLICATIONS].find((a) => a.id === id)
}

export function applicationIds() {
  return [...new Set([...STORE_APPLICATIONS, ...UMKM_APPLICATIONS].map((a) => a.id))]
}

/** Which side the current user is on for a given application. */
export function viewerRoleFor(a: Application): Role {
  return a.store.id === MY_STORE.id ? "store" : "umkm"
}

export function applicationsAs(role: Role) {
  return role === "store" ? STORE_APPLICATIONS : UMKM_APPLICATIONS
}

const STATUS_LABEL_EVENT: Record<ApplicationStatus, string> = {
  submitted: "Pengajuan dikirim",
  approved: "Disetujui toko",
  in_delivery: "Barang dikirim",
  received: "Barang diterima toko",
  completed: "Kerja sama selesai",
  rejected: "Ditolak toko",
  cancelled: "Pengajuan dibatalkan",
}

export function getTimeline(a: Application): TimelineEvent[] {
  const path: ApplicationStatus[] = ["submitted"]
  const order: ApplicationStatus[] = ["approved", "in_delivery", "received", "completed"]
  if (a.status === "rejected") path.push("rejected")
  else if (a.status === "cancelled") path.push("approved", "cancelled")
  else path.push(...order.slice(0, order.indexOf(a.status) + 1))

  const start = new Date(a.created_at).getTime()
  const end = new Date(a.updated_at).getTime()
  const step = path.length > 1 ? (end - start) / (path.length - 1) : 0
  const storeActs: ApplicationStatus[] = ["approved", "received", "rejected"]

  return path.map((s, i) => {
    const byStore = storeActs.includes(s)
    return {
      id: i + 1,
      to_status: s,
      label: STATUS_LABEL_EVENT[s],
      actor: byStore
        ? { name: a.store.name, role: "store" as const }
        : { name: a.umkm.business_name, role: "umkm" as const },
      note:
        s === "cancelled"
          ? "Produksi terhambat karena bahan baku terlambat."
          : s === "in_delivery"
            ? "Dikirim lewat kurir Pak Joko."
            : "",
      created_at: new Date(start + step * i).toISOString(),
    }
  })
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

function stockRows(apps: Application[]): StockRow[] {
  return apps
    .filter((a) => a.status === "received")
    .flatMap((a) =>
      a.items
        .filter((i) => i.decision === "approved" && i.stock_status)
        .map((i) => ({
          application_id: a.id,
          item_id: i.id,
          product: i.product,
          store: a.store,
          umkm: a.umkm,
          sell_price: i.sell_price ?? i.product.suggested_retail_price,
          stock_mode: a.stock_mode,
          stock_quantity: i.stock_quantity,
          stock_status: i.stock_status!,
          stock_updated_at: i.stock_updated_at!,
        })),
    )
    .sort((x, y) => Number(y.stock_status === "out_of_stock") - Number(x.stock_status === "out_of_stock"))
}

export const STORE_STOCK = stockRows(STORE_APPLICATIONS)
export const UMKM_STOCK = stockRows(UMKM_APPLICATIONS)

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 1,
    type: "application_submitted",
    title: "Pengajuan baru dari Keripik Tempe Sanan",
    body: "2 produk diajukan untuk \"Cari camilan lokal untuk rak dekat kasir\".",
    is_read: false,
    created_at: "2026-11-04T14:55:00+07:00",
    data: { deeplink: "/kerja-sama/1001", role: "store" },
  },
  {
    id: 2,
    type: "stock_out",
    title: "Stok habis di Toko Kelontong Bu Sri",
    body: "Keripik Tempe Pedas 100 g habis. Hubungi toko untuk kirim ulang.",
    is_read: false,
    created_at: "2026-11-04T15:10:00+07:00",
    data: { deeplink: "/kerja-sama/204", role: "umkm" },
  },
  {
    id: 3,
    type: "application_approved",
    title: "Pengajuan disetujui Minimarket Berkah Jaya",
    body: "1 dari 2 produk disetujui. Antar pada Kam, 5 Nov 2026 · 08.00–10.00.",
    is_read: false,
    created_at: "2026-11-04T13:30:00+07:00",
    data: { deeplink: "/kerja-sama/202", role: "umkm" },
  },
  {
    id: 4,
    type: "application_status_changed",
    title: "Barang dalam perjalanan",
    body: "Dapur Mbok Darmi menandai pengajuan sebagai dikirim.",
    is_read: true,
    created_at: "2026-11-04T07:45:00+07:00",
    data: { deeplink: "/kerja-sama/1004", role: "store" },
  },
  {
    id: 5,
    type: "application_submitted",
    title: "Pengajuan baru dari Kue Kering Ummi Hana",
    body: "1 produk diajukan untuk \"Cari camilan lokal untuk rak dekat kasir\".",
    is_read: true,
    created_at: "2026-11-04T09:10:00+07:00",
    data: { deeplink: "/kerja-sama/1002", role: "store" },
  },
  {
    id: 6,
    type: "application_rejected",
    title: "Pengajuan ditolak Minimarket Berkah Jaya",
    body: "Alasan: Kemasan belum memenuhi syarat.",
    is_read: true,
    created_at: "2026-11-03T10:00:00+07:00",
    data: { deeplink: "/kerja-sama/205", role: "umkm" },
  },
  {
    id: 7,
    type: "stock_out",
    title: "Stok habis: Keripik Tempe Original 100 g",
    body: "Anda menandai produk ini habis. Keripik Tempe Sanan sudah dikabari.",
    is_read: true,
    created_at: "2026-10-28T10:05:00+07:00",
    data: { deeplink: "/kerja-sama/1005", role: "store" },
  },
]

export const UNREAD_COUNT = NOTIFICATIONS.filter((n) => !n.is_read).length
