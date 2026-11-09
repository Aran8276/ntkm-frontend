import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { ProfileAdminFormPage } from "@/components/admin/profile-admin-form"

export const metadata: Metadata = { title: "Ubah profil toko" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function EditProfilePage({ params }: PageProps<"/admin/toko/[id]/ubah">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <ProfileAdminFormPage kind="store" id={id} />
      ))}
    </Suspense>
  )
}
