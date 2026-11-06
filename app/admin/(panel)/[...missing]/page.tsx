import { notFound } from "next/navigation"

/** Unknown /admin/* routes render the admin 404 inside the panel shell. */
export default function AdminCatchAll() {
  notFound()
}
