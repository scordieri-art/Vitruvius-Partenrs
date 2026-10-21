"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { ButtonBody } from "@/components/ui/Button";

/** Text field with a hairline, a real label and an error message linked to the input. */
export function Field({
  id,
  label,
  error,
  textarea,
  hint,
  ...rest
}: {
  id: string;
  label: string;
  error?: string;
  textarea?: boolean;
  hint?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement> &
  TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  const cls =
    "vp-input w-full border-0 border-b bg-transparent px-0 pb-3 pt-2 text-[var(--fg)] outline-none t-body-l transition-colors duration-200 placeholder:text-[var(--fg-2)] " +
    (error ? "border-[var(--fg)]" : "border-[var(--line)] focus:border-[var(--fg)]");
  return (
    <div className="vp-field">
      <label htmlFor={id} className="t-label block">
        {label}
        {rest.required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {textarea ? (
        <textarea id={id} rows={5} aria-invalid={!!error} aria-describedby={describedBy} className={`${cls} resize-y`} {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input id={id} aria-invalid={!!error} aria-describedby={describedBy} className={cls} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {hint ? (
        <p id={`${id}-hint`} className="t-label mt-2">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="t-small mt-2 text-[var(--fg)]">
          — {error}
        </p>
      ) : null}
    </div>
  );
}

export function Consent({ id, label, error, name = "consent" }: { id: string; label: ReactNode; error?: string; name?: string }) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-4">
        <input id={id} name={name} type="checkbox" required aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="vp-check mt-1 size-5 shrink-0 accent-[var(--color-navy)]" />
        <span className="t-small text-[var(--fg-2)]">{label}</span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="t-small mt-2">
          — {error}
        </p>
      ) : null}
    </div>
  );
}

export function Submit({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button type="submit" disabled={pending} className="vp-btn" aria-busy={pending}>
      <ButtonBody arrow={!pending}>{pending ? pendingLabel : label}</ButtonBody>
    </button>
  );
}

/** Off-screen honeypot field for bots. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
