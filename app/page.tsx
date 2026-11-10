import {
  IconAdjustmentsCheck,
  IconBellRinging,
  IconBrandInstagram,
  IconBrandWhatsapp,
  IconCalendarTime,
  IconChecks,
  IconChevronRight,
  IconMapPin,
  IconRosetteDiscountCheck,
  IconTimeline,
  type Icon,
} from "@tabler/icons-react";
import Link from "next/link";

import { APP_NAME, APP_SLOGAN, Logo } from "@/components/app/logo";
import {
  FaqAccordion,
  HowItWorks,
  LandingHeader,
} from "@/components/landing/landing-client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INSTAGRAM_URL, WHATSAPP_NUMBER, WHATSAPP_URL } from "@/lib/contact";

function CtaButtons({ placement }: { placement: string }) {
  return (
    <>
      <div className="md:flex flex-col hidden gap-3 sm:flex-row">
        <Link
          href="/daftar?role=store"
          data-cta={`${placement}-store`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full sm:w-auto flex items-center px-6",
          )}
        >
          Toko Ritel
          <IconChevronRight />
        </Link>
        <Link
          href="/daftar?role=umkm"
          data-cta={`${placement}-umkm`}
          className={cn(
            buttonVariants({ size: "lg", variant: "outline" }),
            "w-full bg-background sm:w-auto",
          )}
        >
          UMKM
        </Link>
      </div>
      <div className="flex flex-col md:hidden gap-3 sm:flex-row">
        <Link
          href="/daftar?role=umkm"
          data-cta={`${placement}-umkm`}
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full sm:w-auto flex items-center px-6",
          )}
        >
          Bagi UMKM
          <IconChevronRight />
        </Link>
        <Link
          href="/daftar?role=store"
          data-cta={`${placement}-store`}
          className={cn(
            buttonVariants({ size: "lg", variant: "outline" }),
            "w-full bg-background sm:w-auto",
          )}
        >
          Bagi Toko Ritel
        </Link>
      </div>
    </>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <p className="text-[14px] font-semibold tracking-[0.2em] text-primary uppercase">
        {eyebrow}
      </p>
      <h2 className="text-2xl leading-tight font-semibold tracking-wider uppercase sm:text-3xl">
        {title}
      </h2>
      {description && (
        <p className="text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

function PhoneMockup() {
  const cards = [
    {
      store: "Minimarket Berkah Jaya",
      km: "1,8 km",
      title: "Camilan pedas untuk rak depan",
      match: "Sangat cocok · 85",
      tone: "text-success bg-success/10",
      quota: "Sisa 2 dari 3 UMKM",
    },
    {
      store: "Toko Kelontong Bu Sri",
      km: "3,6 km",
      title: "Oleh-oleh khas Malang",
      match: "Cocok · 64",
      tone: "bg-warning/15 text-[color-mix(in_oklch,var(--warning),var(--foreground)_35%)]",
      quota: "Sisa 2 dari 5 UMKM",
    },
    {
      store: "Swalayan Sinar Mas",
      km: "4,7 km",
      title: "Kue kering untuk rak premium",
      match: "Sangat cocok · 78",
      tone: "text-success bg-success/10",
      quota: "Sisa 2 dari 2 UMKM",
    },
  ];
  return (
    <div className="relative mx-auto w-full max-w-[19rem]" aria-hidden>
      <div className="absolute -inset-6 -z-10 bg-primary/10" />
      <div className="overflow-hidden rounded-[2.25rem] border-[10px] border-foreground bg-muted shadow-2xl">
        <div className="flex items-center justify-between bg-background px-4 pt-3 pb-3">
          <span className="text-[0.625rem] font-semibold tracking-widest uppercase">
            Cari peluang
          </span>
          <span className="border px-1.5 py-0.5 text-[0.5rem] font-semibold tracking-widest uppercase">
            Mode UMKM
          </span>
        </div>
        <div className="flex gap-1.5 overflow-hidden bg-background px-4 pb-3">
          {["5 km", "Camilan", "Paling cocok"].map((c, i) => (
            <span
              key={c}
              className={cn(
                "shrink-0 border px-2 py-1 text-[0.5rem] font-semibold tracking-widest uppercase",
                i === 0 && "border-foreground/20",
              )}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-2 p-3">
          <p className="px-1 text-[0.5625rem] text-muted-foreground">
            4 peluang ditemukan
          </p>
          {cards.map((c) => (
            <div
              key={c.title}
              className="flex flex-col gap-2 bg-background p-3 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="size-6 bg-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.625rem] font-medium">
                    {c.store}
                  </p>
                  <p className="text-[0.5rem] text-muted-foreground">{c.km}</p>
                </div>
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-[0.4375rem] font-semibold tracking-widest uppercase",
                    c.tone,
                  )}
                >
                  {c.match}
                </span>
              </div>
              <p className="text-[0.6875rem] leading-tight font-semibold">
                {c.title}
              </p>
              <div className="flex justify-between text-[0.5rem] text-muted-foreground">
                <span>Komisi 15%</span>
                <span>{c.quota}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 border-t bg-background py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "mx-auto size-3",
                i === 1 ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const PROBLEMS = {
  store: [
    "Susah menemukan pemasok lokal yang legalitasnya jelas.",
    "Catatan titip jual masih di buku.",
    "Tidak tahu UMKM mana yang dekat dan bisa antar rutin.",
  ],
  umkm: [
    "Sulit menembus rak toko ritel.",
    "Tidak tahu syarat tiap toko.",
    "Baru sadar stok habis saat datang ke toko.",
  ],
};

const FEATURES: { icon: Icon; title: string; body: string }[] = [
  {
    icon: IconMapPin,
    title: "Peluang terdekat",
    body: "Filter berdasarkan jarak dan kategori produk.",
  },
  {
    icon: IconRosetteDiscountCheck,
    title: "Badge kecocokan",
    body: "Lihat seberapa cocok produk Anda dengan syarat toko, beserta alasannya.",
  },
  {
    icon: IconAdjustmentsCheck,
    title: "Persetujuan per produk",
    body: "Toko menyetujui atau menolak tiap produk, lengkap dengan harga jual.",
  },
  {
    icon: IconCalendarTime,
    title: "Jadwal antar terstruktur",
    body: "Slot antar dipilih dari jadwal terima barang toko.",
  },
  {
    icon: IconTimeline,
    title: "Timeline kerja sama",
    body: "Setiap perubahan status tercatat: siapa, kapan, dan catatannya.",
  },
  {
    icon: IconBellRinging,
    title: "Notifikasi stok habis",
    body: "UMKM dikabari lewat aplikasi dan email saat produknya habis di rak.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <LandingHeader />

      <main className="flex flex-col">
        {/* Hero */}
        <section className="border-b bg-muted/60">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 lg:grid-cols-[1.2fr_1fr] lg:px-8 lg:py-24">
            <div className="flex flex-col md:gap-8 gap-5">
              <p className="text-[16px] font-semibold tracking-[0.2em] text-primary uppercase">
                {APP_SLOGAN}
              </p>
              <h1 className="text-3xl leading-[1.15] font-semibold tracking-wide uppercase sm:text-5xl">
                Produk UMKM ke rak toko terdekat
              </h1>
              <p className="max-w-xl text-lg md:hidden block leading-relaxed text-muted-foreground">
                Toko buka peluang, UMKM dapat kesempatan. Pencatatan modern
                digital.
              </p>
              <p className="max-w-xl text-lg md:block hidden leading-relaxed text-muted-foreground">
                Toko buka peluang, UMKM dapat kesempatan. Jadwal dan informasi
                produk tercatat rapi pada satu aplikasi.
              </p>
              <CtaButtons placement="hero" />
              <p className="text-sm text-muted-foreground">
                Gratis. Cukup daftar dengan email.
              </p>
            </div>
            <PhoneMockup />
          </div>
        </section>

        {/* Problems */}
        <section className="mx-auto w-full max-w-6xl px-4 py-20 lg:px-8">
          <SectionTitle
            eyebrow="Masalah yang kami selesaikan"
            title="Titip jual tidak harus serumit itu"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {(
              [
                ["Untuk toko", PROBLEMS.store],
                ["Untuk UMKM", PROBLEMS.umkm],
              ] as const
            ).map(([label, items]) => (
              <div key={label} className="flex flex-col gap-6 bg-muted/60 p-8">
                <h3 className="text-sm font-semibold tracking-widest uppercase">
                  {label}
                </h3>
                <ul className="flex flex-col gap-4">
                  {items.map((t) => (
                    <li
                      key={t}
                      className="flex gap-3 text-base leading-relaxed"
                    >
                      <span className="mt-2.5 h-px w-4 shrink-0 bg-foreground/40" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="cara-kerja" className="scroll-mt-16 border-y bg-muted/60">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 lg:px-8">
            <SectionTitle
              eyebrow="Cara kerja"
              title="Empat langkah, dari rak kosong sampai stok terpantau"
            />
            <HowItWorks />
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-4 py-20 lg:px-8">
          <SectionTitle
            eyebrow="Fitur utama"
            title="Semua yang dibutuhkan untuk titip jual"
          />
          <div className="mt-12 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-4 bg-background p-8"
              >
                <span className="flex size-10 items-center justify-center bg-muted">
                  <f.icon className="size-5" stroke={1.75} />
                </span>
                <h3 className="text-sm font-semibold tracking-widest uppercase">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Commission */}
        <section className="border-y bg-muted/60">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:px-8">
            <SectionTitle
              eyebrow="Komisi transparan"
              title="Hitungannya terlihat sebelum Anda mengajukan"
              description="Skema komisi ditentukan toko di tiap peluang dan terlihat sebelum Anda mengajukan."
            />
            <div className="flex flex-col gap-6 bg-background p-8 shadow-sm ring-1 ring-foreground/5">
              <div className="flex items-baseline justify-between border-b pb-6">
                <span className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
                  Harga jual
                </span>
                <span className="text-3xl font-medium tabular-nums">
                  Rp12.500
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">
                  Komisi toko 15%
                </span>
                <span className="text-lg tabular-nums">− Rp1.875</span>
              </div>
              <div className="flex items-baseline justify-between bg-primary/5 p-4">
                <span className="text-xs font-semibold tracking-widest uppercase">
                  UMKM menerima
                </span>
                <span className="text-2xl font-medium text-primary tabular-nums">
                  Rp10.625
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Per unit terjual.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="mx-auto grid w-full max-w-6xl scroll-mt-16 gap-10 px-4 py-20 lg:grid-cols-[1fr_2fr] lg:px-8"
        >
          <SectionTitle eyebrow="FAQ" title="Pertanyaan yang sering diajukan" />
          <FaqAccordion />
        </section>

        {/* Closing CTA */}
        <section className="bg-foreground text-background">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-20 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex flex-col gap-3">
              <h2 className="text-3xl font-semibold tracking-wider uppercase">
                Siap mulai?
              </h2>
              <p className="text-background/70">
                Gratis selama masa pilot. Cukup daftar dengan email.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                href="/daftar?role=store"
                data-cta="closing-store"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full sm:w-auto",
                )}
              >
                Saya pemilik toko
              </Link>
              <Link
                href="/daftar?role=umkm"
                data-cta="closing-umkm"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "w-full border-background/30 text-background hover:bg-background/10 hover:text-background sm:w-auto",
                )}
              >
                Saya pelaku UMKM
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] lg:px-8">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="text-sm font-medium">{APP_SLOGAN}.</p>
            <p className="text-sm text-muted-foreground">
              Menghubungkan UMKM lokal dengan rak toko ritel terdekat.
            </p>
          </div>
          <FooterCol title="Kontak">
            <FooterLink href={WHATSAPP_URL} icon={IconBrandWhatsapp}>
              WhatsApp {WHATSAPP_NUMBER}
            </FooterLink>
            <FooterLink href={INSTAGRAM_URL} icon={IconBrandInstagram}>
              Instagram @project.ntkm
            </FooterLink>
          </FooterCol>
          <FooterCol title="Legal">
            <FooterLink href="/kebijakan-privasi">Kebijakan Privasi</FooterLink>
            <FooterLink href="/syarat-ketentuan">Syarat & Ketentuan</FooterLink>
          </FooterCol>
        </div>
        <div className="border-t">
          <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-6 text-xs text-muted-foreground lg:px-8">
            <IconChecks className="size-3.5" />© 2026 {APP_NAME}
          </p>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.6875rem] font-semibold tracking-widest text-muted-foreground uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

function FooterLink({
  href,
  icon: Ico,
  children,
}: {
  href: string;
  icon?: Icon;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center gap-2 text-sm hover:underline"
    >
      {Ico && <Ico className="size-4" stroke={1.75} />}
      {children}
    </a>
  );
}
