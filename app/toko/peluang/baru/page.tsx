import type { Metadata } from "next"

import { OpportunityFormPage } from "@/components/app/opportunity-form"

export const metadata: Metadata = { title: "Peluang baru" }

export default function PeluangBaruPage() {
  return <OpportunityFormPage />
}
