import type { Metadata } from "next"

import { ForgotCard } from "./forgot-card"

export const metadata: Metadata = { title: "Lupa kata sandi" }

export default function LupaKataSandiPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted px-4 py-12">
      <ForgotCard />
    </div>
  )
}
