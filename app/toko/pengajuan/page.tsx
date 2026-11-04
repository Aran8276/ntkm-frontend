import { Suspense } from "react"
import type { Metadata } from "next"

import { ListSkeleton } from "@/components/app/blocks"
import { StoreInbox } from "./store-inbox"

export const metadata: Metadata = { title: "Pengajuan" }

export default function PengajuanTokoPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-muted p-6"><ListSkeleton /></div>}>
      <StoreInbox />
    </Suspense>
  )
}
