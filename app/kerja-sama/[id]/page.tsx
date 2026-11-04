import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { applicationIds, getApplication } from "@/lib/mock-data"
import { ApplicationDetail } from "./application-detail"

export const metadata: Metadata = { title: "Detail kerja sama" }

export function generateStaticParams() {
  return applicationIds().map((id) => ({ id: String(id) }))
}

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function KerjaSamaPage({ params }: PageProps<"/kerja-sama/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<PageProps<"/kerja-sama/[id]">, "params">) {
  const { id } = await params
  const application = getApplication(Number(id))
  if (!application) notFound()
  return <ApplicationDetail id={application.id} />
}
