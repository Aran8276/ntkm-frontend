"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconPlus } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatCommissionShort, formatDate } from "@/lib/format"
import { ADMIN_OPPORTUNITIES, TODAY, slugify } from "@/lib/admin-mock"
import type { AdminOpportunity } from "@/lib/admin-types"
import { Button } from "@/components/ui/button"
import { OpportunityStatusChip } from "@/components/app/status"
import { AdminPage } from "@/components/admin/admin-page"
import { CellLink, CreatorChip, DateTime, DeletedChip } from "@/components/admin/admin-ui"
import { DataTable } from "@/components/admin/data-table"
import { categoryOptions, storeOptions } from "@/components/admin/options"
import { opportunityMenu, useOpportunityActions } from "@/components/admin/opportunity-actions"

/** A09 · Peluang. */
export function OpportunitiesTable() {
  const router = useRouter()
  const { open, modals } = useOpportunityActions()
  const create = (
    <Button render={<Link href="/admin/peluang/baru" />} nativeButton={false}>
      <IconPlus data-icon="inline-start" /> Peluang
    </Button>
  )
  return (
    <AdminPage title="Peluang" description="Peluang yang dipasang toko (atau admin atas nama toko).">
      <DataTable<AdminOpportunity>
        rows={ADMIN_OPPORTUNITIES}
        rowKey={(o) => o.id}
        rowHref={(o) => `/admin/peluang/${o.id}`}
        isDeleted={(o) => !!o.deleted_at}
        search={{ placeholder: "Cari judul peluang atau nama toko", text: (o) => `${o.title} ${o.store.name}` }}
        filters={[
          { key: "store_id", label: "Toko", searchable: true, options: storeOptions, match: (o, v) => o.store.id === v },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "open", label: "Dibuka" },
              { value: "full", label: "Kuota penuh" },
              { value: "closed", label: "Ditutup" },
            ],
            match: (o, v) => o.status === v,
          },
          { key: "category", label: "Kategori", options: categoryOptions, match: (o, v) => o.categories.some((c) => slugify(c.name) === v) },
        ]}
        toggles={[{ key: "expired", label: "Sudah kedaluwarsa", match: (o) => o.expired }]}
        exportResources={["opportunities"]}
        createAction={create}
        columns={[
          {
            key: "title",
            header: "Judul",
            sort: (o) => o.title,
            cell: (o) => (
              <span className="flex items-center gap-2">
                <span className="block max-w-64 truncate font-medium">{o.title}</span>
                {o.deleted_at && <DeletedChip />}
              </span>
            ),
          },
          { key: "store", header: "Toko", cell: (o) => <CellLink href={`/admin/pengguna/${o.store.owner_id}?tab=toko`}>{o.store.name}</CellLink> },
          {
            key: "categories",
            header: "Kategori",
            cell: (o) => (
              <span className="flex gap-1">
                {o.categories.slice(0, 2).map((c) => (
                  <span key={c.id} className="bg-muted px-1.5 py-1 text-[0.625rem] font-semibold tracking-widest uppercase">
                    {c.name}
                  </span>
                ))}
                {o.categories.length > 2 && <span className="text-xs text-muted-foreground">+{o.categories.length - 2}</span>}
              </span>
            ),
          },
          { key: "commission", header: "Komisi", cell: (o) => formatCommissionShort(o.commission).replace("Komisi ", "") },
          { key: "quota", header: "Kuota", cell: (o) => <span className="tabular-nums">{o.quota_used}/{o.quota}</span> },
          {
            key: "new",
            header: "Pengajuan baru",
            className: "text-right",
            cell: (o) => {
              const n = o.application_counts.submitted ?? 0
              return n > 0 ? (
                <span className="bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground tabular-nums">{n}</span>
              ) : (
                <span className="text-muted-foreground">0</span>
              )
            },
          },
          {
            key: "valid_until",
            header: "Berlaku sampai",
            sort: (o) => o.valid_until,
            cell: (o) => <span className={cn("tabular-nums", o.valid_until < TODAY && "font-medium text-destructive")}>{formatDate(o.valid_until, { weekday: false })}</span>,
          },
          { key: "status", header: "Status", cell: (o) => <OpportunityStatusChip status={o.status} /> },
          { key: "creator", header: "Dibuat oleh", cell: (o) => <CreatorChip createdBy={o.created_by} kind="toko" /> },
          { key: "created_at", header: "Dibuat", sort: (o) => o.created_at, cell: (o) => <DateTime value={o.created_at} /> },
        ]}
        rowMenu={(o) => opportunityMenu(o, open, (h) => router.push(h))}
        emptyText="Belum ada peluang."
        emptyAction={create}
      />
      {modals}
    </AdminPage>
  )
}
