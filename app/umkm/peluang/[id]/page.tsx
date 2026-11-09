import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { OpportunityApply } from "./opportunity-apply"

export const metadata: Metadata = { title: "Detail peluang" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function DetailPeluangUmkmPage({ params }: PageProps<"/umkm/peluang/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <OpportunityApply id={id} />
      ))}
    </Suspense>
  )
}
