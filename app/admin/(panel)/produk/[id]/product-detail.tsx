"use client"

import * as React from "react"
import Link from "next/link"
import { IconArchive, IconEdit, IconPhoto, IconRestore, IconTrash, IconRefresh } from "@tabler/icons-react"

import { formatDateTime, formatRupiah } from "@/lib/format"
import { findProduct } from "@/lib/admin-mock"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Section } from "@/components/app/blocks"
import { ApplicationStatusChip, DecisionChip, StockChip } from "@/components/app/status"
import { useAdmin } from "@/components/admin/admin-context"
import { AdminPage } from "@/components/admin/admin-page"
import {
  ActionStack,
  ActiveChip,
  AdminHistoryCard,
  Banner,
  CreatorChip,
  DataList,
  DateTime,
  DetailColumns,
  IdCell,
} from "@/components/admin/admin-ui"
import { MiniTable } from "@/components/admin/embedded"
import { DocumentViewer } from "@/components/admin/pickers"
import { useProductActions } from "@/components/admin/product-actions"
import { shelfLabel } from "../products-table"

/** A13 · Detail produk. */
export function ProductDetail({ id }: { id: string }) {
  const p = findProduct(id)!
  const { isSuperadmin } = useAdmin()
  const { open, modals } = useProductActions()
  const [viewer, setViewer] = React.useState<number | null>(null)
  const photos = Array.from({ length: p.photo_count }, (_, i) => ({
    id: `${p.id}-${i}`,
    purpose: "product_photo" as const,
    name: `foto-${i + 1}.jpg`,
    mime: "image/jpeg",
    size_kb: 640,
    owner: { id: "", name: "", email: "" },
    used_in: [],
    is_removed: false,
    created_at: p.created_at,
  }))

  return (
    <AdminPage
      breadcrumb={[{ label: "Produk", href: "/admin/produk" }]}
      title={p.name}
      meta={
        <span className="flex flex-wrap gap-2">
          <ActiveChip active={p.is_active} />
          <CreatorChip createdBy={p.created_by} kind="UMKM" />
        </span>
      }
      description={
        <Link href={`/admin/pengguna/${p.umkm.owner_id}?tab=umkm`} className="text-primary hover:underline">
          {p.umkm.business_name}
        </Link>
      }
    >
      {p.deleted_at && (
        <Banner action={<Button size="sm" variant="outline" onClick={() => open("restore", p)}>Pulihkan</Button>}>
          Data ini dihapus pada {formatDateTime(p.deleted_at)} oleh {p.deleted_by}.
        </Banner>
      )}
      <DetailColumns
        main={
          <>
            <Section title="Galeri">
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {photos.map((ph, i) => (
                  <li key={ph.id} className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setViewer(i)}
                      className="relative flex aspect-square items-center justify-center bg-muted text-muted-foreground outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/30"
                      aria-label={`Buka foto ${i + 1}`}
                    >
                      <IconPhoto className="size-7" stroke={1.25} />
                      {i === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-foreground px-1.5 py-0.5 text-[0.5625rem] font-semibold tracking-widest text-background uppercase">
                          Utama
                        </span>
                      )}
                    </button>
                    <Button variant="ghost" size="xs" className="text-destructive" onClick={() => open("remove_photo", p)}>
                      Hapus foto
                    </Button>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Detail">
              <DataList
                items={[
                  { label: "Kategori", value: p.category.name },
                  { label: "Masa simpan", value: shelfLabel(p) },
                  { label: "Deskripsi", value: p.description || null, full: true },
                  {
                    label: "Tagar",
                    value: p.tags.length ? (
                      <span className="flex flex-wrap gap-1.5">
                        {p.tags.map((t) => (
                          <span key={t} className="bg-muted px-2 py-1 text-xs">#{t}</span>
                        ))}
                      </span>
                    ) : null,
                    full: true,
                  },
                  { label: "Harga setor", value: formatRupiah(p.base_price) },
                  { label: "Harga jual saran", value: formatRupiah(p.suggested_retail_price) },
                  { label: "Selisih untuk toko", value: formatRupiah(p.suggested_retail_price - p.base_price) },
                  { label: "Sedang dijual di", value: `${p.active_placements} toko` },
                ]}
              />
            </Section>
            <Section title="Riwayat pengajuan">
              <MiniTable
                rows={p.applications}
                rowKey={(a) => a.id}
                rowHref={(a) => `/admin/pengajuan/${a.id}`}
                empty="Produk ini belum pernah diajukan."
                columns={[
                  { header: "Toko", cell: (a) => a.store },
                  { header: "Status pengajuan", cell: (a) => <ApplicationStatusChip status={a.status} /> },
                  { header: "Keputusan", cell: (a) => <DecisionChip decision={a.decision} /> },
                  { header: "Harga jual", cell: (a) => (a.sell_price ? formatRupiah(a.sell_price) : "—") },
                  { header: "Stok", cell: (a) => (a.stock_status ? <StockChip status={a.stock_status} quantity={a.stock_quantity} mode="count" /> : "—") },
                ]}
              />
            </Section>
          </>
        }
        aside={
          <>
            <Section title="Aksi">
              <ActionStack>
                {!p.deleted_at && (
                  <Button variant="outline" render={<Link href={`/admin/produk/${p.id}/ubah`} />} nativeButton={false}>
                    <IconEdit data-icon="inline-start" /> Ubah
                  </Button>
                )}
                {!p.deleted_at &&
                  (p.is_active ? (
                    <Button variant="outline" onClick={() => open("archive", p)}>
                      <IconArchive data-icon="inline-start" /> Arsipkan
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => open("activate", p)}>
                      <IconRefresh data-icon="inline-start" /> Aktifkan
                    </Button>
                  ))}
                {p.deleted_at ? (
                  <Button variant="outline" onClick={() => open("restore", p)}>
                    <IconRestore data-icon="inline-start" /> Pulihkan
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={() => open("delete", p)}>
                    <IconTrash data-icon="inline-start" /> Hapus
                  </Button>
                )}
                {isSuperadmin && p.applications.length === 0 && (
                  <Button variant="destructive" onClick={() => open("hard_delete", p)}>
                    <IconTrash data-icon="inline-start" /> Hapus permanen
                  </Button>
                )}
              </ActionStack>
            </Section>
            <Section title="Info">
              <DataList
                columns={1}
                items={[
                  { label: "ID", value: <IdCell id={p.id} /> },
                  { label: "Dibuat oleh", value: p.created_by.name },
                  { label: "Dibuat", value: <DateTime value={p.created_at} /> },
                  { label: "Diperbarui", value: <DateTime value={p.updated_at} /> },
                ]}
              />
            </Section>
            <AdminHistoryCard type="product" id={p.id} />
          </>
        }
      />
      <Dialog open={viewer != null} onOpenChange={(o) => !o && setViewer(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogTitle>Foto produk</DialogTitle>
          <DocumentViewer key={viewer ?? 0} files={[...photos.slice(viewer ?? 0), ...photos.slice(0, viewer ?? 0)]} />
        </DialogContent>
      </Dialog>
      {modals}
    </AdminPage>
  )
}
