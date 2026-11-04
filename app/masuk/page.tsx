import { Suspense } from "react"
import type { Metadata } from "next"

import { LoginCard } from "./login-card"

export const metadata: Metadata = { title: "Masuk" }

export default function MasukPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted px-4 py-12">
      <Suspense fallback={<div className="h-[28rem] w-full max-w-md bg-background shadow-sm" />}>
        <LoginCard />
      </Suspense>
    </div>
  )
}
