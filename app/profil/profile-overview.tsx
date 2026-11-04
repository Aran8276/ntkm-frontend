"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconBook,
  IconBrandWhatsapp,
  IconChevronRight,
  IconFileText,
  IconLogout,
  IconMail,
  IconShieldLock,
  type Icon,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { initials } from "@/lib/format"
import { ME, MY_STORE, MY_UMKM } from "@/lib/mock-data"
import { Button, buttonVariants } from "@/components/ui/button"
import { AppShell } from "@/components/app/app-shell"
import { ConfirmDialog, Section, Thumb } from "@/components/app/blocks"
import { LegalChips } from "@/components/app/status"

const APP_VERSION = "0.1.0"

export function ProfileOverview() {
  const router = useRouter()
  const [logout, setLogout] = React.useState(false)
  const roles = ME.roles
  const openDays = MY_STORE.operating_hours.filter((h) => !h.is_closed).length

  return (
    <AppShell title="Profil">
      {/* Account */}
      <Section>
        <div className="flex items-center gap-5">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold">
            {initials(ME.name)}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-lg font-medium">{ME.name}</p>
            <p className="truncate text-sm text-muted-foreground">{ME.email}</p>
            <p className="text-xs text-muted-foreground">Data akun mengikuti akun Google Anda.</p>
          </div>
        </div>
      </Section>

      {/* Roles */}
      <Section
        title="Peran saya"
        action={
          <Link href="/pilih-peran?dari=profil" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Ubah peran
          </Link>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <span key={r} className="bg-primary/10 px-3 py-1.5 text-[0.6875rem] font-semibold tracking-widest text-primary uppercase">
                {r === "store" ? "Pemilik toko" : "Pelaku UMKM"}
              </span>
            ))}
          </div>
          {roles.length === 1 && (
            <Link href="/pilih-peran?dari=profil&pilih=both" className={cn(buttonVariants({ variant: "secondary" }), "self-start")}>
              {roles[0] === "store" ? "Daftarkan juga sebagai UMKM" : "Daftarkan juga sebagai pemilik toko"}
            </Link>
          )}
        </div>
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        {roles.includes("store") && (
          <Section
            title="Profil toko"
            action={
              <Link href="/profil/toko" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Ubah
              </Link>
            }
          >
            <div className="flex gap-4">
              <Thumb kind="store" size="lg" />
              <div className="flex min-w-0 flex-col gap-1 text-sm">
                <p className="font-medium">{MY_STORE.name}</p>
                <p className="text-muted-foreground">{MY_STORE.address}</p>
                <p>Buka {openDays} hari seminggu</p>
              </div>
            </div>
          </Section>
        )}
        {roles.includes("umkm") && (
          <Section
            title="Profil UMKM"
            action={
              <Link href="/profil/umkm" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Ubah
              </Link>
            }
          >
            <div className="flex gap-4">
              <Thumb kind="umkm" size="lg" />
              <div className="flex min-w-0 flex-col gap-2 text-sm">
                <p className="font-medium">{MY_UMKM.business_name}</p>
                <p className="text-muted-foreground">{MY_UMKM.address}</p>
                <LegalChips legal={MY_UMKM.legal} />
              </div>
            </div>
          </Section>
        )}
      </div>

      <Section title="Notifikasi email">
        <p className="flex items-center gap-3 text-sm">
          <IconMail className="size-4.5 text-muted-foreground" stroke={1.75} />
          Notifikasi email dikirim ke <span className="font-medium">{ME.email}</span>.
        </p>
      </Section>

      <Section title="Bantuan" contentClassName="-my-2">
        <nav className="flex flex-col">
          <HelpLink href="https://wa.me/6281200000000" icon={IconBrandWhatsapp}>
            Hubungi admin lewat WhatsApp
          </HelpLink>
          <HelpLink href="/#faq" icon={IconBook}>
            FAQ
          </HelpLink>
          <HelpLink href="/syarat-ketentuan" icon={IconFileText}>
            Syarat & Ketentuan
          </HelpLink>
          <HelpLink href="/kebijakan-privasi" icon={IconShieldLock}>
            Kebijakan Privasi
          </HelpLink>
        </nav>
      </Section>

      <div className="flex flex-col items-center gap-4 py-2">
        <Button variant="destructive" className="w-full sm:w-auto" onClick={() => setLogout(true)}>
          <IconLogout data-icon="inline-start" /> Keluar
        </Button>
        <p className="text-xs text-muted-foreground">Versi aplikasi {APP_VERSION}</p>
      </div>

      <ConfirmDialog
        open={logout}
        onOpenChange={setLogout}
        title="Keluar dari akun ini?"
        description="Anda perlu masuk lagi dengan Google untuk memakai aplikasi."
        confirmLabel="Ya, keluar"
        destructive
        onConfirm={() => router.push("/")}
      />
    </AppShell>
  )
}

function HelpLink({ href, icon: Ico, children }: { href: string; icon: Icon; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-4 border-b py-3.5 text-sm last:border-0 hover:bg-muted/40">
      <Ico className="size-4.5 text-muted-foreground" stroke={1.75} />
      <span className="flex-1">{children}</span>
      <IconChevronRight className="size-4 text-muted-foreground" />
    </Link>
  )
}
