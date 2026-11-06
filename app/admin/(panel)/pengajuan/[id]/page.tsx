import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { ADMIN_APPLICATIONS, findApplication } from "@/lib/admin-mock"
import { ApplicationAdminDetail } from "./application-admin-detail"

export const metadata: Metadata = { title: "Detail pengajuan" }

export function generateStaticParams() {
  return ADMIN_APPLICATIONS.map((a) => ({ id: a.id }))
}

export default function ApplicationDetailPage({ params }: PageProps<"/admin/pengajuan/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<PageProps<"/admin/pengajuan/[id]">, "params">) {
  const { id } = await params
  if (!findApplication(id)) notFound()
  return <ApplicationAdminDetail id={id} />
}
