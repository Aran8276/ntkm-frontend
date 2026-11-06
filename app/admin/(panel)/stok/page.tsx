import { Suspense } from "react"
import type { Metadata } from "next"

import { TableSkeleton } from "@/components/admin/data-table"
import { StockTable } from "./stock-table"

export const metadata: Metadata = { title: "Stok" }

export default function StokPage() {
  return (
    <Suspense fallback={<div className="p-8"><TableSkeleton /></div>}>
      <StockTable />
    </Suspense>
  )
}
