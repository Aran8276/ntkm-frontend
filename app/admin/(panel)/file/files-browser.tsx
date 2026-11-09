"use client"

import * as React from "react"
import Link from "next/link"
import { IconFileTypePdf, IconFiles, IconPhoto, IconTrash } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/format"
import { adminApi, type Paginated } from "@/lib/api"
import { revalidate, useApi } from "@/lib/use-api"
import type { AdminFile, FilePurpose, FileUsage } from "@/lib/admin-types"
import { LoadError } from "@/components/app/feedback"
import { TableSkeleton } from "@/components/admin/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { EmptyState } from "@/components/app/blocks"
import { useUrlParams } from "@/hooks/use-url-params"
import { AdminPage } from "@/components/admin/admin-page"
import { DataList, DateTime, DeletedChip } from "@/components/admin/admin-ui"
import { DocumentViewer, EntityPicker, SidePanel } from "@/components/admin/pickers"
import { useUserOptions } from "@/components/admin/options"
import { RiskyActionModal } from "@/components/admin/risky-action"

export const PURPOSE_LABEL: Record<FilePurpose, string> = {
  product_photo: "Foto produk",
  store_photo: "Foto toko",
  umkm_logo: "Logo UMKM",
  legal_document: "Dokumen legalitas",
}

/** Where a file is used → admin page. */
function usageHref(u: FileUsage, ownerId: string) {
  if (u.type === "product") return `/admin/produk/${u.id}`
  if (u.type === "store") return `/admin/pengguna/${u.owner_id ?? ownerId}?tab=toko`
  return `/admin/pengguna/${u.owner_id ?? ownerId}?tab=umkm`
}

/** A20 · File: `GET /admin/files` (filters in the URL), side panel `GET /admin/files/{id}`. */
export function FilesBrowser() {
  const { get, set } = useUrlParams()
  const purpose = get("purpose") ?? ""
  const owner = get("owner_id")
  const removed = get("is_removed") === "true"
  const since = get("created_after") ?? ""
  const selectedId = get("id")
  const [removing, setRemoving] = React.useState(false)
  const userOptions = useUserOptions()

  const q = useApi<Paginated<AdminFile>>("admin", "/admin/files", {
    purpose: purpose || undefined,
    owner_id: owner,
    is_removed: removed ? true : undefined,
    created_after: since || undefined,
    page_size: 100,
  })
  const files = q.data?.results ?? []
  const selectedQ = useApi<AdminFile>("admin", selectedId ? `/admin/files/${selectedId}` : null)
  const selected = selectedQ.data?.id === selectedId ? selectedQ.data : undefined
  const hasFilter = !!(purpose || owner || removed || since)

  return (
    <AdminPage title="File" description="Semua foto dan dokumen yang diunggah pengguna dan admin.">
      <div className="flex flex-wrap items-end gap-6 bg-background p-5 shadow-sm ring-1 ring-foreground/5">
        <label className="flex w-48 flex-col gap-1.5">
          <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">Jenis</span>
          <NativeSelect value={purpose} onChange={(e) => set({ purpose: e.target.value || null })}>
            <NativeSelectOption value="">Semua jenis</NativeSelectOption>
            {(Object.keys(PURPOSE_LABEL) as FilePurpose[]).map((p) => (
              <NativeSelectOption key={p} value={p}>
                {PURPOSE_LABEL[p]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <div className="flex w-64 flex-col gap-1.5">
          <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">Pemilik</span>
          <EntityPicker options={userOptions} value={owner} onChange={(v) => set({ owner_id: v })} placeholder="Semua pemilik" />
        </div>
        <label className="flex w-44 flex-col gap-1.5">
          <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">Diunggah sejak</span>
          <Input type="date" value={since} onChange={(e) => set({ created_after: e.target.value || null })} />
        </label>
        <label className="flex h-10 items-center gap-2.5 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          <Switch size="sm" checked={removed} onCheckedChange={(v) => set({ is_removed: v ? "true" : null })} />
          Sudah dihapus
        </label>
        {hasFilter && (
          <Button variant="link" size="xs" className="ml-auto h-10" onClick={() => set({ purpose: null, owner_id: null, is_removed: null, created_after: null })}>
            Hapus semua filter
          </Button>
        )}
      </div>

      {q.error && !q.data ? (
        <LoadError error={q.error} onRetry={q.reload} backHref="/admin" backLabel="Kembali ke Dashboard" />
      ) : q.loading ? (
        <TableSkeleton />
      ) : files.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {files.map((f) => {
            const pdf = f.mime === "application/pdf"
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => set({ id: f.id })}
                  className={cn(
                    "flex w-full flex-col bg-background text-left shadow-sm ring-1 ring-foreground/5 outline-none hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-ring/40",
                    f.is_removed && "opacity-60 grayscale",
                    f.id === selectedId && "ring-2 ring-primary"
                  )}
                >
                  <span className="relative flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground">
                    {pdf ? (
                      <IconFileTypePdf className="size-9 text-destructive/70" stroke={1.25} />
                    ) : f.url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- uploaded file served by the API
                      <img src={f.url} alt="" loading="lazy" className="size-full object-cover" />
                    ) : (
                      <IconPhoto className="size-9" stroke={1.25} />
                    )}
                    {f.is_removed && (
                      <span className="absolute top-2 left-2">
                        <DeletedChip />
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col gap-0.5 p-3">
                    <span className="text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">{PURPOSE_LABEL[f.purpose]}</span>
                    <span className="truncate text-sm font-medium">{f.owner.name}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(f.created_at, { weekday: false })}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : hasFilter ? (
        <EmptyState
          icon={IconFiles}
          action={<Button variant="outline" onClick={() => set({ purpose: null, owner_id: null, is_removed: null, created_after: null })}>Hapus semua filter</Button>}
        >
          Tidak ada data yang cocok dengan filter.
        </EmptyState>
      ) : (
        <EmptyState icon={IconFiles}>Belum ada file yang diunggah.</EmptyState>
      )}

      <SidePanel
        open={!!selected}
        onClose={() => set({ id: null })}
        title={selected ? PURPOSE_LABEL[selected.purpose] : ""}
        description={selected?.name}
        footer={
          selected && !selected.is_removed ? (
            <Button variant="destructive" onClick={() => setRemoving(true)}>
              <IconTrash data-icon="inline-start" /> Hapus file
            </Button>
          ) : undefined
        }
      >
        {selected && (
          <>
            <DocumentViewer files={[selected]} />
            <DataList
              columns={1}
              items={[
                { label: "Jenis", value: PURPOSE_LABEL[selected.purpose] },
                { label: "Ukuran", value: `${Math.max(1, Math.round(selected.size / 1024)).toLocaleString("id-ID")} KB` },
                { label: "Tipe file", value: <code className="font-mono text-xs">{selected.mime}</code> },
                {
                  label: "Pemilik",
                  value: (
                    <Link href={`/admin/pengguna/${selected.owner.id}`} className="text-primary hover:underline">
                      {selected.owner.name}
                    </Link>
                  ),
                },
                {
                  label: "Dipakai di",
                  value: selected.used_in.length ? (
                    <span className="flex flex-col gap-1">
                      {selected.used_in.map((u) => (
                        <Link key={`${u.type}-${u.id}`} href={usageHref(u, selected.owner.id)} className="text-primary hover:underline">
                          {u.label}
                        </Link>
                      ))}
                    </span>
                  ) : null,
                },
                { label: "Diunggah", value: <DateTime value={selected.created_at} /> },
                { label: "Status", value: selected.is_removed ? <DeletedChip /> : "Aktif" },
              ]}
            />
          </>
        )}
      </SidePanel>

      <RiskyActionModal
        open={removing}
        onOpenChange={setRemoving}
        title={`Hapus file ${selected?.name ?? ""}?`}
        impacts={[
          "File dilepas dari semua tempat yang memakainya",
          "Tautan lama menampilkan gambar placeholder",
          "File di storage dihapus otomatis setelah 30 hari",
        ]}
        notify
        notifyLabel="Beri tahu pemilik"
        destructive
        confirmLabel="Hapus file"
        onConfirm={async ({ reason, notify }) => {
          await adminApi.post(`/admin/files/${selected!.id}/remove`, { admin_reason: reason, notify_user: notify })
          toast.add({ title: "File dihapus.", type: "success" })
          void revalidate("admin", "/admin/files", "/admin/products", "/admin/stores", "/admin/umkms", "/admin/audit-logs")
        }}
      />
    </AdminPage>
  )
}
