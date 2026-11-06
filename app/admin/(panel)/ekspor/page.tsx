import type { Metadata } from "next"

import { ExportCards } from "./export-cards"

export const metadata: Metadata = { title: "Ekspor" }

export default function EksporPage() {
  return <ExportCards />
}
