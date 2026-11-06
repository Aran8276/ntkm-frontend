import type { Metadata } from "next"

import { CategoriesManager } from "./categories-manager"

export const metadata: Metadata = { title: "Kategori" }

export default function KategoriPage() {
  return <CategoriesManager />
}
