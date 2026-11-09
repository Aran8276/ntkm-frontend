import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { SettlementBill } from "./settlement-bill"

export const metadata: Metadata = { title: "Tagihan kerja sama" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function TagihanPage({ params }: PageProps<"/kerja-sama/[id]/tagihan">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <SettlementBill id={id} />
      ))}
    </Suspense>
  )
}
