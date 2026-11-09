"use client"

import * as React from "react"
import { IconPlus } from "@tabler/icons-react"

import { addDaysIso, agoIso, formatDate, todayIso } from "@/lib/format"
import type { AdminApplicationRow } from "@/lib/admin-types"
import type { ApplicationStatus } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { APPLICATION_STATUS, ApplicationStatusChip } from "@/components/app/status"
import { AdminPage } from "@/components/admin/admin-page"
import { CellLink, DateTime, Dash, OverrideMark } from "@/components/admin/admin-ui"
import { DataTable } from "@/components/admin/data-table"
import { slotLabel } from "@/components/admin/embedded"
import { useOpportunityOptions, useStoreOptions, useUmkmOptions } from "@/components/admin/options"
import { CreateApplicationModal } from "./create-application-modal"

/** A15 · Pengajuan. */
export function ApplicationsTable() {
  const [creating, setCreating] = React.useState(false)
  const storeOptions = useStoreOptions()
  const umkmOptions = useUmkmOptions()
  const opportunityOptions = useOpportunityOptions()
  // Time-based views are fixed when the page opens.
  const [now] = React.useState(() => new Date())
  const TODAY = todayIso(now)
  const H48_AGO = agoIso(48 * 3600_000, now)
  const daysAgo = (n: number) => addDaysIso(-n, now)
  const deliveryDates = Array.from({ length: 21 }, (_, i) => addDaysIso(i - 7, now)).reverse()

  return (
    <AdminPage title="Pengajuan" description="Semua pengajuan kerja sama antara UMKM dan toko.">
      <DataTable<AdminApplicationRow>
        endpoint="/admin/applications"
        rowKey={(a) => a.id}
        rowHref={(a) => `/admin/pengajuan/${a.id}`}
        defaultOrdering="-created_at"
        search={{
          placeholder: "Cari nama toko, nama usaha, atau judul peluang",
          text: (a) => `${a.store.name} ${a.umkm.business_name} ${a.opportunity.title}`,
        }}
        quickTabs={[
          { value: "all", label: "Semua" },
          {
            value: "waiting",
            label: "Menunggu > 48 jam",
            query: { status: "submitted", created_before: H48_AGO, ordering: "created_at" },
            count: true,
          },
          { value: "today", label: "Antar hari ini", query: { delivery_date: TODAY }, count: true },
          { value: "selling", label: "Sedang dijual", query: { status: "received" } },
          { value: "override", label: "Ada override", query: { has_override: true } },
        ]}
        filters={[
          {
            key: "status",
            label: "Status",
            multiple: true,
            options: (Object.keys(APPLICATION_STATUS) as ApplicationStatus[]).map((s) => ({ value: s, label: APPLICATION_STATUS[s].label })),
            match: (a, v) => a.status === v,
          },
          { key: "store_id", label: "Toko", searchable: true, options: storeOptions, match: (a, v) => a.store.id === v },
          { key: "umkm_id", label: "UMKM", searchable: true, options: umkmOptions, match: (a, v) => a.umkm.id === v },
          { key: "opportunity_id", label: "Peluang", searchable: true, options: opportunityOptions, match: (a, v) => a.opportunity.id === v },
          {
            key: "created_after",
            label: "Diajukan",
            // Values are dates (`created_after=YYYY-MM-DD`), labels the relative range.
            options: [
              { value: daysAgo(7), label: "7 hari terakhir" },
              { value: daysAgo(30), label: "30 hari terakhir" },
              { value: daysAgo(90), label: "90 hari terakhir" },
            ],
          },
          {
            key: "delivery_date",
            label: "Tanggal antar",
            options: deliveryDates.map((d) => ({ value: d, label: formatDate(d) })),
            match: (a, v) => a.delivery_slot?.date === v,
          },
        ]}
        exportResources={["applications", "application-items"]}
        createAction={
          <Button onClick={() => setCreating(true)}>
            <IconPlus data-icon="inline-start" /> Pengajuan atas nama UMKM
          </Button>
        }
        columns={[
          { key: "created_at", header: "Diajukan", sort: (a) => a.created_at, cell: (a) => <DateTime value={a.created_at} /> },
          { key: "store", header: "Toko", cell: (a) => <CellLink href={`/admin/pengguna/${a.store.owner_id}?tab=toko`}>{a.store.name}</CellLink> },
          { key: "umkm", header: "UMKM", cell: (a) => <CellLink href={`/admin/pengguna/${a.umkm.owner_id}?tab=umkm`}>{a.umkm.business_name}</CellLink> },
          { key: "opp", header: "Peluang", cell: (a) => <CellLink href={`/admin/peluang/${a.opportunity.id}`} className="block max-w-52 truncate">{a.opportunity.title}</CellLink> },
          {
            key: "items",
            header: "Produk",
            cell: (a) => (
              <span className="tabular-nums">
                {a.items_count}
                {a.status !== "submitted" && <span className="text-muted-foreground"> · {a.approved_count} disetujui</span>}
              </span>
            ),
          },
          {
            key: "delivery_slot_start",
            header: "Slot antar",
            sort: (a) => a.delivery_slot?.start_at ?? null,
            cell: (a) => slotLabel(a) ?? <Dash />,
          },
          { key: "status", header: "Status", cell: (a) => <ApplicationStatusChip status={a.status} /> },
          { key: "override", header: "Override", cell: (a) => (a.has_override ? <OverrideMark /> : null) },
          { key: "updated_at", header: "Diperbarui", sort: (a) => a.updated_at, cell: (a) => <DateTime value={a.updated_at} /> },
        ]}
        emptyText="Belum ada pengajuan."
      />
      <CreateApplicationModal open={creating} onOpenChange={setCreating} />
    </AdminPage>
  )
}
