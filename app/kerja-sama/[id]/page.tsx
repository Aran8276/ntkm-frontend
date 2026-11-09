import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { ApplicationDetail } from "./application-detail"

export const metadata: Metadata = { title: "Detail kerja sama" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function KerjaSamaPage({ params }: PageProps<"/kerja-sama/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <ApplicationDetail id={id} />
      ))}
    </Suspense>
  )
}
