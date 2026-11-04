import type { Metadata } from "next"

import { ProfileOverview } from "./profile-overview"

export const metadata: Metadata = { title: "Profil" }

export default function ProfilPage() {
  return <ProfileOverview />
}
