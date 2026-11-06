import type { Metadata } from "next"

import { AdminShell } from "@/components/admin/admin-shell"

export const metadata: Metadata = {
  title: { default: "Panel Admin", template: "%s · Admin Rak Lokal" },
}

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>
}
