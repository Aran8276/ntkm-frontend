import { Suspense } from "react"
import type { Metadata } from "next"

import { PageSkeleton } from "@/components/app/blocks"
import { FilesBrowser } from "./files-browser"

export const metadata: Metadata = { title: "File" }

export default function FilePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <FilesBrowser />
    </Suspense>
  )
}
