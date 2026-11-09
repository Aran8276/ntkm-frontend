import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { ProductDetail } from "./product-detail"

export const metadata: Metadata = { title: "Detail produk" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function ProductDetailPage({ params }: PageProps<"/admin/produk/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <ProductDetail id={id} />
      ))}
    </Suspense>
  )
}
