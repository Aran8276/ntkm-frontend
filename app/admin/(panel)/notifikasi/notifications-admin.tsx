"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconBoxOff,
  IconCircleCheck,
  IconCircleX,
  IconMailDown,
  IconShieldCheck,
  IconShieldX,
  IconSpeakerphone,
  IconTruckDelivery,
  IconUserCog,
  type Icon,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { addDaysIso } from "@/lib/format"
import { adminApi } from "@/lib/api"
import { revalidate } from "@/lib/use-api"
import { handleApiError } from "@/components/app/feedback"
import type { AdminNotification } from "@/lib/admin-types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ConfirmDialog, Section } from "@/components/app/blocks"
import { FormField } from "@/components/app/form-field"
import { CharCount } from "@/components/app/inputs"
import { useUrlParams } from "@/hooks/use-url-params"
import { AdminPage } from "@/components/admin/admin-page"
import { BoolIcon, DataList, DateTime, EMAIL_STATUS, EmailStatusChip, TabBar } from "@/components/admin/admin-ui"
import { DataTable } from "@/components/admin/data-table"
import { EntityMultiPicker, SidePanel } from "@/components/admin/pickers"
import { useUserOptions } from "@/components/admin/options"

type NType = AdminNotification["type"]

export const NOTIF_TYPE: Record<NType, { label: string; icon: Icon; className: string }> = {
  application_submitted: { label: "Pengajuan baru", icon: IconMailDown, className: "bg-primary/10 text-primary" },
  application_approved: { label: "Pengajuan disetujui", icon: IconCircleCheck, className: "bg-success/10 text-success" },
  application_rejected: { label: "Pengajuan ditolak", icon: IconCircleX, className: "bg-destructive/10 text-destructive" },
  application_status_changed: { label: "Status berubah", icon: IconTruckDelivery, className: "bg-muted text-foreground" },
  stock_out: { label: "Stok habis", icon: IconBoxOff, className: "bg-destructive/10 text-destructive" },
  admin_action: { label: "Tindakan admin", icon: IconUserCog, className: "bg-violet/10 text-violet" },
  announcement: { label: "Pengumuman", icon: IconSpeakerphone, className: "bg-primary/10 text-primary" },
  legal_verified: { label: "Legalitas terverifikasi", icon: IconShieldCheck, className: "bg-success/10 text-success" },
  legal_rejected: { label: "Legalitas ditolak", icon: IconShieldX, className: "bg-destructive/10 text-destructive" },
}

type Tab = "log" | "pengumuman"

/** A21 · Notifikasi & pengumuman. */
export function NotificationsAdmin() {
  const { get, set, params } = useUrlParams()
  const tab = (get("tab") as Tab | null) ?? "log"

  const switchTab = (t: Tab) => {
    // Clear table params when switching tabs.
    const keep: Record<string, null> = {}
    params.forEach((_, k) => (keep[k] = null))
    set({ ...keep, tab: t === "log" ? null : t })
  }

  return (
    <AdminPage title="Notifikasi & pengumuman" description="Log notifikasi ke pengguna dan pengumuman massal.">
      <TabBar
        value={tab}
        onChange={switchTab}
        options={[
          { value: "log", label: "Log" },
          { value: "pengumuman", label: "Kirim pengumuman" },
        ]}
      />
      {tab === "log" ? <NotificationLog /> : <BroadcastForm onSent={() => set({ tab: null, type: "announcement" })} />}
    </AdminPage>
  )
}

function NotificationLog() {
  const { get, set } = useUrlParams()
  const userOptions = useUserOptions()
  const [now] = React.useState(() => new Date())
  const daysAgo = (n: number) => addDaysIso(-n, now)
  const [picked, setPicked] = React.useState<AdminNotification | null>(null)
  const selected = picked && picked.id === get("id") ? picked : undefined
  const [resend, setResend] = React.useState(false)

  return (
    <>
      <DataTable<AdminNotification>
        endpoint="/admin/notifications"
        rowKey={(n) => n.id}
        onRowClick={(n) => {
          setPicked(n)
          set({ id: n.id })
        }}
        filters={[
          { key: "user_id", label: "Penerima", searchable: true, options: userOptions, match: (n, v) => n.user.id === v },
          {
            key: "type",
            label: "Tipe",
            options: (Object.keys(NOTIF_TYPE) as NType[]).map((t) => ({ value: t, label: NOTIF_TYPE[t].label })),
            match: (n, v) => n.type === v,
          },
          {
            key: "email_status",
            label: "Status email",
            options: (Object.keys(EMAIL_STATUS) as AdminNotification["email_status"][]).map((s) => ({ value: s, label: EMAIL_STATUS[s].label })),
            match: (n, v) => n.email_status === v,
          },
          {
            key: "created_after",
            label: "Sejak",
            options: [
              { value: daysAgo(1), label: "24 jam terakhir" },
              { value: daysAgo(7), label: "7 hari terakhir" },
              { value: daysAgo(30), label: "30 hari terakhir" },
            ],
          },
        ]}
        columns={[
          { key: "created_at", header: "Waktu", sort: (n) => n.created_at, cell: (n) => <DateTime value={n.created_at} /> },
          {
            key: "user",
            header: "Penerima",
            cell: (n) => (
              <span className="flex flex-col">
                <span>{n.user.name}</span>
                <span className="text-xs text-muted-foreground">{n.user.email}</span>
              </span>
            ),
          },
          {
            key: "type",
            header: "Tipe",
            cell: (n) => {
              const t = NOTIF_TYPE[n.type]
              return (
                <span className="flex items-center gap-2">
                  <span className={cn("flex size-7 items-center justify-center", t.className)}>
                    <t.icon className="size-4" stroke={1.75} />
                  </span>
                  {t.label}
                </span>
              )
            },
          },
          { key: "title", header: "Judul", cell: (n) => <span className="block max-w-64 truncate">{n.title}</span> },
          { key: "email", header: "Status email", cell: (n) => <EmailStatusChip status={n.email_status} /> },
          { key: "attempts", header: "Percobaan", className: "text-right", cell: (n) => n.email_attempts },
          { key: "read", header: "Dibaca", cell: (n) => <BoolIcon value={!!n.read_at} label="Dibaca" /> },
        ]}
        emptyText="Belum ada notifikasi."
      />
      <SidePanel
        open={!!selected}
        onClose={() => set({ id: null })}
        title={selected?.title ?? ""}
        description={selected ? NOTIF_TYPE[selected.type].label : undefined}
        footer={
          selected?.email_status === "failed" ? (
            <Button onClick={() => setResend(true)}>Kirim ulang email</Button>
          ) : undefined
        }
      >
        {selected && (
          <>
            <p className="text-sm leading-relaxed">{selected.body}</p>
            <DataList
              columns={1}
              items={[
                {
                  label: "Penerima",
                  value: (
                    <Link href={`/admin/pengguna/${selected.user.id}`} className="text-primary hover:underline">
                      {selected.user.name}
                    </Link>
                  ),
                },
                {
                  label: "Objek terkait",
                  value:
                    typeof selected.data?.application_id === "string" ? (
                      <Link href={`/admin/pengajuan/${selected.data.application_id}`} className="text-primary hover:underline">
                        Pengajuan {selected.data.application_id.slice(0, 8)}
                      </Link>
                    ) : null,
                },
                { label: "Status email", value: <EmailStatusChip status={selected.email_status} /> },
                { label: "Percobaan", value: selected.email_attempts },
                { label: "Dibuat", value: <DateTime value={selected.created_at} /> },
                { label: "Dibaca", value: <DateTime value={selected.read_at} /> },
              ]}
            />
            {selected.email_error && (
              <div className="border border-destructive/30 bg-destructive/5 p-4">
                <p className="mb-1 text-[0.6875rem] font-semibold tracking-widest text-destructive uppercase">Error email</p>
                <code className="font-mono text-xs [overflow-wrap:anywhere] text-destructive">{selected.email_error}</code>
              </div>
            )}
          </>
        )}
      </SidePanel>
      <ConfirmDialog
        open={resend}
        onOpenChange={setResend}
        title="Kirim ulang email?"
        description={selected ? `Email “${selected.title}” akan dijadwalkan ulang ke ${selected.user.email}.` : undefined}
        confirmLabel="Kirim ulang"
        onConfirm={async () => {
          try {
            await adminApi.post(`/admin/notifications/${selected!.id}/resend-email`)
            toast.add({ title: "Email dijadwalkan ulang.", type: "success" })
            setPicked({ ...selected!, email_status: "pending" })
            void revalidate("admin", "/admin/notifications", "/admin/dashboard")
          } catch (e) {
            handleApiError(e, { admin: true })
          }
        }}
      />
    </>
  )
}

function BroadcastForm({ onSent }: { onSent: () => void }) {
  const [title, setTitle] = React.useState("")
  const [body, setBody] = React.useState("")
  const [stores, setStores] = React.useState(false)
  const [umkms, setUmkms] = React.useState(false)
  const [users, setUsers] = React.useState<string[]>([])
  const [email, setEmail] = React.useState(true)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [confirm, setConfirm] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const userOptions = useUserOptions()

  const recipients = users.length
  const targetText =
    stores && umkms
      ? "Kirim ke semua toko dan UMKM aktif?"
      : stores
        ? "Kirim ke semua toko aktif?"
        : umkms
          ? "Kirim ke semua UMKM aktif?"
          : `Kirim ke ${users.length} pengguna terpilih?`

  const check = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = "Judul wajib diisi."
    else if (title.length > 80) e.title = "Maksimal 80 karakter."
    if (!body.trim()) e.body = "Isi pengumuman wajib diisi."
    else if (body.length > 500) e.body = "Maksimal 500 karakter."
    if (!stores && !umkms && !users.length) e.target = "Pilih minimal satu target."
    setErrors(e)
    if (!Object.keys(e).length) setConfirm(true)
  }

  const send = async () => {
    setBusy(true)
    try {
      const res = await adminApi.post<{ recipients_count: number }>("/admin/notifications/broadcast", {
        title: title.trim(),
        body: body.trim(),
        target: { roles: [...(stores ? ["store"] : []), ...(umkms ? ["umkm"] : [])], user_ids: users },
        send_email: email,
      })
      toast.add({ title: `Pengumuman dikirim ke ${res.recipients_count} pengguna.`, type: "success" })
      setTitle("")
      setBody("")
      setStores(false)
      setUmkms(false)
      setUsers([])
      void revalidate("admin", "/admin/notifications", "/admin/audit-logs")
      onSent()
    } catch (e) {
      handleApiError(e, { admin: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <Section title="Pengumuman baru">
        <div className="flex flex-col gap-8">
          <FormField label="Judul" htmlFor="bc-title" required error={errors.title} aside={<CharCount value={title} max={80} />}>
            <Input id="bc-title" value={title} aria-invalid={!!errors.title || undefined} onChange={(e) => setTitle(e.target.value)} placeholder="Jadwal pilot diperpanjang" />
          </FormField>
          <FormField label="Isi pengumuman" htmlFor="bc-body" required error={errors.body} aside={<CharCount value={body} max={500} />}>
            <Textarea id="bc-body" value={body} aria-invalid={!!errors.body || undefined} onChange={(e) => setBody(e.target.value)} className="min-h-28" />
          </FormField>
          <FormField label="Target" required error={errors.target}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-6">
                <Label className="flex items-center gap-2.5 normal-case">
                  <Checkbox checked={stores} onCheckedChange={(v) => setStores(!!v)} />
                  <span className="text-sm font-normal tracking-normal">Semua toko</span>
                </Label>
                <Label className="flex items-center gap-2.5 normal-case">
                  <Checkbox checked={umkms} onCheckedChange={(v) => setUmkms(!!v)} />
                  <span className="text-sm font-normal tracking-normal">Semua UMKM</span>
                </Label>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">Atau pilih pengguna tertentu</span>
                <EntityMultiPicker options={userOptions} value={users} onChange={setUsers} placeholder="Cari nama atau email…" />
              </div>
            </div>
          </FormField>
          <Label className="flex items-center gap-2.5 normal-case">
            <Checkbox checked={email} onCheckedChange={(v) => setEmail(!!v)} />
            <span className="text-sm font-normal tracking-normal">Kirim juga lewat email</span>
          </Label>
          <div className="flex justify-end">
            <Button data-save onClick={check} disabled={busy}>
              {busy && <Spinner data-icon="inline-start" />}
              <IconSpeakerphone data-icon="inline-start" /> Kirim pengumuman
            </Button>
          </div>
        </div>
      </Section>
      <Section title="Pratinjau" description="Tampilan di halaman Notifikasi aplikasi pengguna.">
        <div className="flex items-start gap-4 border bg-primary/[0.03] px-5 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
            <IconSpeakerphone className="size-5" stroke={1.75} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-semibold [overflow-wrap:anywhere]">{title || "Judul pengumuman"}</span>
            <span className="text-sm whitespace-pre-line text-muted-foreground [overflow-wrap:anywhere]">{body || "Isi pengumuman akan tampil di sini."}</span>
            <span className="text-xs text-muted-foreground">baru saja</span>
          </span>
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
        </div>
      </Section>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={targetText} description={stores || umkms ? (email ? "Termasuk salinan email." : undefined) : `${recipients} penerima${email ? ", termasuk email" : ""}.`} confirmLabel="Kirim" onConfirm={() => void send()} />
    </div>
  )
}
