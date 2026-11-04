import { Suspense } from "react"
import type { Metadata } from "next"

import { ListSkeleton } from "@/components/app/blocks"
import { OpportunityFeed } from "./opportunity-feed"

export const metadata: Metadata = { title: "Cari peluang" }

export default function CariPeluangPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-muted p-6"><ListSkeleton /></div>}>
      <OpportunityFeed />
    </Suspense>
  )
}
