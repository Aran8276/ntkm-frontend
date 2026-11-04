import { Suspense } from "react"
import type { Metadata } from "next"

import { AccessDenied } from "./access-denied"

export const metadata: Metadata = { title: "Akses tidak tersedia" }

export default function AksesTidakTersediaPage() {
  return (
    <Suspense>
      <AccessDenied />
    </Suspense>
  )
}
