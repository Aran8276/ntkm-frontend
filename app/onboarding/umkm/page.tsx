import type { Metadata } from "next"

import { UmkmProfileForm } from "@/components/app/profile-forms"

export const metadata: Metadata = { title: "Profil UMKM" }

export default function OnboardingUmkmPage() {
  return <UmkmProfileForm mode="onboarding" />
}
