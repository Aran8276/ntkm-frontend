"use client"

import * as React from "react"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"

/** Label + control + help text + error, following the Sera underline-input look. */
export function FormField({
  label,
  htmlFor,
  description,
  error,
  required,
  aside,
  children,
}: {
  label: React.ReactNode
  htmlFor?: string
  description?: React.ReactNode
  error?: string
  required?: boolean
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Field data-invalid={error ? true : undefined} className="gap-2">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="text-destructive" aria-hidden>
              *
            </span>
          )}
        </FieldLabel>
        {aside}
      </div>
      {children}
      {description && !error && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
