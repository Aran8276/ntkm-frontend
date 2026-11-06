import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { Dashboard } from "./dashboard"

export const metadata: Metadata = { title: "Dashboard" }

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Dashboard />
    </Suspense>
  )
}
