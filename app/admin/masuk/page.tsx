import { Suspense } from "react"
import type { Metadata } from "next"

import { AdminLoginCard } from "./admin-login-card"

export const metadata: Metadata = { title: "Masuk admin" }

export default function AdminMasukPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted px-4 py-12">
      <Suspense fallback={<div className="h-[26rem] w-full max-w-md bg-background shadow-sm" />}>
        <AdminLoginCard />
      </Suspense>
    </div>
  )
}
