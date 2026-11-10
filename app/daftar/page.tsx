import { Suspense } from "react"
import type { Metadata } from "next"

import { RegisterCard } from "./register-card"

export const metadata: Metadata = { title: "Daftar" }

export default function DaftarPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted px-4 py-12">
      <Suspense fallback={<div className="h-[36rem] w-full max-w-md bg-background shadow-sm" />}>
        <RegisterCard />
      </Suspense>
    </div>
  )
}
