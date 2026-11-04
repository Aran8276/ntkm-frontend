import { Suspense } from "react"
import type { Metadata } from "next"

import { ListSkeleton } from "@/components/app/blocks"
import { ProductList } from "./product-list"

export const metadata: Metadata = { title: "Produk saya" }

export default function ProdukSayaPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-muted p-6"><ListSkeleton /></div>}>
      <ProductList />
    </Suspense>
  )
}
