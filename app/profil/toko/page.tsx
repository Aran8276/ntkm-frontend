import type { Metadata } from "next"

import { StoreProfileForm } from "@/components/app/profile-forms"

export const metadata: Metadata = { title: "Ubah profil toko" }

export default function ProfilTokoPage() {
  return <StoreProfileForm mode="edit" />
}
