import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { ApplicationAdminDetail } from "./application-admin-detail"

export const metadata: Metadata = { title: "Detail pengajuan" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function ApplicationDetailPage({ params }: PageProps<"/admin/pengajuan/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <ApplicationAdminDetail id={id} />
      ))}
    </Suspense>
  )
}
