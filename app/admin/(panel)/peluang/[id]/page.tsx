import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { ADMIN_OPPORTUNITIES, findOpportunity } from "@/lib/admin-mock"
import { OpportunityDetail } from "./opportunity-detail"

export const metadata: Metadata = { title: "Detail peluang" }

export function generateStaticParams() {
  return ADMIN_OPPORTUNITIES.map((o) => ({ id: o.id }))
}

export default function OpportunityDetailPage({ params }: PageProps<"/admin/peluang/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<PageProps<"/admin/peluang/[id]">, "params">) {
  const { id } = await params
  if (!findOpportunity(id)) notFound()
  return <OpportunityDetail id={id} />
}
