import { Suspense } from "react"
import type { Metadata } from "next"

import { ListSkeleton } from "@/components/app/blocks"
import { StockList } from "@/components/app/stock-list"

export const metadata: Metadata = { title: "Stok di rak" }

export default function StokTokoPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-muted p-6"><ListSkeleton /></div>}>
      <StockList viewer="store" />
    </Suspense>
  )
}
