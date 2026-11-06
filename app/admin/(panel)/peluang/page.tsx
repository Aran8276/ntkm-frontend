import { Suspense } from "react"
import type { Metadata } from "next"

import { TableSkeleton } from "@/components/admin/data-table"
import { OpportunitiesTable } from "./opportunities-table"

export const metadata: Metadata = { title: "Peluang" }

export default function PeluangPage() {
  return (
    <Suspense fallback={<div className="p-8"><TableSkeleton /></div>}>
      <OpportunitiesTable />
    </Suspense>
  )
}
