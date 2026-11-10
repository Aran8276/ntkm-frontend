"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconChevronDown, IconLogout, IconChevronRight } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/app/blocks"
import { useAdmin } from "@/components/admin/admin-context"
import { MobileNavButton } from "@/components/admin/admin-shell"
import { AdminLevelChip, Avatar } from "@/components/admin/admin-ui"

export interface Crumb {
  label: string
  href?: string
}

/** Top bar + content frame for every admin page. */
export function AdminPage({
  breadcrumb,
  title,
  description,
  meta,
  actions,
  children,
  className,
  bare,
}: {
  /** Skip the heading block (system pages). */
  bare?: boolean
  /** Parent crumbs; the page title is appended as the last crumb. */
  breadcrumb?: Crumb[]
  title: React.ReactNode
  description?: React.ReactNode
  /** Chips etc. shown next to the title. */
  meta?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  const crumbs = [...(breadcrumb ?? []), { label: typeof title === "string" ? title : "" }].filter((c) => c.label)
  return (
    <>
      <TopBar crumbs={crumbs} />
      <main className={cn("mx-auto flex w-full max-w-[1440px] min-w-0 flex-1 flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8", className)}>
        {!bare && <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-wider uppercase">{title}</h1>
              {meta}
            </div>
            {description && <div className="text-sm text-muted-foreground">{description}</div>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>}
        {children}
      </main>
    </>
  )
}

function TopBar({ crumbs }: { crumbs: Crumb[] }) {
  const { me, level, logout: signOut } = useAdmin()
  const router = useRouter()
  const [logout, setLogout] = React.useState(false)

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-3 px-4 lg:px-8">
        <MobileNavButton />
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1.5 text-xs font-semibold tracking-widest uppercase">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1
              return (
                <li key={i} className={cn("flex min-w-0 items-center gap-1.5", !last && "max-sm:hidden")}>
                  {c.href && !last ? (
                    <Link href={c.href} className="truncate text-muted-foreground hover:text-foreground">
                      {c.label}
                    </Link>
                  ) : (
                    <span className={cn("truncate", last ? "text-foreground" : "text-muted-foreground")} aria-current={last ? "page" : undefined}>
                      {c.label}
                    </span>
                  )}
                  {!last && <IconChevronRight className="size-3 shrink-0 text-muted-foreground" />}
                </li>
              )
            })}
          </ol>
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 px-2 py-1.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30">
            <Avatar name={me.name} size="sm" />
            <span className="hidden text-sm font-medium md:inline">{me.name}</span>
            <span className="hidden sm:inline-flex">
              <AdminLevelChip level={level} />
            </span>
            <IconChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{me.email}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setLogout(true)}>
              <IconLogout /> Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => setLogout(true)}>
          Keluar
        </Button>
      </div>

      <ConfirmDialog
        open={logout}
        onOpenChange={setLogout}
        title="Keluar dari panel admin?"
        description="Anda perlu masuk lagi untuk membuka panel ini."
        confirmLabel="Keluar"
        onConfirm={() => void signOut().then(() => router.push("/admin/masuk"))}
      />
    </header>
  )
}
