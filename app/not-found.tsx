import Link from "next/link"
import { IconMapQuestion } from "@tabler/icons-react"

import { buttonVariants } from "@/components/ui/button"
import { SystemPage } from "@/components/app/system-page"

export default function NotFound() {
  return (
    <SystemPage
      icon={IconMapQuestion}
      code="404"
      title="Halaman atau data tidak ditemukan."
      description="Tautan mungkin sudah tidak berlaku atau data telah dihapus."
      actions={
        <Link href="/" className={buttonVariants()}>
          Kembali ke beranda
        </Link>
      }
    />
  )
}
