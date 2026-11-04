"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconBell, IconChecks } from "@tabler/icons-react"

import { relativeDayBucket } from "@/lib/format"
import { NOTIFICATIONS } from "@/lib/mock-data"
import type { AppNotification } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { AppShell } from "@/components/app/app-shell"
import { EmptyState, FilterChips, PageHeading } from "@/components/app/blocks"
import { NotificationCard } from "@/components/app/cards"
import { useRole } from "@/components/app/providers"

const BUCKETS = ["Hari ini", "Kemarin", "Sebelumnya"] as const

export function NotificationList() {
  const router = useRouter()
  const { role, setRole } = useRole()
  const [items, setItems] = React.useState(NOTIFICATIONS)
  const [tab, setTab] = React.useState<"all" | "unread">("all")

  const unread = items.filter((n) => !n.is_read).length
  const list = [...items]
    .filter((n) => tab === "all" || !n.is_read)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const open = (n: AppNotification) => {
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    if (n.data.role !== role) {
      setRole(n.data.role)
      toast.add({ title: n.data.role === "store" ? "Beralih ke Mode Toko" : "Beralih ke Mode UMKM", type: "info" })
    }
    router.push(n.data.deeplink)
  }

  return (
    <AppShell title="Notifikasi">
      <PageHeading
        title="Notifikasi"
        actions={
          <Button
            variant="ghost"
            size="sm"
            disabled={unread === 0}
            onClick={() => setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))}
          >
            <IconChecks data-icon="inline-start" />
            Tandai semua dibaca
          </Button>
        }
      />
      <FilterChips
        label="Filter notifikasi"
        value={tab}
        onChange={setTab}
        options={[
          { value: "all", label: "Semua" },
          { value: "unread", label: "Belum dibaca", count: unread },
        ]}
      />
      {list.length ? (
        <div className="flex flex-col gap-6">
          {BUCKETS.map((bucket) => {
            const group = list.filter((n) => relativeDayBucket(n.created_at) === bucket)
            if (!group.length) return null
            return (
              <section key={bucket} className="flex flex-col gap-2">
                <h3 className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">{bucket}</h3>
                <div className="bg-background shadow-sm ring-1 ring-foreground/5">
                  {group.map((n) => (
                    <NotificationCard key={n.id} notification={n} onOpen={open} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={IconBell}>
          {tab === "all" ? "Belum ada notifikasi." : "Semua notifikasi sudah dibaca."}
        </EmptyState>
      )}
    </AppShell>
  )
}
