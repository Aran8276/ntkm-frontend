"use client"

import Link from "next/link"
import { IconServerOff } from "@tabler/icons-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { SystemPage } from "@/components/app/system-page"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <SystemPage
      icon={IconServerOff}
      code="500"
      title="Terjadi kesalahan di server."
      description="Coba beberapa saat lagi."
      actions={
        <>
          <Button onClick={() => reset()}>Coba lagi</Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Kembali ke beranda
          </Link>
        </>
      }
    />
  )
}
