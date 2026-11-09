import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { OpportunityDetail } from "./opportunity-detail"

export const metadata: Metadata = { title: "Detail peluang" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function DetailPeluangTokoPage({ params }: PageProps<"/toko/peluang/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <OpportunityDetail id={id} />
      ))}
    </Suspense>
  )
}
