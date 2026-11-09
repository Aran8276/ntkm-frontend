import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { OpportunityAdminFormPage } from "@/components/admin/opportunity-admin-form"

export const metadata: Metadata = { title: "Ubah peluang" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function EditPage({ params }: PageProps<"/admin/peluang/[id]/ubah">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <OpportunityAdminFormPage id={id} />
      ))}
    </Suspense>
  )
}
