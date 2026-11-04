"use client"

import * as React from "react"
import Link from "next/link"
import { IconInbox } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatDate, formatDateTime } from "@/lib/format"
import { MY_OPPORTUNITIES, STORE_APPLICATIONS } from "@/lib/mock-data"
import type { ApplicationStatus } from "@/lib/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/toast"
import { AppShell } from "@/components/app/app-shell"
import { ConfirmDialog, EmptyState, FilterChips, Section } from "@/components/app/blocks"
import { ApplicationCard } from "@/components/app/cards"
import { APPLICATION_STATUS, OpportunityStatusChip } from "@/components/app/status"
import { CategoryChips, RequirementList, ScheduleList } from "@/components/app/opportunity-details"

const TABS = {
  submitted: { label: "Baru", statuses: ["submitted"] },
  approved: { label: "Disetujui", statuses: ["approved"] },
  in_delivery: { label: "Dalam pengiriman", statuses: ["in_delivery"] },
  received: { label: "Aktif", statuses: ["received"] },
  history: { label: "Riwayat", statuses: ["rejected", "completed", "cancelled"] },
} satisfies Record<string, { label: string; statuses: ApplicationStatus[] }>

type Tab = keyof typeof TABS

export function OpportunityDetail({ id }: { id: number }) {
  const initial = MY_OPPORTUNITIES.find((o) => o.id === id)!
  const [o, setO] = React.useState(initial)
  const [tab, setTab] = React.useState<Tab>("submitted")
  const [confirmClose, setConfirmClose] = React.useState(false)
  const apps = STORE_APPLICATIONS.filter((a) => a.opportunity.id === o.id)
  const list = apps.filter((a) => (TABS[tab].statuses as ApplicationStatus[]).includes(a.status))
  const closed = o.status === "closed"

  return (
    <AppShell
      role="store"
      title="Detail peluang"
      back="/toko/peluang"
      width="wide"
      bottomBar={
        !closed && (
          <div className="flex gap-3 sm:justify-end">
            <Button variant="destructive" onClick={() => setConfirmClose(true)}>
              Tutup peluang
            </Button>
            <Link href={`/toko/peluang/${o.id}/ubah`} className={cn(buttonVariants(), "flex-1 sm:flex-none")}>
              Ubah
            </Link>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-3">
        <OpportunityStatusChip status={o.status} />
        <h2 className="text-2xl leading-snug font-semibold tracking-wide uppercase">{o.title}</h2>
        <p className="text-sm text-muted-foreground">
          Berlaku sampai {formatDate(o.valid_until)} · Dibuat {formatDateTime(o.created_at)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-6">
          <Section title="Kuota">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-medium tabular-nums">
                    {o.quota_used}
                    <span className="text-lg text-muted-foreground">/{o.quota}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {o.quota_used} dari {o.quota} UMKM disetujui
                  </span>
                </div>
                <Progress value={(o.quota_used / o.quota) * 100} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(Object.keys(APPLICATION_STATUS) as ApplicationStatus[]).map((s) => (
                  <div key={s} className="flex flex-col gap-1 bg-muted/60 p-3">
                    <span className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
                      {APPLICATION_STATUS[s].label}
                    </span>
                    <span className="text-lg tabular-nums">{o.application_counts[s] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Detail">
            <div className="flex flex-col gap-6">
              {o.description && <p className="text-sm leading-relaxed">{o.description}</p>}
              <CategoryChips categories={o.categories} />
              <RequirementList opportunity={o} />
            </div>
          </Section>

          <Section title="Jadwal terima barang">
            <ScheduleList slots={o.receiving_schedule} />
          </Section>
        </div>

        <Section title="Pengajuan untuk peluang ini" className="self-start">
          <div className="flex flex-col gap-4">
            <FilterChips
              label="Status pengajuan"
              value={tab}
              onChange={setTab}
              className="lg:-mx-0"
              options={(Object.keys(TABS) as Tab[]).map((t) => ({
                value: t,
                label: TABS[t].label,
                count: t === "submitted" ? apps.filter((a) => a.status === "submitted").length : undefined,
              }))}
            />
            {list.length ? (
              <div className="flex flex-col gap-3">
                {list.map((a) => (
                  <ApplicationCard key={a.id} application={a} viewer="store" inset />
                ))}
              </div>
            ) : (
              <EmptyState icon={IconInbox} className="bg-muted/50 shadow-none ring-0">
                Belum ada pengajuan untuk peluang ini.
              </EmptyState>
            )}
          </div>
        </Section>
      </div>

      <ConfirmDialog
        open={confirmClose}
        onOpenChange={setConfirmClose}
        title="Tutup peluang ini?"
        description="Peluang tidak akan tampil lagi di feed UMKM. Pengajuan yang masuk tetap bisa Anda tinjau."
        confirmLabel="Ya, tutup"
        destructive
        onConfirm={() => {
          setO({ ...o, status: "closed" })
          toast.add({ title: "Peluang ditutup.", type: "success" })
        }}
      />
    </AppShell>
  )
}
