"use client"

import { IconWifiOff } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { SystemPage } from "@/components/app/system-page"

export function OfflineView() {
  return (
    <SystemPage
      icon={IconWifiOff}
      title="Anda sedang offline."
      description="Periksa koneksi internet Anda."
      actions={<Button onClick={() => window.location.reload()}>Coba lagi</Button>}
    />
  )
}
