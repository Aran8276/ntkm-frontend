import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { ProfileAdminFormPage } from "@/components/admin/profile-admin-form"

export const metadata: Metadata = { title: "Profil UMKM baru" }

export default function NewProfilePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProfileAdminFormPage kind="umkm" />
    </Suspense>
  )
}
