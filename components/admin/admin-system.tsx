"use client"

import * as React from "react"
import Link from "next/link"
import { IconLock, IconMapQuestion, IconServerOff, type Icon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { AdminPage, type Crumb } from "@/components/admin/admin-page"

/** A25 · system state inside the admin shell. */
export function AdminSystemState({
  icon: Ico,
  code,
  title,
  description,
  actions,
  breadcrumb,
}: {
  icon: Icon
  code?: string
  title: string
  description?: string
  actions: React.ReactNode
  breadcrumb?: Crumb[]
}) {
  return (
    <AdminPage bare breadcrumb={breadcrumb} title={title}>
      <div className="flex flex-1 items-center justify-center py-16">
        <div className="flex w-full max-w-md flex-col items-center gap-6 bg-background p-10 text-center shadow-sm ring-1 ring-foreground/5">
          <div className="relative">
            <span className="flex size-20 items-center justify-center bg-muted">
              <Ico className="size-9" stroke={1.25} />
            </span>
            {code && (
              <span className="absolute -right-3 -bottom-3 bg-foreground px-2 py-1 text-[0.625rem] font-semibold tracking-widest text-background">
                {code}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-lg leading-snug font-semibold tracking-wider uppercase">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <div className="flex flex-wrap justify-center gap-2">{actions}</div>
        </div>
      </div>
    </AdminPage>
  )
}

export function AdminNotFoundState({ backHref = "/admin", backLabel = "Dashboard" }: { backHref?: string; backLabel?: string }) {
  return (
    <AdminSystemState
      icon={IconMapQuestion}
      code="404"
      title="Halaman atau data tidak ditemukan."
      description="Tautan mungkin salah atau data sudah dihapus permanen."
      actions={
        <Button render={<Link href={backHref} />} nativeButton={false}>
          Kembali ke {backLabel}
        </Button>
      }
    />
  )
}

export function AdminAccessDenied() {
  return (
    <AdminSystemState
      icon={IconLock}
      code="403"
      title="Akses tidak tersedia"
      description="Halaman ini khusus superadmin."
      actions={
        <Button render={<Link href="/admin" />} nativeButton={false}>
          Kembali ke Dashboard
        </Button>
      }
    />
  )
}

export function AdminServerError({ onRetry }: { onRetry: () => void }) {
  return (
    <AdminSystemState
      icon={IconServerOff}
      code="500"
      title="Kesalahan server"
      description="Terjadi kesalahan di server. Coba beberapa saat lagi."
      actions={<Button onClick={onRetry}>Coba lagi</Button>}
    />
  )
}
