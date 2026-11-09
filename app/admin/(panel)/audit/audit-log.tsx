"use client"

import * as React from "react"
import Link from "next/link"

import { addDaysIso } from "@/lib/format"
import { useApi } from "@/lib/use-api"
import type { AuditAction, AuditLog, TargetType } from "@/lib/admin-types"
import { useUrlParams } from "@/hooks/use-url-params"
import { AdminPage } from "@/components/admin/admin-page"
import {
  AUDIT_ACTION_LABEL,
  CellLink,
  ChangeValue,
  DataList,
  DateTime,
  IdCell,
  TARGET_LABEL,
} from "@/components/admin/admin-ui"
import { DataTable } from "@/components/admin/data-table"
import { SidePanel } from "@/components/admin/pickers"
import { useAdminOptions } from "@/components/admin/options"

const TARGET_PATH: Partial<Record<TargetType, string>> = {
  user: "/admin/pengguna/",
  store: "/admin/toko/",
  umkm: "/admin/umkm/",
  opportunity: "/admin/peluang/",
  product: "/admin/produk/",
  application: "/admin/pengajuan/",
}

const targetHref = (l: AuditLog) => {
  if (l.target_type === "category") return "/admin/kategori"
  if (l.target_type === "file") return `/admin/file?id=${l.target_id}`
  if (l.target_type === "notification") return `/admin/notifikasi?id=${l.target_id}`
  const base = TARGET_PATH[l.target_type]
  return base ? `${base}${l.target_id}` : null
}

/** A22 · Audit log (read-only): `GET /admin/audit-logs`, side panel `GET /admin/audit-logs/{id}`. */
export function AuditLogTable() {
  const { get, set } = useUrlParams()
  const adminOptions = useAdminOptions()
  const [now] = React.useState(() => new Date())
  const daysAgo = (n: number) => addDaysIso(-n, now)
  const selectedId = get("id")
  const selectedQ = useApi<AuditLog>("admin", selectedId ? `/admin/audit-logs/${selectedId}` : null)
  const selected = selectedQ.data?.id === selectedId ? selectedQ.data : undefined
  const targetId = get("target_id")

  return (
    <AdminPage title="Audit log" description="Semua tindakan admin. Hanya-baca; audit log belum bisa diekspor.">
      <DataTable<AuditLog>
        endpoint="/admin/audit-logs"
        rowKey={(l) => l.id}
        onRowClick={(l) => set({ id: l.id })}
        filters={[
          { key: "admin_id", label: "Admin", searchable: true, options: adminOptions },
          {
            key: "action",
            label: "Aksi",
            options: (Object.keys(AUDIT_ACTION_LABEL) as AuditAction[]).map((a) => ({ value: a, label: AUDIT_ACTION_LABEL[a] })),
          },
          {
            key: "target_type",
            label: "Jenis objek",
            options: (Object.keys(TARGET_LABEL) as TargetType[]).map((t) => ({ value: t, label: TARGET_LABEL[t] })),
          },
          {
            key: "target_id",
            label: "ID objek",
            searchable: true,
            options: targetId ? [{ value: targetId, label: targetId.slice(0, 8) }] : [],
          },
          {
            key: "created_after",
            label: "Rentang tanggal",
            options: [
              { value: daysAgo(1), label: "24 jam terakhir" },
              { value: daysAgo(7), label: "7 hari terakhir" },
              { value: daysAgo(30), label: "30 hari terakhir" },
              { value: daysAgo(90), label: "90 hari terakhir" },
            ],
          },
        ]}
        columns={[
          { key: "created_at", header: "Waktu", sort: true, cell: (l) => <DateTime value={l.created_at} /> },
          { key: "admin", header: "Admin", cell: (l) => l.admin.name },
          { key: "action", header: "Aksi", cell: (l) => <span className="font-medium">{AUDIT_ACTION_LABEL[l.action]}</span> },
          { key: "type", header: "Jenis objek", cell: (l) => TARGET_LABEL[l.target_type] ?? l.target_type },
          {
            key: "target",
            header: "Objek",
            cell: (l) => {
              const href = targetHref(l)
              return href ? (
                <CellLink href={href} className="block max-w-56 truncate">
                  {l.target_label}
                </CellLink>
              ) : (
                <span className="block max-w-56 truncate">{l.target_label}</span>
              )
            },
          },
          { key: "reason", header: "Alasan", cell: (l) => <span className="block max-w-72 truncate text-muted-foreground">{l.reason || "—"}</span> },
        ]}
        emptyText="Belum ada tindakan admin."
      />
      <SidePanel
        open={!!selected}
        onClose={() => set({ id: null })}
        title={selected ? AUDIT_ACTION_LABEL[selected.action] : ""}
        description={selected ? `${TARGET_LABEL[selected.target_type]} · ${selected.target_label}` : undefined}
      >
        {selected && (
          <>
            <DataList
              columns={1}
              items={[
                {
                  label: "Admin",
                  value: selected.admin.id ? (
                    <Link href={`/admin/pengguna/${selected.admin.id}`} className="text-primary hover:underline">
                      {selected.admin.name}
                    </Link>
                  ) : (
                    selected.admin.name
                  ),
                },
                { label: "Waktu", value: <DateTime value={selected.created_at} /> },
                { label: "Aksi", value: AUDIT_ACTION_LABEL[selected.action] },
                {
                  label: "Objek",
                  value: targetHref(selected) ? (
                    <Link href={targetHref(selected)!} className="text-primary hover:underline">
                      {selected.target_label}
                    </Link>
                  ) : (
                    selected.target_label
                  ),
                },
                { label: "ID log", value: <IdCell id={selected.id} /> },
                { label: "Alasan", value: selected.reason || null },
              ]}
            />
            <div className="flex flex-col gap-3">
              <p className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">Perubahan</p>
              {selected.changes.length ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs tracking-wider text-muted-foreground uppercase">
                      <th className="py-2 pr-3 font-medium">Field</th>
                      <th className="py-2 font-medium">Sebelum → sesudah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.changes.map((c) => (
                      <tr key={c.field} className="border-b last:border-0">
                        <td className="py-2.5 pr-3 font-mono text-xs [overflow-wrap:anywhere]">{c.field}</td>
                        <td className="py-2.5">
                          <ChangeValue before={c.before} after={c.after} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada perubahan field.</p>
              )}
            </div>
            <DataList
              columns={1}
              items={[
                { label: "IP address", value: <code className="font-mono text-xs">{selected.ip_address ?? "—"}</code> },
                { label: "User agent", value: <code className="font-mono text-xs text-muted-foreground">{selected.user_agent ?? "—"}</code> },
              ]}
            />
          </>
        )}
      </SidePanel>
    </AdminPage>
  )
}
