import * as React from "react"
import type { Icon } from "@tabler/icons-react"

import { Logo } from "@/components/app/logo"

/** P22 · system pages (404, access denied, offline, server error). */
export function SystemPage({
  icon: Ico,
  code,
  title,
  description,
  actions,
}: {
  icon: Icon
  code?: string
  title: string
  description?: string
  actions: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-1 flex-col bg-muted">
      <header className="flex h-16 items-center border-b bg-background px-4 lg:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="flex w-full max-w-md flex-col items-center gap-6 bg-background p-10 text-center shadow-sm ring-1 ring-foreground/5">
          <div className="relative">
            <span className="flex size-20 items-center justify-center bg-muted">
              <Ico className="size-9" stroke={1.25} />
            </span>
            {code && (
              <span className="absolute -right-3 -bottom-3 bg-foreground px-2 py-1 text-[0.625rem] font-semibold tracking-widest text-background">
                {code}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-lg leading-snug font-semibold tracking-wider uppercase">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">{actions}</div>
        </div>
      </main>
    </div>
  )
}
