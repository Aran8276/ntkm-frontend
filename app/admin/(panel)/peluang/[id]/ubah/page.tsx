import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { ADMIN_OPPORTUNITIES, findOpportunity } from "@/lib/admin-mock"
import { OpportunityAdminForm } from "@/components/admin/opportunity-admin-form"

export const metadata: Metadata = { title: "Ubah peluang" }

export function generateStaticParams() {
  return ADMIN_OPPORTUNITIES.map((x) => ({ id: x.id }))
}

export default function EditPage({ params }: PageProps<"/admin/peluang/[id]/ubah">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<PageProps<"/admin/peluang/[id]/ubah">, "params">) {
  const { id } = await params
  const item = findOpportunity(id)
  if (!item) notFound()
  return <OpportunityAdminForm opportunity={item} />
}
