import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { ADMIN_UMKMS, findUmkm } from "@/lib/admin-mock"

export function generateStaticParams() {
  return ADMIN_UMKMS.map((u) => ({ id: u.id }))
}

/** Shortcut: /admin/umkm/:id → owner's A04 "Profil UMKM" tab. */
export default function UmkmShortcut({ params }: PageProps<"/admin/umkm/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Go params={params} />
    </Suspense>
  )
}

async function Go({ params }: Pick<PageProps<"/admin/umkm/[id]">, "params">) {
  const { id } = await params
  const u = findUmkm(id)
  if (!u) notFound()
  redirect(`/admin/pengguna/${u.owner.id}?tab=umkm`)
  return null
}
