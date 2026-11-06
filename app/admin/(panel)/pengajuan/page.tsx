import { Suspense } from "react"
import type { Metadata } from "next"

import { TableSkeleton } from "@/components/admin/data-table"
import { ApplicationsTable } from "./applications-table"

export const metadata: Metadata = { title: "Pengajuan" }

export default function PengajuanPage() {
  return (
    <Suspense fallback={<div className="p-8"><TableSkeleton /></div>}>
      <ApplicationsTable />
    </Suspense>
  )
}
