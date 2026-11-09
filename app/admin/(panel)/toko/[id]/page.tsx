import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { ProfileShortcut } from "@/components/admin/profile-admin-form"

export const metadata: Metadata = { title: "Profil toko" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function StoreShortcut({ params }: PageProps<"/admin/toko/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <ProfileShortcut kind="store" id={id} />
      ))}
    </Suspense>
  )
}
