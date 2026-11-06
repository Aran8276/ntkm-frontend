import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { ADMIN_PRODUCTS, findProduct } from "@/lib/admin-mock"
import { ProductDetail } from "./product-detail"

export const metadata: Metadata = { title: "Detail produk" }

export function generateStaticParams() {
  return ADMIN_PRODUCTS.map((p) => ({ id: p.id }))
}

export default function ProductDetailPage({ params }: PageProps<"/admin/produk/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<PageProps<"/admin/produk/[id]">, "params">) {
  const { id } = await params
  if (!findProduct(id)) notFound()
  return <ProductDetail id={id} />
}
