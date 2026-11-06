import { Suspense } from "react"
import type { Metadata } from "next"

import { TableSkeleton } from "@/components/admin/data-table"
import { StoresTable } from "./stores-table"

export const metadata: Metadata = { title: "Toko" }

export default function TokoPage() {
  return (
    <Suspense fallback={<div className="p-8"><TableSkeleton /></div>}>
      <StoresTable />
    </Suspense>
  )
}
