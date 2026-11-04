"use client"

import * as React from "react"
import Link from "next/link"
import { IconMenu2 } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Logo } from "@/components/app/logo"

const MENU = [
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#untuk-toko", label: "Untuk Toko" },
  { href: "#untuk-umkm", label: "Untuk UMKM" },
  { href: "#faq", label: "FAQ" },
]

export function LandingHeader() {
  const [open, setOpen] = React.useState(false)
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 lg:px-8">
        <Logo />
        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Menu halaman">
          {MENU.map((m) => (
            <a
              key={m.href}
              href={m.href}
              className="px-3 py-2 text-[0.6875rem] font-semibold tracking-widest text-foreground/70 uppercase transition-colors hover:text-foreground"
            >
              {m.label}
            </a>
          ))}
        </nav>
        <Link href="/masuk" className={cn(buttonVariants({ size: "sm" }), "ml-auto md:ml-2")}>
          Masuk
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Buka menu" />}>
            <IconMenu2 className="size-5" />
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <nav className="mt-6 flex flex-col" aria-label="Menu halaman">
                {MENU.map((m) => (
                  <a
                    key={m.href}
                    href={m.href}
                    onClick={() => setOpen(false)}
                    className="border-b py-4 text-xs font-semibold tracking-widest uppercase"
                  >
                    {m.label}
                  </a>
                ))}
              </nav>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

const STEPS = {
  store: [
    { title: "Buat profil toko", body: "Isi data toko dan tandai lokasinya di peta." },
    { title: "Pasang peluang", body: "Tentukan kategori, syarat, kuota, komisi, dan jadwal terima barang." },
    { title: "Tinjau pengajuan", body: "Setujui per produk, sekaligus pilih slot antar dan harga jual." },
    { title: "Terima & perbarui stok", body: "Konfirmasi barang diterima. UMKM otomatis dikabari saat stok habis." },
  ],
  umkm: [
    { title: "Daftar & isi legalitas", body: "Lengkapi data usaha: NIB, PIRT, dan halal bila ada." },
    { title: "Unggah produk", body: "Lengkap dengan foto, harga setor, harga jual, dan masa simpan." },
    { title: "Temukan peluang", body: "Lihat toko terdekat yang membuka peluang, lengkap dengan badge kecocokan." },
    { title: "Ajukan & antar", body: "Antar sesuai jadwal, lalu pantau status dan stok langsung dari HP." },
  ],
}

/** "Cara kerja" with a Toko / UMKM toggle that follows #untuk-toko / #untuk-umkm. */
export function HowItWorks() {
  const [tab, setTab] = React.useState<"store" | "umkm">("store")

  React.useEffect(() => {
    const sync = () => {
      if (window.location.hash === "#untuk-umkm") setTab("umkm")
      if (window.location.hash === "#untuk-toko") setTab("store")
    }
    sync()
    window.addEventListener("hashchange", sync)
    return () => window.removeEventListener("hashchange", sync)
  }, [])

  return (
    <div className="relative flex flex-col gap-10">
      <span id="untuk-toko" className="absolute -top-24" aria-hidden />
      <span id="untuk-umkm" className="absolute -top-24" aria-hidden />
      <div className="inline-flex self-start bg-muted p-1" role="tablist" aria-label="Pilih peran">
        {(
          [
            ["store", "Untuk Toko"],
            ["umkm", "Untuk UMKM"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={tab === value}
            onClick={() => {
              setTab(value)
              history.replaceState(null, "", value === "store" ? "#untuk-toko" : "#untuk-umkm")
            }}
            className={cn(
              "h-10 px-6 text-xs font-semibold tracking-widest uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
              tab === value ? "bg-background text-foreground shadow-xs" : "text-foreground/60 hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <ol className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4" role="tabpanel">
        {STEPS[tab].map((s, i) => (
          <li key={s.title} className="flex flex-col gap-4 bg-background p-6 lg:p-8">
            <span className="text-4xl font-light text-primary tabular-nums">0{i + 1}</span>
            <h3 className="text-sm font-semibold tracking-widest uppercase">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

const FAQ = [
  {
    q: "Apakah berbayar?",
    a: "Tidak. Aplikasi gratis selama masa pilot, baik untuk toko maupun UMKM.",
  },
  {
    q: "Bagaimana komisi dihitung dan kapan dibayarkan?",
    a: "Komisi ditentukan toko di tiap peluang, berupa persentase dari harga jual atau nominal per unit terjual, dan terlihat sebelum Anda mengajukan. Jadwal pembayaran komisi sedang difinalkan bersama peserta pilot.",
  },
  {
    q: "Legalitas apa yang dibutuhkan UMKM?",
    a: "Tidak ada legalitas wajib untuk mendaftar. Namun banyak toko mensyaratkan NIB atau PIRT, dan sertifikat halal untuk kategori tertentu. Legalitas yang lengkap menaikkan badge kecocokan Anda.",
  },
  {
    q: "Siapa yang mengantar barang?",
    a: "UMKM mengantar sendiri ke toko sesuai slot jadwal yang dipilih toko saat menyetujui pengajuan.",
  },
  {
    q: "Bagaimana kalau produk tidak laku atau mendekati kedaluwarsa?",
    a: "Ketentuan untuk produk yang tidak laku atau mendekati kedaluwarsa sedang difinalkan bersama peserta pilot. Untuk saat ini, toko dan UMKM dapat menyelesaikan kerja sama kapan saja dari aplikasi.",
  },
  { q: "Bisa jadi toko dan UMKM sekaligus?", a: "Ya. Satu akun Google bisa memiliki dua peran dan berpindah mode kapan saja." },
  {
    q: "Perlu install aplikasi?",
    a: "Tidak. Buka di browser HP, lalu pilih \"Tambahkan ke layar utama\" agar terasa seperti aplikasi.",
  },
  {
    q: "Bagaimana data saya dijaga?",
    a: "Kami hanya menampilkan data yang dibutuhkan untuk kerja sama, seperti nama usaha, alamat, dan legalitas, kepada pihak yang terlibat. Detailnya ada di Kebijakan Privasi.",
  },
]

export function FaqAccordion() {
  return (
    <Accordion className="border-t">
      {FAQ.map((f) => (
        <AccordionItem key={f.q} value={f.q} className="border-b">
          <AccordionTrigger className="py-5 text-base font-medium hover:no-underline">{f.q}</AccordionTrigger>
          <AccordionContent className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
