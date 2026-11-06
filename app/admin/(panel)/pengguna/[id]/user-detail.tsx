"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconBuildingStore,
  IconEdit,
  IconPlant2,
  IconRestore,
  IconShieldCheck,
  IconTrash,
  IconUserCheck,
  IconUserOff,
} from "@tabler/icons-react"

import { formatDateTime } from "@/lib/format"
import {
  ADMIN_APPLICATIONS,
  ADMIN_STORES,
  ADMIN_UMKMS,
  auditBy,
  auditFor,
  findUser,
} from "@/lib/admin-mock"
import type { AdminUser, LegalKind } from "@/lib/admin-types"
import { Button } from "@/components/ui/button"
import { EmptyState, Section, Thumb } from "@/components/app/blocks"
import { useQueryState } from "@/hooks/use-query-state"
import { useAdmin } from "@/components/admin/admin-context"
import { AdminPage } from "@/components/admin/admin-page"
import {
  AccountStatusChip,
  ActionStack,
  AdminHistoryCard,
  AdminLevelChip,
  Avatar,
  Banner,
  DataList,
  DateTime,
  DetailColumns,
  EmailLink,
  IdCell,
  PhoneLink,
  RoleChips,
  TabBar,
  VerificationChip,
} from "@/components/admin/admin-ui"
import {
  ApplicationsMiniTable,
  AuditMiniTable,
  MiniStats,
  OperatingHoursTable,
  StaticMap,
} from "@/components/admin/embedded"
import { DocumentViewer } from "@/components/admin/pickers"
import { useProfileActions } from "@/components/admin/profile-actions"
import { UserFormModal, useUserActions } from "@/components/admin/user-actions"

type Tab = "akun" | "toko" | "umkm" | "kerja-sama" | "aktivitas"

/** A04 · Detail pengguna. */
export function UserDetail({ id }: { id: string }) {
  const u = findUser(id)!
  const [tab, setTab] = useQueryState<Tab>("tab", "akun")
  const { open, modals } = useUserActions()
  const [editing, setEditing] = React.useState(false)

  return (
    <AdminPage
      breadcrumb={[{ label: "Pengguna", href: "/admin/pengguna" }]}
      title={u.name}
      meta={
        <span className="flex flex-wrap items-center gap-2">
          <AccountStatusChip status={u.status} />
          <RoleChips roles={u.roles} />
          {u.admin_role && <AdminLevelChip level={u.admin_role} />}
        </span>
      }
      description={
        <span className="flex items-center gap-3">
          <Avatar name={u.name} size="sm" />
          <EmailLink email={u.email} />
        </span>
      }
    >
      {u.status === "suspended" && (
        <Banner tone="danger" icon={IconUserOff}>
          Disuspend {formatDateTime(u.suspended_at!)}: {u.suspended_reason}
        </Banner>
      )}
      {u.deleted_at && (
        <Banner
          tone="neutral"
          action={
            <Button size="sm" variant="outline" onClick={() => open("restore", u)}>
              Pulihkan
            </Button>
          }
        >
          Data ini dihapus pada {formatDateTime(u.deleted_at)} oleh {u.deleted_by}.
        </Banner>
      )}
      {u.status === "invited" && (
        <Banner tone="info">Belum pernah masuk. Undangan dikirim ke {u.email}.</Banner>
      )}

      <TabBar
        value={tab}
        onChange={setTab}
        options={[
          { value: "akun", label: "Akun" },
          { value: "toko", label: "Profil toko" },
          { value: "umkm", label: "Profil UMKM" },
          { value: "kerja-sama", label: "Kerja sama", count: u.stats.applications_active },
          { value: "aktivitas", label: "Aktivitas" },
        ]}
      />

      {tab === "akun" && <AccountTab user={u} onEdit={() => setEditing(true)} open={open} />}
      {tab === "toko" && <StoreTab user={u} />}
      {tab === "umkm" && <UmkmTab user={u} />}
      {tab === "kerja-sama" && <PartnershipTab user={u} />}
      {tab === "aktivitas" && <ActivityTab user={u} />}

      {modals}
      <UserFormModal open={editing} onOpenChange={setEditing} user={u} />
    </AdminPage>
  )
}

function AccountTab({
  user: u,
  onEdit,
  open,
}: {
  user: AdminUser
  onEdit: () => void
  open: ReturnType<typeof useUserActions>["open"]
}) {
  const { isSuperadmin } = useAdmin()
  return (
    <DetailColumns
      main={
        <>
          <Section title="Data akun">
            <DataList
              items={[
                { label: "Nama", value: u.name },
                { label: "Email", value: <EmailLink email={u.email} /> },
                { label: "Peran", value: <RoleChips roles={u.roles} /> },
                { label: "Status", value: <AccountStatusChip status={u.status} /> },
                { label: "Level admin", value: u.admin_role ? <AdminLevelChip level={u.admin_role} /> : null },
                { label: "Diundang oleh", value: u.invited_by?.name },
                { label: "Login terakhir", value: <DateTime value={u.last_login_at} /> },
                { label: "Dibuat", value: <DateTime value={u.created_at} /> },
                { label: "ID", value: <IdCell id={u.id} /> },
              ]}
            />
          </Section>
          <Section title="Statistik">
            <MiniStats
              items={[
                { label: "Peluang", value: u.stats.opportunities, href: u.store_profile ? `/admin/peluang?store_id=${u.store_profile.id}` : undefined },
                { label: "Produk", value: u.stats.products, href: u.umkm_profile ? `/admin/produk?umkm_id=${u.umkm_profile.id}` : undefined },
                { label: "Pengajuan aktif", value: u.stats.applications_active, href: `?tab=kerja-sama` },
                { label: "Pengajuan total", value: u.stats.applications_total, href: `?tab=kerja-sama` },
              ]}
            />
          </Section>
        </>
      }
      aside={
        <>
          <Section title="Aksi">
            <ActionStack>
              {!u.deleted_at && (
                <Button variant="outline" onClick={onEdit}>
                  <IconEdit data-icon="inline-start" /> Ubah
                </Button>
              )}
              {!u.deleted_at && u.status === "active" && (
                <Button variant="destructive" onClick={() => open("suspend", u)}>
                  <IconUserOff data-icon="inline-start" /> Suspend
                </Button>
              )}
              {!u.deleted_at && u.status === "suspended" && (
                <Button variant="outline" onClick={() => open("activate", u)}>
                  <IconUserCheck data-icon="inline-start" /> Aktifkan
                </Button>
              )}
              {u.deleted_at ? (
                <Button variant="outline" onClick={() => open("restore", u)}>
                  <IconRestore data-icon="inline-start" /> Pulihkan
                </Button>
              ) : (
                <Button variant="destructive" onClick={() => open("delete", u)}>
                  <IconTrash data-icon="inline-start" /> Hapus
                </Button>
              )}
              {isSuperadmin && u.stats.applications_total === 0 && (
                <Button variant="destructive" onClick={() => open("hard_delete", u)}>
                  <IconTrash data-icon="inline-start" /> Hapus permanen
                </Button>
              )}
            </ActionStack>
          </Section>
          <AdminHistoryCard type="user" id={u.id} />
        </>
      }
    />
  )
}

function StoreTab({ user: u }: { user: AdminUser }) {
  const profile = useProfileActions()
  const s = ADMIN_STORES.find((x) => x.id === u.store_profile?.id)
  if (!s)
    return (
      <EmptyState
        icon={IconBuildingStore}
        action={
          <Button render={<Link href={`/admin/toko/baru?user_id=${u.id}`} />} nativeButton={false}>
            Buat profil toko
          </Button>
        }
      >
        Akun ini belum punya profil toko.
      </EmptyState>
    )
  return (
    <DetailColumns
      main={
        <>
          {s.deleted_at && <Banner>Data ini dihapus pada {formatDateTime(s.deleted_at)} oleh {s.deleted_by}.</Banner>}
          <Section title="Profil">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Thumb kind="store" size="lg" />
                <div>
                  <p className="text-lg font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">Diperbarui {formatDateTime(s.updated_at)}</p>
                </div>
              </div>
              <DataList
                items={[
                  { label: "Telepon (WhatsApp)", value: <PhoneLink phone={s.phone} /> },
                  { label: "Alamat", value: s.address },
                ]}
              />
              <StaticMap lat={s.lat} lng={s.lng} />
            </div>
          </Section>
          <Section title="Jam operasional">
            <OperatingHoursTable hours={s.operating_hours} />
          </Section>
          <Section title="Statistik">
            <MiniStats
              items={[
                { label: "Peluang dibuka", value: s.stats.opportunities_open, href: `/admin/peluang?store_id=${s.id}` },
                { label: "Pengajuan aktif", value: s.stats.applications_active, href: `/admin/pengajuan?store_id=${s.id}` },
                { label: "Item di rak", value: s.stats.items_on_shelf, href: `/admin/stok?store_id=${s.id}` },
              ]}
            />
          </Section>
        </>
      }
      aside={
        <>
          <Section title="Aksi">
            <ActionStack>
              <Button variant="outline" render={<Link href={`/admin/toko/${s.id}/ubah`} />} nativeButton={false}>
                <IconEdit data-icon="inline-start" /> Ubah
              </Button>
              {s.deleted_at ? (
                <Button variant="outline" onClick={() => profile.open("store", "restore", s.name)}>
                  <IconRestore data-icon="inline-start" /> Pulihkan profil
                </Button>
              ) : (
                <Button variant="destructive" onClick={() => profile.open("store", "delete", s.name)}>
                  <IconTrash data-icon="inline-start" /> Hapus profil
                </Button>
              )}
            </ActionStack>
          </Section>
          <AdminHistoryCard type="store" id={s.id} />
          {profile.modals}
        </>
      }
    />
  )
}

const LEGAL_ROWS: { key: LegalKind; label: string; field: "nib" | "pirt_number" | "halal_number" }[] = [
  { key: "nib", label: "NIB", field: "nib" },
  { key: "pirt", label: "PIRT", field: "pirt_number" },
  { key: "halal", label: "Halal", field: "halal_number" },
]

function UmkmTab({ user: u }: { user: AdminUser }) {
  const profile = useProfileActions()
  const m = ADMIN_UMKMS.find((x) => x.id === u.umkm_profile?.id)
  if (!m)
    return (
      <EmptyState
        icon={IconPlant2}
        action={
          <Button render={<Link href={`/admin/umkm/baru?user_id=${u.id}`} />} nativeButton={false}>
            Buat profil UMKM
          </Button>
        }
      >
        Akun ini belum punya profil UMKM.
      </EmptyState>
    )
  return (
    <DetailColumns
      main={
        <>
          {m.deleted_at && <Banner>Data ini dihapus pada {formatDateTime(m.deleted_at)} oleh {m.deleted_by}.</Banner>}
          <Section title="Profil">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Thumb kind="umkm" size="lg" />
                <div>
                  <p className="text-lg font-medium">{m.business_name}</p>
                  <p className="text-sm text-muted-foreground">Diperbarui {formatDateTime(m.updated_at)}</p>
                </div>
              </div>
              <DataList
                items={[
                  { label: "Nama pemilik", value: m.owner_name },
                  { label: "Telepon (WhatsApp)", value: <PhoneLink phone={m.phone} /> },
                  { label: "Alamat", value: m.address, full: true },
                  { label: "Deskripsi", value: m.description, full: true },
                ]}
              />
              <StaticMap lat={-7.97} lng={112.63} />
            </div>
          </Section>
          <Section title="Legalitas">
            <div className="flex flex-col gap-6">
              <div className="-mx-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs tracking-wider text-muted-foreground uppercase">
                      <th className="px-6 py-2 font-medium">Jenis</th>
                      <th className="px-3 py-2 font-medium">Nomor</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Catatan</th>
                      <th className="px-6 py-2 font-medium">Diputuskan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEGAL_ROWS.map((r) => {
                      const v = m.legal_verification[r.key]
                      return (
                        <tr key={r.key} className="border-b last:border-0">
                          <td className="px-6 py-3 font-medium">{r.label}</td>
                          <td className="px-3 py-3 font-mono text-xs">{m.legal[r.field] ?? "—"}</td>
                          <td className="px-3 py-3">
                            <VerificationChip status={v.status} />
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{v.note || "—"}</td>
                          <td className="px-6 py-3 text-xs text-muted-foreground">
                            {v.decided_by ? `${v.decided_by} · ${formatDateTime(v.decided_at!)}` : "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {m.legal_documents.length > 0 && <DocumentViewer files={m.legal_documents} className="max-w-xl" />}
            </div>
          </Section>
          <Section title="Statistik">
            <MiniStats
              items={[
                { label: "Produk aktif", value: m.stats.products_active, href: `/admin/produk?umkm_id=${m.id}` },
                { label: "Pengajuan aktif", value: m.stats.applications_active, href: `/admin/pengajuan?umkm_id=${m.id}` },
                { label: "Item di rak", value: m.stats.items_on_shelf, href: `/admin/stok?umkm_id=${m.id}` },
              ]}
            />
          </Section>
        </>
      }
      aside={
        <>
          <Section title="Aksi">
            <ActionStack>
              <Button variant="outline" render={<Link href={`/admin/umkm/${m.id}/ubah`} />} nativeButton={false}>
                <IconEdit data-icon="inline-start" /> Ubah
              </Button>
              <Button variant="outline" render={<Link href={`/admin/verifikasi?umkm=${m.id}`} />} nativeButton={false}>
                <IconShieldCheck data-icon="inline-start" /> Verifikasi legalitas
              </Button>
              {m.deleted_at ? (
                <Button variant="outline" onClick={() => profile.open("umkm", "restore", m.business_name)}>
                  <IconRestore data-icon="inline-start" /> Pulihkan profil
                </Button>
              ) : (
                <Button variant="destructive" onClick={() => profile.open("umkm", "delete", m.business_name)}>
                  <IconTrash data-icon="inline-start" /> Hapus profil
                </Button>
              )}
            </ActionStack>
          </Section>
          <AdminHistoryCard type="umkm" id={m.id} />
          {profile.modals}
        </>
      }
    />
  )
}

function PartnershipTab({ user: u }: { user: AdminUser }) {
  const asStore = ADMIN_APPLICATIONS.filter((a) => a.store.id === u.store_profile?.id)
  const asUmkm = ADMIN_APPLICATIONS.filter((a) => a.umkm.id === u.umkm_profile?.id)
  if (!u.store_profile && !u.umkm_profile)
    return <p className="bg-background p-10 text-center text-sm text-muted-foreground shadow-sm">Belum ada pengajuan.</p>
  return (
    <div className="flex flex-col gap-6">
      {u.store_profile && (
        <Section title="Sebagai toko" description={u.store_profile.name}>
          <ApplicationsMiniTable rows={asStore} counterpart="umkm" />
        </Section>
      )}
      {u.umkm_profile && (
        <Section title="Sebagai UMKM" description={u.umkm_profile.business_name}>
          <ApplicationsMiniTable rows={asUmkm} counterpart="store" />
        </Section>
      )}
    </div>
  )
}

function ActivityTab({ user: u }: { user: AdminUser }) {
  return (
    <div className="flex flex-col gap-6">
      <Section title="Tindakan admin terhadap akun ini">
        <AuditMiniTable rows={auditFor("user", u.id)} />
      </Section>
      {u.is_admin && (
        <Section title="Tindakan yang dilakukan akun ini">
          <AuditMiniTable rows={auditBy(u.id)} />
        </Section>
      )}
    </div>
  )
}
