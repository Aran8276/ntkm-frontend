import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"

import { PageSkeleton } from "@/components/app/blocks"
import { ADMIN_STORES, findStore } from "@/lib/admin-mock"

export function generateStaticParams() {
  return ADMIN_STORES.map((s) => ({ id: s.id }))
}

/** Shortcut: /admin/toko/:id → owner's A04 "Profil toko" tab. */
export default function StoreShortcut({ params }: PageProps<"/admin/toko/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Go params={params} />
    </Suspense>
  )
}

async function Go({ params }: Pick<PageProps<"/admin/toko/[id]">, "params">) {
  const { id } = await params
  const s = findStore(id)
  if (!s) notFound()
  redirect(`/admin/pengguna/${s.owner.id}?tab=toko`)
  return null
}
