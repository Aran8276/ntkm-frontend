"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  IconArrowLeft,
  IconBell,
  IconBox,
  IconBuildingStore,
  IconChevronDown,
  IconInbox,
  IconLayoutGrid,
  IconPackage,
  IconPlant2,
  IconSearch,
  IconSend,
  IconTargetArrow,
  IconUser,
  IconWifiOff,
  IconX,
  type Icon,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatCount, initials } from "@/lib/format"
import { useApi, useHydrated } from "@/lib/use-api"
import type { Me, Role } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Logo } from "@/components/app/logo"
import { onboardingDone, useRole, useSession } from "@/components/app/providers"
import { Skeleton } from "@/components/ui/skeleton"

interface NavItem {
  href: string
  label: string
  icon: Icon
  exact?: boolean
}

export const NAV: Record<Role, NavItem[]> = {
  store: [
    { href: "/toko", label: "Beranda", icon: IconLayoutGrid, exact: true },
    { href: "/toko/peluang", label: "Peluang", icon: IconTargetArrow },
    { href: "/toko/pengajuan", label: "Pengajuan", icon: IconInbox },
    { href: "/toko/stok", label: "Stok", icon: IconPackage },
    { href: "/profil", label: "Profil", icon: IconUser },
  ],
  umkm: [
    { href: "/umkm", label: "Beranda", icon: IconLayoutGrid, exact: true },
    { href: "/umkm/peluang", label: "Cari Peluang", icon: IconSearch },
    { href: "/umkm/produk", label: "Produk", icon: IconBox },
    { href: "/umkm/pengajuan", label: "Pengajuan", icon: IconSend },
    { href: "/profil", label: "Profil", icon: IconUser },
  ],
}

const ROLE_LABEL: Record<Role, string> = { store: "Mode Toko", umkm: "Mode UMKM" }
export const ROLE_HOME: Record<Role, string> = { store: "/toko", umkm: "/umkm" }

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

interface AppShellProps {
  /** Role the page belongs to; shared pages omit it and use the active role. */
  role?: Role
  title: string
  /** Show a back button to this href instead of the plain title. */
  back?: string
  /** Hide navigation (form pages). */
  hideNav?: boolean
  width?: "default" | "wide"
  /** Sticky bar pinned to the bottom of the viewport (form submit, actions). */
  bottomBar?: React.ReactNode
  /**
   * Access guard: "full" (default) requires login, a role and finished
   * onboarding for the page role; "onboarding" skips the onboarding check
   * (profile forms in onboarding mode).
   */
  access?: "full" | "onboarding"
  children: React.ReactNode
}

/**
 * Access guard from the spec, checked in order: no token → /masuk; no roles →
 * /pilih-peran; onboarding of the page role unfinished → /onboarding/...;
 * role not owned → dashboard of the active role. Returns true once the page
 * may render.
 */
export function useAccessGuard(pageRole: Role | undefined, access: "full" | "onboarding") {
  const { signedIn, me, role } = useSession()
  const hydrated = useHydrated()
  const router = useRouter()

  let redirect: string | null = null
  if (hydrated) {
    if (!signedIn) redirect = "/masuk"
    else if (me) redirect = guardRedirect(me, pageRole, role, access)
  }

  React.useEffect(() => {
    if (!redirect) return
    if (redirect === "/masuk") {
      const next = window.location.pathname + window.location.search
      router.replace(`/masuk?next=${encodeURIComponent(next)}`)
    } else router.replace(redirect)
  }, [redirect, router])

  return hydrated && signedIn && !!me && !redirect
}

export function guardRedirect(me: Me, pageRole: Role | undefined, activeRole: Role, access: "full" | "onboarding" = "full") {
  if (!me.roles.length) return "/pilih-peran"
  if (pageRole && !me.roles.includes(pageRole)) return ROLE_HOME[me.roles.includes(activeRole) ? activeRole : me.roles[0]]
  const r = pageRole ?? (me.roles.includes(activeRole) ? activeRole : me.roles[0])
  if (access === "full" && !onboardingDone(me, r)) return ONBOARDING[r]
  return null
}

export const ONBOARDING: Record<Role, string> = { store: "/onboarding/toko", umkm: "/onboarding/umkm" }

/** Where a signed-in user belongs (login, landing, role picker redirects). */
export function homeFor(me: Me, activeRole: Role) {
  if (!me.roles.length) return "/pilih-peran"
  const r = me.roles.includes(activeRole) ? activeRole : me.roles[0]
  for (const x of [r, ...me.roles]) if (!onboardingDone(me, x)) return ONBOARDING[x]
  return ROLE_HOME[r]
}

export function AppShell({
  role: pageRole,
  title,
  back,
  hideNav = false,
  width = "default",
  bottomBar,
  access = "full",
  children,
}: AppShellProps) {
  const { role: activeRole, setRole } = useRole()
  const role = pageRole ?? activeRole
  const pathname = usePathname()
  const ready = useAccessGuard(pageRole, access)

  // Visiting a role-specific page makes that role active.
  React.useEffect(() => {
    if (pageRole && pageRole !== activeRole) setRole(pageRole)
  }, [pageRole, activeRole, setRole])

  return (
    <div className="flex min-h-svh flex-1 flex-col overflow-x-clip bg-muted">
      {!hideNav && <Sidebar role={role} pathname={pathname} />}

      <div className={cn("flex min-w-0 flex-1 flex-col", !hideNav && "lg:pl-64 print:pl-0")}>
        <header className="sticky top-0 z-30 border-b bg-background/95 print:hidden backdrop-blur supports-backdrop-filter:bg-background/80">
          <div
            className={cn(
              "mx-auto flex h-16 w-full items-center gap-3 px-4 lg:px-8",
              width === "wide" ? "max-w-6xl" : "max-w-3xl"
            )}
          >
            {back ? (
              <Button
                variant="ghost"
                size="icon-sm"
                className="-ml-2"
                render={<Link href={back} />}
                nativeButton={false}
                aria-label="Kembali"
              >
                <IconArrowLeft className="size-4.5" />
              </Button>
            ) : (
              hideNav && <Logo className="mr-2" />
            )}
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-widest uppercase">
              {title}
            </h1>
            <RoleSwitcher role={role} />
            <NotificationBell />
          </div>
        </header>
        <OfflineBanner />

        <main
          className={cn(
            "mx-auto flex w-full min-w-0 flex-1 flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8",
            width === "wide" ? "max-w-6xl" : "max-w-3xl",
            !hideNav && !bottomBar && "pb-28 lg:pb-10",
            bottomBar && (hideNav ? "pb-32" : "pb-48 lg:pb-32")
          )}
        >
          <InstallPrompt />
          {ready ? children : <ShellSkeleton />}
        </main>
      </div>

      {ready && bottomBar && (
        <div
          className={cn(
            "fixed inset-x-0 z-30 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85 print:hidden",
            hideNav ? "bottom-0" : "bottom-16 lg:bottom-0 lg:left-64"
          )}
        >
          <div
            className={cn(
              "mx-auto w-full px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:px-8",
              width === "wide" ? "max-w-6xl" : "max-w-3xl"
            )}
          >
            {bottomBar}
          </div>
        </div>
      )}

      {!hideNav && <BottomNav role={role} pathname={pathname} />}
    </div>
  )
}

function ShellSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-4 w-32 bg-background" />
      <Skeleton className="h-8 w-2/3 bg-background" />
      <Skeleton className="h-32 w-full bg-background" />
      <Skeleton className="h-48 w-full bg-background" />
    </div>
  )
}

function Sidebar({ role, pathname }: { role: Role; pathname: string }) {
  const { me } = useSession()
  const main = NAV[role].slice(0, 4)
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-background lg:flex print:hidden">
      <div className="flex h-16 items-center border-b px-6">
        <Logo href={ROLE_HOME[role]} />
      </div>
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-6">
        <NavSection label={role === "store" ? "Toko" : "UMKM"} items={main} pathname={pathname} />
        <NavSection
          label="Akun"
          pathname={pathname}
          items={[
            { href: "/notifikasi", label: "Notifikasi", icon: IconBell },
            ...(role === "umkm" ? [{ href: "/umkm/stok", label: "Stok di toko", icon: IconPackage }] : []),
            { href: "/profil", label: "Profil", icon: IconUser },
          ]}
        />
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          {me?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- Google avatar URL
            <img src={me.avatar_url} alt="" className="size-9 rounded-full object-cover" />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">
              {initials(me?.name ?? "")}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{me?.name ?? " "}</p>
            <p className="truncate text-xs text-muted-foreground">{me?.email ?? " "}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function NavSection({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 pb-2 text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      {items.map((item) => {
        const active = isActive(pathname, item)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30",
              active ? "bg-muted font-medium text-foreground" : "text-foreground/80"
            )}
          >
            <item.icon className="size-4.5 shrink-0" stroke={1.75} />
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

function BottomNav({ role, pathname }: { role: Role; pathname: string }) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden print:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
        {NAV[role].map((item) => {
          const active = isActive(pathname, item)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-full flex-col items-center justify-center gap-1 text-[0.625rem] font-semibold tracking-wider uppercase outline-none focus-visible:bg-muted",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {active && <span className="absolute inset-x-4 top-0 h-0.5 bg-primary" />}
                <item.icon className="size-5" stroke={1.75} />
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function RoleSwitcher({ role }: { role: Role }) {
  const { roles, setRole } = useRole()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  if (roles.length < 2) return null

  const options: { value: Role; title: string; desc: string; icon: Icon }[] = [
    { value: "store", title: "Mode Toko", desc: "Kelola peluang, pengajuan, dan stok di rak.", icon: IconBuildingStore },
    { value: "umkm", title: "Mode UMKM", desc: "Cari peluang, ajukan produk, dan pantau stok.", icon: IconPlant2 },
  ]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-1.5 border px-2.5 text-[0.625rem] font-semibold tracking-widest uppercase outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        {ROLE_LABEL[role]}
        <IconChevronDown className="size-3" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg">
          <SheetHeader>
            <SheetTitle>Ganti mode</SheetTitle>
            <SheetDescription>Pilih peran yang ingin Anda pakai sekarang.</SheetDescription>
            <div className="mt-4 flex flex-col gap-2">
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    setRole(o.value)
                    setOpen(false)
                    router.push(ROLE_HOME[o.value])
                  }}
                  className={cn(
                    "flex items-center gap-4 border p-4 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/30",
                    o.value === role && "border-primary/40 bg-primary/5"
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center bg-muted">
                    <o.icon className="size-5" stroke={1.75} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-xs font-semibold tracking-widest uppercase">{o.title}</span>
                    <span className="block text-sm text-muted-foreground">{o.desc}</span>
                  </span>
                  <span
                    className={cn(
                      "size-4.5 rounded-full border",
                      o.value === role && "border-[5px] border-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </>
  )
}

/** Unread badge: `GET /notifications/unread-count` every 60 s and on returning to the tab. */
export function useUnreadCount() {
  const { signedIn } = useSession()
  const q = useApi<{ count: number }>("user", signedIn ? "/notifications/unread-count" : null, undefined, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  })
  return q.data?.count ?? 0
}

function NotificationBell() {
  const count = useUnreadCount()
  return (
    <Link
      href="/notifikasi"
      aria-label={count ? `Notifikasi, ${count} belum dibaca` : "Notifikasi"}
      className="relative inline-flex size-9 items-center justify-center outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      <IconBell className="size-5" stroke={1.75} />
      {count > 0 && (
        <span className="absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center bg-destructive px-1 text-[0.625rem] leading-none font-semibold text-white">
          {formatCount(count)}
        </span>
      )}
    </Link>
  )
}

function OfflineBanner() {
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
  if (!offline) return null
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-foreground px-4 py-1.5 text-xs text-background">
      <IconWifiOff className="size-3.5" />
      Anda sedang offline. Data mungkin tidak terbaru.
    </div>
  )
}

const INSTALL_DISMISS_KEY = "pwa-install-dismissed-at"
const INSTALL_VISITS_KEY = "pwa-visits"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

function InstallPrompt() {
  const [event, setEvent] = React.useState<BeforeInstallPromptEvent | null>(null)

  React.useEffect(() => {
    let eligible = false
    try {
      let visits = Number(localStorage.getItem(INSTALL_VISITS_KEY) ?? 0)
      if (!sessionStorage.getItem("pwa-counted")) {
        visits += 1
        localStorage.setItem(INSTALL_VISITS_KEY, String(visits))
        sessionStorage.setItem("pwa-counted", "1")
      }
      const dismissed = Number(localStorage.getItem(INSTALL_DISMISS_KEY) ?? 0)
      eligible = visits >= 2 && Date.now() - dismissed > 14 * 86_400_000
    } catch {}
    const handler = (e: Event) => {
      e.preventDefault()
      if (eligible) setEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  if (!event) return null

  const dismiss = () => {
    try {
      localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()))
    } catch {}
    setEvent(null)
  }

  return (
    <div className="flex items-center gap-4 bg-background p-4 shadow-sm ring-1 ring-foreground/5">
      <div className="flex-1">
        <p className="text-xs font-semibold tracking-widest uppercase">Pasang di layar utama</p>
        <p className="text-sm text-muted-foreground">Buka lebih cepat, langsung dari HP Anda.</p>
      </div>
      <Button size="sm" onClick={() => event.prompt().finally(dismiss)}>
        Pasang
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={dismiss} aria-label="Tutup">
        <IconX />
      </Button>
    </div>
  )
}
