import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { ADMIN_USERS, findUser } from "@/lib/admin-mock"
import { UserDetail } from "./user-detail"

export const metadata: Metadata = { title: "Detail pengguna" }

export function generateStaticParams() {
  return ADMIN_USERS.map((u) => ({ id: u.id }))
}

export default function UserDetailPage({ params }: PageProps<"/admin/pengguna/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<PageProps<"/admin/pengguna/[id]">, "params">) {
  const { id } = await params
  if (!findUser(id)) notFound()
  return <UserDetail id={id} />
}
