import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { NotificationsAdmin } from "./notifications-admin"

export const metadata: Metadata = { title: "Notifikasi & pengumuman" }

export default function NotifikasiAdminPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NotificationsAdmin />
    </Suspense>
  )
}
