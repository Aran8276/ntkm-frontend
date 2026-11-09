import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { OpportunityFormPage } from "@/components/app/opportunity-form"

export const metadata: Metadata = { title: "Ubah peluang" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function UbahPeluangPage({ params }: PageProps<"/toko/peluang/[id]/ubah">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <OpportunityFormPage id={id} />
      ))}
    </Suspense>
  )
}
