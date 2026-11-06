import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { OpportunityAdminForm } from "@/components/admin/opportunity-admin-form"

export const metadata: Metadata = { title: "Peluang baru" }

export default function NewPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OpportunityAdminForm />
    </Suspense>
  )
}
