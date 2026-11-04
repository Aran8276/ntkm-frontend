import { Suspense } from "react"
import type { Metadata } from "next"

import { ListSkeleton } from "@/components/app/blocks"
import { OpportunityList } from "./opportunity-list"

export const metadata: Metadata = { title: "Peluang saya" }

export default function PeluangSayaPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-muted p-6"><ListSkeleton /></div>}>
      <OpportunityList />
    </Suspense>
  )
}
