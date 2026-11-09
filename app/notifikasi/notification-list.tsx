"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconBell, IconChecks } from "@tabler/icons-react"

import { relativeDayBucket } from "@/lib/format"
import { api, type Paginated } from "@/lib/api"
import { mutate, revalidate, useApi } from "@/lib/use-api"
import type { AppNotification } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { AppShell } from "@/components/app/app-shell"
import { EmptyState, FilterChips, ListSkeleton, PageHeading } from "@/components/app/blocks"
import { LoadError, handleApiError } from "@/components/app/feedback"
import { NotificationCard } from "@/components/app/cards"
import { useSession } from "@/components/app/providers"

const BUCKETS = ["Hari ini", "Kemarin", "Sebelumnya"] as const

/** P20 · Notifikasi: `GET /notifications` (+ `unread=true`), read / read-all. */
export function NotificationList() {
  const router = useRouter()
  const { role, roles, setRole } = useSession()
  const [tab, setTab] = React.useState<"all" | "unread">("all")
  const q = useApi<Paginated<AppNotification>>("user", "/notifications", { unread: tab === "unread" ? true : undefined, page_size: 100 })
  const countQ = useApi<{ count: number }>("user", "/notifications/unread-count")
  const items = q.data?.results ?? []

  const unread = countQ.data?.count ?? items.filter((n) => !n.is_read).length
  const list = [...items].sort((a, b) => b.created_at.localeCompare(a.created_at))

  const markLocal = (pred: (n: AppNotification) => boolean) => {
    if (q.data) q.mutate({ ...q.data, results: q.data.results.map((x) => (pred(x) ? { ...x, is_read: true } : x)) })
  }

  const open = (n: AppNotification) => {
    // Mark as read without waiting, then follow the deeplink.
    if (!n.is_read) {
      markLocal((x) => x.id === n.id)
      countQ.mutate({ count: Math.max(0, unread - 1) })
      void api.post(`/notifications/${n.id}/read`).catch(() => undefined)
    }
    const target = n.data?.role
    if (target && target !== role && roles.includes(target)) {
      setRole(target)
      toast.add({ title: target === "store" ? "Beralih ke Mode Toko" : "Beralih ke Mode UMKM", type: "info" })
    }
    const link = typeof n.data?.deeplink === "string" ? n.data.deeplink : null
    if (link && link.startsWith("/")) router.push(link)
  }

  const readAll = async () => {
    try {
      await api.post("/notifications/read-all")
      markLocal(() => true)
      mutate("user", "/notifications/unread-count", undefined, { count: 0 })
      void revalidate("user", "/notifications")
    } catch (e) {
      handleApiError(e)
    }
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
            onClick={() => void readAll()}
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
      {q.error && !q.data ? (
        <LoadError error={q.error} onRetry={q.reload} />
      ) : q.loading ? (
        <ListSkeleton rows={4} />
      ) : list.length ? (
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
