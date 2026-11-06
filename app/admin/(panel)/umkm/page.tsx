import { Suspense } from "react"
import type { Metadata } from "next"

import { TableSkeleton } from "@/components/admin/data-table"
import { UmkmsTable } from "./umkms-table"

export const metadata: Metadata = { title: "UMKM" }

export default function UmkmPage() {
  return (
    <Suspense fallback={<div className="p-8"><TableSkeleton /></div>}>
      <UmkmsTable />
    </Suspense>
  )
}
