import { Suspense } from "react"
import type { Metadata } from "next"

import { TableSkeleton } from "@/components/admin/data-table"
import { AdminAccess } from "./admin-access"

export const metadata: Metadata = { title: "Admin & akses" }

export default function AdminAccessPage() {
  return (
    <Suspense fallback={<div className="p-8"><TableSkeleton /></div>}>
      <AdminAccess />
    </Suspense>
  )
}
