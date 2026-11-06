import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { ADMIN_UMKMS, findUmkm } from "@/lib/admin-mock"
import { ProfileAdminForm } from "@/components/admin/profile-admin-form"

export const metadata: Metadata = { title: "Ubah profil UMKM" }

export function generateStaticParams() {
  return ADMIN_UMKMS.map((x) => ({ id: x.id }))
}

export default function EditProfilePage({ params }: PageProps<"/admin/umkm/[id]/ubah">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content params={params} />
    </Suspense>
  )
}

async function Content({ params }: Pick<PageProps<"/admin/umkm/[id]/ubah">, "params">) {
  const { id } = await params
  const profile = findUmkm(id)
  if (!profile) notFound()
  return <ProfileAdminForm kind="umkm" profile={profile} />
}
