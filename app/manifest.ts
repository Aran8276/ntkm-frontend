import type { MetadataRoute } from "next"

/** Web app manifest: makes the user app installable ("Pasang di layar utama"). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NTKM — Solusi laris bagi peluang manis",
    short_name: "NTKM",
    description:
      "Toko membuka peluang, UMKM mengajukan produk. Jadwal antar, status kerja sama, sampai kabar stok habis tercatat rapi di satu aplikasi.",
    lang: "id",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#007595",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "Kerja sama", short_name: "Kerja sama", url: "/pilih-peran", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Notifikasi", short_name: "Notifikasi", url: "/notifikasi", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  }
}
