"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { IconLock } from "@tabler/icons-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { SystemPage } from "@/components/app/system-page"
import { ROLE_HOME } from "@/components/app/app-shell"
import { useRole } from "@/components/app/providers"
import type { Role } from "@/lib/types"

export function AccessDenied() {
  const params = useSearchParams()
  const router = useRouter()
  const { roles, setRole } = useRole()
  const target: Role = params.get("untuk") === "umkm" ? "umkm" : "store"
  const canSwitch = roles.includes(target)

  return (
    <SystemPage
      icon={IconLock}
      code="403"
      title="Akses tidak tersedia"
      description={`Halaman ini khusus untuk ${target === "store" ? "pemilik toko" : "UMKM"}.`}
      actions={
        canSwitch ? (
          <Button
            onClick={() => {
              setRole(target)
              router.push(ROLE_HOME[target])
            }}
          >
            Ganti mode
          </Button>
        ) : (
          <Link href="/" className={buttonVariants()}>
            Kembali ke beranda
          </Link>
        )
      }
    />
  )
}
