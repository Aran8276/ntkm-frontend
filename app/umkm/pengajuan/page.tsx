import { Suspense } from "react"
import type { Metadata } from "next"

import { ListSkeleton } from "@/components/app/blocks"
import { UmkmInbox } from "./umkm-inbox"

export const metadata: Metadata = { title: "Pengajuan saya" }

export default function PengajuanUmkmPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-muted p-6"><ListSkeleton /></div>}>
      <UmkmInbox />
    </Suspense>
  )
}
