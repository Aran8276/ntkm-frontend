import Link from "next/link"

import { cn } from "@/lib/utils"

export const APP_NAME = "Rak Lokal"

export function Logo({ className, href = "/" }: { className?: string; href?: string | null }) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid size-8 grid-cols-2 gap-0.5 bg-primary p-1.5" aria-hidden>
        <span className="bg-primary-foreground" />
        <span className="bg-primary-foreground/50" />
        <span className="bg-primary-foreground/50" />
        <span className="bg-primary-foreground" />
      </span>
      <span className="text-sm font-semibold tracking-[0.2em] uppercase">{APP_NAME}</span>
    </span>
  )
  if (!href) return content
  return (
    <Link href={href} className="outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
      {content}
    </Link>
  )
}
