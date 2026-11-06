import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { LegalVerification } from "./legal-verification"

export const metadata: Metadata = { title: "Verifikasi legalitas" }

export default function VerifikasiPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LegalVerification />
    </Suspense>
  )
}
