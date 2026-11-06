import { Suspense } from "react"
import type { Metadata } from "next"

import { TableSkeleton } from "@/components/admin/data-table"
import { AuditLogTable } from "./audit-log"

export const metadata: Metadata = { title: "Audit log" }

export default function AuditPage() {
  return (
    <Suspense fallback={<div className="p-8"><TableSkeleton /></div>}>
      <AuditLogTable />
    </Suspense>
  )
}
