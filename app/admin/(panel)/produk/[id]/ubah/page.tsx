import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { ADMIN_PRODUCTS, findProduct } from "@/lib/admin-mock"
import { ProductAdminForm } from "@/components/admin/product-admin-form"

export const metadata: Metadata = { title: "Ubah produk" }

export function generateStaticParams() {
  return ADMIN_PRODUCTS.map((x) => ({ id: x.id }))
}

export default function EditPage({ params }: PageProps<"/admin/produk/[id]/ubah">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<PageProps<"/admin/produk/[id]/ubah">, "params">) {
  const { id } = await params
  const item = findProduct(id)
  if (!item) notFound()
  return <ProductAdminForm product={item} />
}
