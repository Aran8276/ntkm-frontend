import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { FEED_OPPORTUNITIES } from "@/lib/mock-data"
import { OpportunityApply } from "./opportunity-apply"

export const metadata: Metadata = { title: "Detail peluang" }

export function generateStaticParams() {
  return FEED_OPPORTUNITIES.map((o) => ({ id: String(o.id) }))
}

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function DetailPeluangUmkmPage({ params }: PageProps<"/umkm/peluang/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<PageProps<"/umkm/peluang/[id]">, "params">) {
  const { id } = await params
  const opportunity = FEED_OPPORTUNITIES.find((o) => String(o.id) === id)
  if (!opportunity) notFound()
  return <OpportunityApply id={opportunity.id} />
}
