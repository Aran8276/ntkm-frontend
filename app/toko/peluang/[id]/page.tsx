import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { MY_OPPORTUNITIES } from "@/lib/mock-data"
import { OpportunityDetail } from "./opportunity-detail"

export const metadata: Metadata = { title: "Detail peluang" }

export function generateStaticParams() {
  return MY_OPPORTUNITIES.map((o) => ({ id: String(o.id) }))
}

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function DetailPeluangTokoPage({ params }: PageProps<"/toko/peluang/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<PageProps<"/toko/peluang/[id]">, "params">) {
  const { id } = await params
  const opportunity = MY_OPPORTUNITIES.find((o) => String(o.id) === id)
  if (!opportunity) notFound()
  return <OpportunityDetail id={opportunity.id} />
}
