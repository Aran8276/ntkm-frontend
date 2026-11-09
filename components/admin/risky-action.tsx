"use client"

import * as React from "react"
import Link from "next/link"
import { IconAlertTriangle, IconPoint } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormField } from "@/components/app/form-field"
import { CharCount } from "@/components/app/inputs"
import { handleApiError } from "@/components/app/feedback"
import { isApiError } from "@/lib/api"

export interface RiskyResult {
  reason: string
  notify: boolean
}

/**
 * "Modal aksi berisiko": question title, impact list, extra fields, reason
 * (admin_reason), notify-user checkbox and optional type-to-confirm.
 */
export function RiskyActionModal({
  open,
  onOpenChange,
  title,
  impacts = [],
  children,
  reason = "required",
  reasonPlaceholder = "Tulis alasan singkat untuk audit log.",
  notify,
  notifyLabel = "Beri tahu pengguna",
  confirmText,
  confirmLabel,
  destructive,
  canConfirm = true,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  impacts?: React.ReactNode[]
  children?: React.ReactNode
  reason?: "required" | "optional" | "none"
  reasonPlaceholder?: string
  /** Show the "Beri tahu" checkbox (default checked). */
  notify?: boolean
  notifyLabel?: string
  /** Hard delete: user must type this text to enable the button. */
  confirmText?: string
  confirmLabel: string
  destructive?: boolean
  /** Extra fields valid? */
  canConfirm?: boolean
  /** Runs the request; a rejected promise keeps the modal open (fields stay filled). */
  onConfirm: (result: RiskyResult) => void | Promise<void>
}) {
  const [error, setError] = React.useState<string | null>(null)
  const [text, setText] = React.useState("")
  const [notifyUser, setNotifyUser] = React.useState(true)
  const [typed, setTyped] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [wasOpen, setWasOpen] = React.useState(open)

  // Reset every time the modal opens.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setText("")
      setNotifyUser(true)
      setTyped("")
      setBusy(false)
      setError(null)
    }
  }

  const reasonOk = reason !== "required" || text.trim().length >= 5
  const valid = canConfirm && reasonOk && text.length <= 500 && (!confirmText || typed.trim() === confirmText)

  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    try {
      await onConfirm({ reason: text.trim(), notify: notify ? notifyUser : false })
      setBusy(false)
      onOpenChange(false)
    } catch (e) {
      setBusy(false)
      if (isApiError(e) && e.code === "validation_error") {
        const fields = e.fieldErrors()
        setError(fields.admin_reason ?? Object.values(fields)[0] ?? e.message)
        return
      }
      // 409 / 403 etc.: show the shared dialog or toast, close this modal.
      handleApiError(e, { admin: true })
      if (isApiError(e) && ["conflict", "has_active_relations", "not_found"].includes(e.code)) onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <DialogHeader>
            <DialogTitle className="pr-10 leading-snug">{title}</DialogTitle>
            {impacts.length > 0 && (
              <DialogDescription render={<div />}>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {impacts.map((i, idx) => (
                    <li key={idx} className="flex gap-2 text-foreground/80">
                      <IconPoint className="mt-0.5 size-4 shrink-0 fill-current text-muted-foreground" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex flex-col gap-6">
            {error && <p className="bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
            {children}
            {reason !== "none" && (
              <FormField
                label={reason === "required" ? "Alasan" : "Alasan (opsional)"}
                htmlFor="admin-reason"
                required={reason === "required"}
                description={reason === "required" ? "Minimal 5 karakter. Tercatat di audit log." : "Tercatat di audit log."}
                aside={<CharCount value={text} max={500} />}
              >
                <Textarea
                  id="admin-reason"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={reasonPlaceholder}
                  className="min-h-20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      void submit()
                    }
                  }}
                />
              </FormField>
            )}
            {confirmText && (
              <FormField
                label={
                  <>
                    Ketik <code className="bg-muted px-1 font-mono normal-case">{confirmText}</code> untuk konfirmasi
                  </>
                }
                htmlFor="confirm-text"
                required
              >
                <Input id="confirm-text" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
              </FormField>
            )}
            {notify && (
              <Label className="flex items-center gap-3 normal-case">
                <Checkbox checked={notifyUser} onCheckedChange={(v) => setNotifyUser(!!v)} />
                <span className="text-sm font-normal tracking-normal">{notifyLabel}</span>
              </Label>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Batal
            </Button>
            <Button
              type="submit"
              data-save
              disabled={!valid || busy}
              className={destructive ? "bg-destructive text-white hover:bg-destructive/85" : undefined}
            >
              {busy && <Spinner data-icon="inline-start" />}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** 409 has_active_relations / conflict modal. */
export function ConflictModal({
  open,
  onOpenChange,
  message,
  links = [],
  allowed,
  onReload,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: React.ReactNode
  links?: { label: string; href: string }[]
  allowed?: string[]
  onReload?: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-2 flex size-10 items-center justify-center bg-warning/15 text-[color-mix(in_oklch,var(--warning),var(--foreground)_35%)]">
            <IconAlertTriangle className="size-5" />
          </span>
          <DialogTitle>Tidak bisa dilanjutkan</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        {links.length > 0 && (
          <ul className="flex flex-col divide-y border-y">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex items-center justify-between py-2.5 text-sm text-primary hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {allowed && allowed.length > 0 && (
          <p className="text-sm text-muted-foreground">Pilihan yang diizinkan: {allowed.join(", ")}.</p>
        )}
        <DialogFooter>
          {onReload && (
            <Button variant="outline" onClick={onReload}>
              Muat ulang
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Mengerti</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
