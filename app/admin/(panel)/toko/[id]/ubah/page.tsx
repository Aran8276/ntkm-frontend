import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { ADMIN_STORES, findStore } from "@/lib/admin-mock"
import { ProfileAdminForm } from "@/components/admin/profile-admin-form"

export const metadata: Metadata = { title: "Ubah profil toko" }

export function generateStaticParams() {
  return ADMIN_STORES.map((x) => ({ id: x.id }))
}

export default function EditProfilePage({ params }: PageProps<"/admin/toko/[id]/ubah">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<PageProps<"/admin/toko/[id]/ubah">, "params">) {
  const { id } = await params
  const profile = findStore(id)
  if (!profile) notFound()
  return <ProfileAdminForm kind="store" profile={profile} />
}
