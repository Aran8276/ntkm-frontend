import type { Metadata } from "next"

import { UmkmProfileForm } from "@/components/app/profile-forms"

export const metadata: Metadata = { title: "Ubah profil UMKM" }

export default function ProfilUmkmPage() {
  return <UmkmProfileForm mode="edit" />
}
