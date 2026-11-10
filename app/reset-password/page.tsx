import { Suspense } from "react"
import type { Metadata } from "next"

import { ResetCard } from "./reset-card"

export const metadata: Metadata = { title: "Atur ulang kata sandi", referrer: "no-referrer" }

/** Target of the emailed link: `/reset-password?uid=…&token=…`. */
export default function ResetPasswordPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted px-4 py-12">
      <Suspense fallback={<div className="h-[26rem] w-full max-w-md bg-background shadow-sm" />}>
        <ResetCard />
      </Suspense>
    </div>
  )
}
