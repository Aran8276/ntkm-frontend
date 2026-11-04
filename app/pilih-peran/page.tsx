import { Suspense } from "react"
import type { Metadata } from "next"

import { RolePicker } from "./role-picker"

export const metadata: Metadata = { title: "Pilih peran" }

export default function PilihPeranPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted px-4 py-12">
      <Suspense fallback={<div className="h-[32rem] w-full max-w-lg bg-background shadow-sm" />}>
        <RolePicker />
      </Suspense>
    </div>
  )
}
