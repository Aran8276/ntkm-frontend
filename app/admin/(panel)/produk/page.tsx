import { Suspense } from "react"
import type { Metadata } from "next"

import { TableSkeleton } from "@/components/admin/data-table"
import { ProductsTable } from "./products-table"

export const metadata: Metadata = { title: "Produk" }

export default function ProdukPage() {
  return (
    <Suspense fallback={<div className="p-8"><TableSkeleton /></div>}>
      <ProductsTable />
    </Suspense>
  )
}
