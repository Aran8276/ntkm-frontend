import { Suspense } from "react"
import type { Metadata } from "next"

import { TableSkeleton } from "@/components/admin/data-table"
import { UsersTable } from "./users-table"

export const metadata: Metadata = { title: "Pengguna" }

export default function PenggunaPage() {
  return (
    <Suspense fallback={<div className="p-8"><TableSkeleton /></div>}>
      <UsersTable />
    </Suspense>
  )
}
