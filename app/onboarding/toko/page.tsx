import type { Metadata } from "next"

import { StoreProfileForm } from "@/components/app/profile-forms"

export const metadata: Metadata = { title: "Profil toko" }

export default function OnboardingTokoPage() {
  return <StoreProfileForm mode="onboarding" />
}
