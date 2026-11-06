"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconAlertCircle } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog, Section } from "@/components/app/blocks"
import { FormField } from "@/components/app/form-field"
import { CharCount } from "@/components/app/inputs"

export interface FormSection {
  id: string
  title: string
}

/**
 * Long admin form (not a stepper): section navigation on the left, cards on
 * the right, sticky footer with cancel/submit and an unsaved-changes guard.
 */
export function AdminFormLayout({
  sections,
  children,
  submitLabel,
  saving,
  dirty,
  onSubmit,
  cancelHref,
  formError,
}: {
  sections: FormSection[]
  children: React.ReactNode
  submitLabel: string
  saving: boolean
  dirty: boolean
  onSubmit: () => void
  cancelHref: string
  formError?: string | null
}) {
  const router = useRouter()
  const [leave, setLeave] = React.useState(false)
  const [active, setActive] = React.useState(sections[0]?.id)

  // Highlight the section in view.
  React.useEffect(() => {
    const els = sections.map((s) => document.getElementById(`s-${s.id}`)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (top) setActive(top.target.id.slice(2))
      },
      { rootMargin: "-80px 0px -60% 0px" }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [sections])

  // Browser-level guard for unsaved changes.
  React.useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", h)
    return () => window.removeEventListener("beforeunload", h)
  }, [dirty])

  return (
    <>
      <div className="grid items-start gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,56rem)]">
        <nav aria-label="Bagian form" className="sticky top-24 hidden flex-col border-l lg:flex">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#s-${s.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(`s-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
              }}
              className={cn(
                "-ml-px border-l-2 px-4 py-2 text-xs font-semibold tracking-widest uppercase outline-none focus-visible:bg-background",
                active === s.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {s.title}
            </a>
          ))}
        </nav>
        <form
          noValidate
          className="flex min-w-0 flex-col gap-6 pb-24"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          {formError && (
            <Alert variant="destructive">
              <IconAlertCircle />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          {children}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur lg:left-[var(--admin-sidebar,0px)]">
            <div className="mx-auto flex max-w-[1440px] items-center justify-end gap-3 px-4 py-3 lg:px-8">
              {dirty && <span className="mr-auto text-xs text-muted-foreground">Ada perubahan yang belum disimpan.</span>}
              <Button type="button" variant="outline" disabled={saving} onClick={() => (dirty ? setLeave(true) : router.push(cancelHref))}>
                Batal
              </Button>
              <Button type="submit" data-save disabled={saving}>
                {saving && <Spinner data-icon="inline-start" />}
                {saving ? "Menyimpan…" : submitLabel}
              </Button>
            </div>
          </div>
        </form>
      </div>
      <ConfirmDialog
        open={leave}
        onOpenChange={setLeave}
        title="Tinggalkan halaman?"
        description="Perubahan belum disimpan."
        confirmLabel="Tinggalkan"
        destructive
        onConfirm={() => router.push(cancelHref)}
      />
    </>
  )
}

/** Card with anchor id for the section nav. */
export function FormSectionCard({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div id={`s-${id}`} className="scroll-mt-24">
      <Section title={title} description={description}>
        {children}
      </Section>
    </div>
  )
}

/** "Catatan admin" section: optional reason + notify checkbox. */
export function AdminNoteFields({
  reason,
  onReason,
  notify,
  onNotify,
  notifyLabel,
}: {
  reason: string
  onReason: (v: string) => void
  notify: boolean
  onNotify: (v: boolean) => void
  notifyLabel: string
}) {
  return (
    <div className="flex flex-col gap-6">
      <FormField label="Alasan perubahan (opsional)" htmlFor="admin-note" aside={<CharCount value={reason} max={500} />}>
        <Textarea id="admin-note" value={reason} onChange={(e) => onReason(e.target.value)} placeholder="Tercatat di audit log." />
      </FormField>
      <Label className="flex items-center gap-2.5 normal-case">
        <Checkbox checked={notify} onCheckedChange={(v) => onNotify(!!v)} />
        <span className="text-sm font-normal tracking-normal">{notifyLabel}</span>
      </Label>
    </div>
  )
}
