import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { UserDetail } from "./user-detail"

export const metadata: Metadata = { title: "Detail pengguna" }

// `params` is runtime data under Cache Components, so read it inside <Suspense>.
export default function UserDetailPage({ params }: PageProps<"/admin/pengguna/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {params.then(({ id }) => (
        <UserDetail id={id} />
      ))}
    </Suspense>
  )
}
