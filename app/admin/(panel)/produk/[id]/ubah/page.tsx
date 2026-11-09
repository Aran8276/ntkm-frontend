import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { ProductAdminFormPage } from "@/components/admin/product-admin-form"

export const metadata: Metadata = { title: "Ubah produk" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function EditPage({ params }: PageProps<"/admin/produk/[id]/ubah">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <ProductAdminFormPage id={id} />
      ))}
    </Suspense>
  )
}
