import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { ProfileShortcut } from "@/components/admin/profile-admin-form"

export const metadata: Metadata = { title: "Profil UMKM" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function UmkmShortcut({ params }: PageProps<"/admin/umkm/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <ProfileShortcut kind="umkm" id={id} />
      ))}
    </Suspense>
  )
}
