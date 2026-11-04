import { Suspense } from "react"
import type { Metadata } from "next"

import { ProductForm } from "@/components/app/product-form"

export const metadata: Metadata = { title: "Produk baru" }

export default function ProdukBaruPage() {
  return (
    <Suspense>
      <ProductForm />
    </Suspense>
  )
}
