import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { EditProductForm } from "@/components/app/product-form"

export const metadata: Metadata = { title: "Ubah produk" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function UbahProdukPage({ params }: PageProps<"/umkm/produk/[id]/ubah">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <EditProductForm id={id} />
      ))}
    </Suspense>
  )
}
