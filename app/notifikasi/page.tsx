import type { Metadata } from "next"

import { NotificationList } from "./notification-list"

export const metadata: Metadata = { title: "Notifikasi" }

export default function NotifikasiPage() {
  return <NotificationList />
}
