"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  IconBell,
  IconBox,
  IconBuildingStore,
  IconCategory,
  IconChevronsLeft,
  IconChevronsRight,
  IconClipboardList,
  IconDownload,
  IconFiles,
  IconHistory,
  IconInbox,
  IconLayoutGrid,
  IconMenu2,
  IconPackage,
  IconPlant2,
  IconShieldCheck,
  IconShieldLock,
  IconTargetArrow,
  IconUsers,
  IconWifiOff,
  type Icon,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"
import { BADGES } from "@/lib/admin-mock"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Logo } from "@/components/app/logo"
import { AdminProvider, useAdmin } from "@/components/admin/admin-context"

interface NavItem {
  href: string
  label: string
  icon: Icon
  exact?: boolean
  badge?: number
  superadminOnly?: boolean
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Ringkasan", items: [{ href: "/admin", label: "Dashboard", icon: IconLayoutGrid, exact: true }] },
  {
    label: "Pengguna",
    items: [
      { href: "/admin/pengguna", label: "Pengguna", icon: IconUsers },
      { href: "/admin/toko", label: "Toko", icon: IconBuildingStore },
      { href: "/admin/umkm", label: "UMKM", icon: IconPlant2 },
      { href: "/admin/verifikasi", label: "Verifikasi legalitas", icon: IconShieldCheck, badge: BADGES.legal },
    ],
  },
  {
    label: "Kerja sama",
    items: [
      { href: "/admin/peluang", label: "Peluang", icon: IconTargetArrow },
      { href: "/admin/produk", label: "Produk", icon: IconBox },
      { href: "/admin/pengajuan", label: "Pengajuan", icon: IconInbox, badge: BADGES.applications },
      { href: "/admin/stok", label: "Stok", icon: IconPackage },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/kategori", label: "Kategori", icon: IconCategory },
      { href: "/admin/file", label: "File", icon: IconFiles },
      { href: "/admin/notifikasi", label: "Notifikasi", icon: IconBell, badge: BADGES.notifications },
      { href: "/admin/audit", label: "Audit log", icon: IconHistory },
      { href: "/admin/ekspor", label: "Ekspor", icon: IconDownload },
      { href: "/admin/admin", label: "Admin & akses", icon: IconShieldLock, superadminOnly: true },
    ],
  },
]

function isActive(pathname: string | null, item: NavItem) {
  if (!pathname) return false
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

const MobileNavContext = React.createContext<() => void>(() => {})

/** Client wrapper for every /admin page except A01: sidebar, banners, idle logout. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <ShellFrame>{children}</ShellFrame>
    </AdminProvider>
  )
}

function ShellFrame({ children }: { children: React.ReactNode }) {
  const { collapsed } = useAdmin()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const offline = useOffline()

  return (
    <MobileNavContext.Provider value={() => setMobileOpen(true)}>
      <div
        data-offline={offline || undefined}
        style={{ "--admin-sidebar": collapsed ? "4rem" : "15rem" } as React.CSSProperties}
        className="flex min-h-svh flex-1 flex-col bg-muted data-offline:**:[[data-slot=button][data-save]]:pointer-events-none data-offline:**:[[data-slot=button][data-save]]:opacity-50"
      >
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden flex-col border-r bg-background transition-[width] duration-200 lg:flex",
            collapsed ? "w-16" : "w-60"
          )}
        >
          <SidebarContents collapsed={collapsed} />
        </aside>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
            <SheetTitle className="sr-only">Navigasi admin</SheetTitle>
            <SidebarContents collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className={cn("flex min-w-0 flex-1 flex-col transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-60")}>
          {offline && (
            <div role="status" className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-foreground px-4 py-2 text-xs text-background">
              <IconWifiOff className="size-3.5" />
              Anda sedang offline. Perubahan tidak bisa disimpan.
            </div>
          )}
          <IdleGuard />
          {children}
        </div>
      </div>
    </MobileNavContext.Provider>
  )
}

function SidebarContents({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { isSuperadmin, setCollapsed } = useAdmin()
  return (
    <>
      <div className={cn("flex h-16 shrink-0 items-center border-b", collapsed ? "justify-center px-2" : "justify-between px-5")}>
        {collapsed ? (
          <Link href="/admin" aria-label="Dashboard" className="grid size-8 grid-cols-2 gap-0.5 bg-primary p-1.5">
            <span className="bg-primary-foreground" />
            <span className="bg-primary-foreground/50" />
            <span className="bg-primary-foreground/50" />
            <span className="bg-primary-foreground" />
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Logo href="/admin" />
            <span className="bg-foreground px-1.5 py-0.5 text-[0.5625rem] font-semibold tracking-widest text-background uppercase">
              Admin
            </span>
          </div>
        )}
      </div>
      <nav className={cn("flex flex-1 flex-col gap-5 overflow-y-auto py-5", collapsed ? "px-2" : "px-3")}>
        {NAV_GROUPS.map((g) => (
          <div key={g.label} className="flex flex-col gap-0.5">
            {collapsed ? (
              <span className="mx-auto mb-1 h-px w-6 bg-border" aria-hidden />
            ) : (
              <p className="px-3 pb-1.5 text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">{g.label}</p>
            )}
            {g.items
              .filter((i) => !i.superadminOnly || isSuperadmin)
              .map((item) => (
                <React.Suspense key={item.href} fallback={<NavLink item={item} collapsed={collapsed} active={false} />}>
                  <ActiveNavLink item={item} collapsed={collapsed} onNavigate={onNavigate} />
                </React.Suspense>
              ))}
          </div>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "hidden h-12 shrink-0 items-center gap-3 border-t text-xs font-semibold tracking-widest text-muted-foreground uppercase outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted lg:flex",
          collapsed ? "justify-center" : "px-6"
        )}
        aria-label={collapsed ? "Lebarkan sidebar" : "Ciutkan sidebar"}
      >
        {collapsed ? <IconChevronsRight className="size-4" /> : <IconChevronsLeft className="size-4" />}
        {!collapsed && "Ciutkan"}
      </button>
    </>
  )
}

/** usePathname suspends on unknown dynamic params, so it lives under <Suspense>. */
function ActiveNavLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()
  return <NavLink item={item} collapsed={collapsed} active={isActive(pathname, item)} onNavigate={onNavigate} />
}

function NavLink({
  item,
  collapsed,
  active,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  active: boolean
  onNavigate?: () => void
}) {
  const badge = item.badge ? (
    <span
      className={cn(
        "flex h-4 min-w-4 items-center justify-center bg-destructive px-1 text-[0.625rem] leading-none font-semibold text-white",
        collapsed && "absolute top-1 right-1"
      )}
    >
      {formatCount(item.badge)}
    </span>
  ) : null

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "relative flex items-center gap-3 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30",
        collapsed ? "size-12 justify-center" : "px-3 py-2",
        active ? "bg-muted font-medium text-foreground" : "text-foreground/75"
      )}
    >
      {active && <span className="absolute inset-y-1.5 left-0 w-0.5 bg-primary" aria-hidden />}
      <item.icon className="size-4.5 shrink-0" stroke={1.75} />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {badge}
    </Link>
  )

  if (!collapsed) return link
  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

export function MobileNavButton() {
  const open = React.useContext(MobileNavContext)
  return (
    <Button variant="ghost" size="icon-sm" className="-ml-2 lg:hidden" onClick={open} aria-label="Buka menu">
      <IconMenu2 className="size-4.5" />
    </Button>
  )
}

function useOffline() {
  const [offline, setOffline] = React.useState(false)
  React.useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])
  return offline
}

const IDLE_MS = 30 * 60 * 1000
const WARNING_MS = 60 * 1000

/** Logs out after 30 minutes without clicks/typing, with a 60-second warning. */
function IdleGuard() {
  const router = useRouter()
  const lastActive = React.useRef(0)
  const [remaining, setRemaining] = React.useState<number | null>(null)

  React.useEffect(() => {
    lastActive.current = Date.now()
    const bump = () => {
      lastActive.current = Date.now()
    }
    window.addEventListener("pointerdown", bump)
    window.addEventListener("keydown", bump)
    const t = window.setInterval(() => {
      if (!lastActive.current) return
      const left = IDLE_MS - (Date.now() - lastActive.current)
      if (left <= 0) {
        window.clearInterval(t)
        router.push("/admin/masuk?reason=idle")
      } else setRemaining(left <= WARNING_MS ? Math.ceil(left / 1000) : null)
    }, 1000)
    return () => {
      window.clearInterval(t)
      window.removeEventListener("pointerdown", bump)
      window.removeEventListener("keydown", bump)
    }
  }, [router])

  if (remaining == null) return null
  return (
    <div role="alert" className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-3 bg-warning px-4 py-2 text-sm text-foreground">
      <IconClipboardList className="size-4" />
      Anda akan keluar otomatis dalam {remaining} detik karena tidak ada aktivitas.
      <Button size="xs" variant="outline" className="bg-background" onClick={() => setRemaining(null)}>
        Tetap masuk
      </Button>
    </div>
  )
}
