import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { MY_OPPORTUNITIES } from "@/lib/mock-data"
import { OpportunityForm } from "@/components/app/opportunity-form"

export const metadata: Metadata = { title: "Ubah peluang" }

export function generateStaticParams() {
  return MY_OPPORTUNITIES.filter((o) => o.status !== "closed").map((o) => ({ id: String(o.id) }))
}

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function UbahPeluangPage({ params }: PageProps<"/toko/peluang/[id]/ubah">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<PageProps<"/toko/peluang/[id]/ubah">, "params">) {
  const { id } = await params
  const opportunity = MY_OPPORTUNITIES.find((o) => String(o.id) === id)
  // Closed opportunities cannot be edited.
  if (!opportunity || opportunity.status === "closed") notFound()
  return <OpportunityForm opportunity={opportunity} />
}
