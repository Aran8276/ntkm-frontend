import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { OpportunityAdminFormPage } from "@/components/admin/opportunity-admin-form"

export const metadata: Metadata = { title: "Peluang baru" }

export default function NewPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OpportunityAdminFormPage />
    </Suspense>
  )
}
