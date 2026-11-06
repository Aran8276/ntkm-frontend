import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { ProductAdminForm } from "@/components/admin/product-admin-form"

export const metadata: Metadata = { title: "Produk baru" }

export default function NewPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProductAdminForm />
    </Suspense>
  )
}
