"use client"

import { AdminServerError } from "@/components/admin/admin-system"

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminServerError onRetry={reset} />
}
