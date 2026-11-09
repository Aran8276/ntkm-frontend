"use client"

import * as React from "react"
import Link from "next/link"
import { IconCalendarOff, IconDoorEnter, IconDoorExit, IconEdit, IconRestore, IconTrash } from "@tabler/icons-react"

import {
  calcCommission,
  formatCommission,
  formatDate,
  formatDateTime,
  formatRupiah,
  summarizeSchedule,
  todayIso,
} from "@/lib/format"
import type { Paginated } from "@/lib/api"
import { useApi } from "@/lib/use-api"
import type { AdminApplicationRow, AdminOpportunity } from "@/lib/admin-types"
import type { ApplicationStatus } from "@/lib/types"
import { LoadError } from "@/components/app/feedback"
import { TableSkeleton } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Section } from "@/components/app/blocks"
import { APPLICATION_STATUS, OpportunityStatusChip } from "@/components/app/status"
import { useQueryState } from "@/hooks/use-query-state"
import { useAdmin } from "@/components/admin/admin-context"
import { AdminPage } from "@/components/admin/admin-page"
import {
  ActionStack,
  AdminHistoryCard,
  Banner,
  BoolIcon,
  CreatorChip,
  DataList,
  DateTime,
  DetailColumns,
  IdCell,
  TabBar,
} from "@/components/admin/admin-ui"
import { ApplicationsMiniTable } from "@/components/admin/embedded"
import { useOpportunityActions } from "@/components/admin/opportunity-actions"

type Tab = "all" | "submitted" | "approved" | "in_delivery" | "received" | "history"
const TAB_STATUS: Record<Tab, ApplicationStatus[] | null> = {
  all: null,
  submitted: ["submitted"],
  approved: ["approved"],
  in_delivery: ["in_delivery"],
  received: ["received"],
  history: ["completed", "rejected", "cancelled"],
}

/** A10 · Detail peluang: `GET /admin/opportunities/{id}` + `GET /admin/applications?opportunity_id=`. */
export function OpportunityDetail({ id }: { id: string }) {
  const q = useApi<AdminOpportunity>("admin", `/admin/opportunities/${id}`)
  const { isSuperadmin } = useAdmin()
  const { open, modals } = useOpportunityActions()
  const [tab, setTab] = useQueryState<Tab>("status", "all")
  const [TODAY] = React.useState(() => todayIso())
  const appsQ = useApi<Paginated<AdminApplicationRow>>("admin", "/admin/applications", {
    opportunity_id: id,
    status: TAB_STATUS[tab] ?? undefined,
    page_size: 100,
  })
  const visible = appsQ.data?.results ?? []

  const o = q.data
  if (!o)
    return (
      <AdminPage breadcrumb={[{ label: "Peluang", href: "/admin/peluang" }]} title="Detail peluang">
        {q.error ? <LoadError error={q.error} onRetry={q.reload} backHref="/admin/peluang" backLabel="Kembali ke Peluang" /> : <TableSkeleton />}
      </AdminPage>
    )
  const counts = o.application_counts ?? {}
  const r = o.requirements
  const sample = calcCommission(10000, o.commission)

  return (
    <AdminPage
      breadcrumb={[{ label: "Peluang", href: "/admin/peluang" }]}
      title={o.title}
      meta={
        <span className="flex flex-wrap gap-2">
          <OpportunityStatusChip status={o.status} />
          <CreatorChip createdBy={o.created_by} kind="toko" />
        </span>
      }
      description={
        <>
          <Link href={`/admin/pengguna/${o.store.owner_id}?tab=toko`} className="text-primary hover:underline">
            {o.store.name}
          </Link>{" "}
          · Berlaku sampai {formatDate(o.valid_until)}
        </>
      }
    >
      {o.valid_until < TODAY && !o.deleted_at && (
        <Banner tone="danger" icon={IconCalendarOff}>
          Masa berlaku peluang ini sudah lewat ({formatDate(o.valid_until)}).
        </Banner>
      )}
      {o.deleted_at && (
        <Banner
          action={
            <Button size="sm" variant="outline" onClick={() => open("restore", o)}>
              Pulihkan
            </Button>
          }
        >
          Data ini dihapus pada {formatDateTime(o.deleted_at)} oleh {o.deleted_by?.name ?? "—"}.
        </Banner>
      )}

      <DetailColumns
        main={
          <>
            <Section title="Kuota">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted-foreground">Terpakai</span>
                    <span className="font-medium tabular-nums">
                      {o.quota_used} dari {o.quota} UMKM
                    </span>
                  </div>
                  <Progress value={o.quota ? (o.quota_used / o.quota) * 100 : 0} aria-label="Kuota terpakai" />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {(Object.keys(APPLICATION_STATUS) as ApplicationStatus[]).map((s) => (
                    <span key={s} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{APPLICATION_STATUS[s].label}</span>
                      <span className="font-medium tabular-nums">{counts[s] ?? 0}</span>
                    </span>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="Detail">
              <DataList
                items={[
                  { label: "Deskripsi", value: o.description || null, full: true },
                  {
                    label: "Kategori",
                    value: (
                      <span className="flex flex-wrap gap-1.5">
                        {o.categories.map((c) => (
                          <span key={c.id} className="bg-muted px-2 py-1 text-[0.625rem] font-semibold tracking-widest uppercase">
                            {c.name}
                          </span>
                        ))}
                      </span>
                    ),
                  },
                  { label: "Maksimal produk per UMKM", value: `${o.max_products_per_umkm} produk` },
                  {
                    label: "Komisi",
                    value: (
                      <span className="flex flex-col gap-1">
                        <span>{formatCommission(o.commission)}</span>
                        <span className="text-xs text-muted-foreground">
                          Contoh harga {formatRupiah(10000)} → komisi toko {formatRupiah(sample.commission)}, UMKM terima {formatRupiah(sample.income)}
                        </span>
                      </span>
                    ),
                  },
                  { label: "Jadwal terima barang", value: summarizeSchedule(o.receiving_schedule) },
                ]}
              />
            </Section>

            <Section title="Syarat">
              <DataList
                items={[
                  { label: "Masa simpan minimal", value: r.min_shelf_life_days ? `${r.min_shelf_life_days} hari` : null },
                  { label: "Harga jual maksimal", value: r.max_retail_price ? formatRupiah(r.max_retail_price) : null },
                  {
                    label: "Legalitas wajib",
                    value: (
                      <span className="flex flex-wrap gap-4">
                        {(
                          [
                            ["NIB", r.requires_nib],
                            ["PIRT", r.requires_pirt],
                            ["Halal", r.requires_halal],
                          ] as const
                        ).map(([l, v]) => (
                          <span key={l} className="flex items-center gap-1.5">
                            <BoolIcon value={v} label={l} /> {l}
                          </span>
                        ))}
                      </span>
                    ),
                  },
                  { label: "Syarat lain", value: r.notes || null },
                ]}
              />
            </Section>

            <Section title="Pengajuan">
              <div className="flex flex-col gap-4">
                <TabBar
                  value={tab}
                  onChange={setTab}
                  className="-mt-2"
                  options={[
                    { value: "all", label: "Semua" },
                    { value: "submitted", label: "Diajukan", count: counts.submitted },
                    { value: "approved", label: "Disetujui" },
                    { value: "in_delivery", label: "Dalam pengiriman" },
                    { value: "received", label: "Diterima toko" },
                    { value: "history", label: "Riwayat" },
                  ]}
                />
                {visible.length ? (
                  <ApplicationsMiniTable rows={visible} counterpart="umkm" />
                ) : (
                  <p className="bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">Belum ada pengajuan untuk peluang ini.</p>
                )}
              </div>
            </Section>
          </>
        }
        aside={
          <>
            <Section title="Aksi">
              <ActionStack>
                {!o.deleted_at && (
                  <Button variant="outline" render={<Link href={`/admin/peluang/${o.id}/ubah`} />} nativeButton={false}>
                    <IconEdit data-icon="inline-start" /> Ubah
                  </Button>
                )}
                {!o.deleted_at &&
                  (o.status === "closed" ? (
                    <Button variant="outline" onClick={() => open("reopen", o)}>
                      <IconDoorEnter data-icon="inline-start" /> Buka ulang
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => open("close", o)}>
                      <IconDoorExit data-icon="inline-start" /> Tutup
                    </Button>
                  ))}
                {o.deleted_at ? (
                  <Button variant="outline" onClick={() => open("restore", o)}>
                    <IconRestore data-icon="inline-start" /> Pulihkan
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={() => open("delete", o)}>
                    <IconTrash data-icon="inline-start" /> Hapus
                  </Button>
                )}
                {isSuperadmin && !o.has_applications && (
                  <Button variant="destructive" onClick={() => open("hard_delete", o)}>
                    <IconTrash data-icon="inline-start" /> Hapus permanen
                  </Button>
                )}
              </ActionStack>
            </Section>
            <Section title="Info">
              <DataList
                columns={1}
                items={[
                  { label: "ID", value: <IdCell id={o.id} /> },
                  { label: "Dibuat oleh", value: o.created_by?.name },
                  { label: "Dibuat", value: <DateTime value={o.created_at} /> },
                  { label: "Diperbarui", value: <DateTime value={o.updated_at} /> },
                ]}
              />
            </Section>
            <AdminHistoryCard type="opportunity" id={o.id} />
          </>
        }
      />
      {modals}
    </AdminPage>
  )
}
