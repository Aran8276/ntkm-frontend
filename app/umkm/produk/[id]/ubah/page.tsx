import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { MY_PRODUCTS } from "@/lib/mock-data"
import { ProductForm } from "@/components/app/product-form"

export const metadata: Metadata = { title: "Ubah produk" }

export function generateStaticParams() {
  return MY_PRODUCTS.map((p) => ({ id: String(p.id) }))
}

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function UbahProdukPage({ params }: PageProps<"/umkm/produk/[id]/ubah">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<PageProps<"/umkm/produk/[id]/ubah">, "params">) {
  const { id } = await params
  const product = MY_PRODUCTS.find((p) => String(p.id) === id)
  if (!product) notFound()
  return <ProductForm product={product} />
}
