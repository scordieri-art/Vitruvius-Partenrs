"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendContact, type FormState } from "@/lib/actions";
import { Consent, Field, Honeypot, Submit } from "./Fields";

type Labels = {
  failed: string;
  name: string;
  email: string;
  message: string;
  consent: string;
  submit: string;
  sending: string;
  success: string;
  error: string;
  required: string;
  invalidEmail: string;
};

export function ContactForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContact, { ok: false });
  const form = useRef<HTMLFormElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const msg = (k?: string) => (k === "email" ? labels.invalidEmail : k ? labels.required : undefined);

  useEffect(() => {
    if (state.ok) form.current?.reset();
    if (state.ok || state.errors || state.failed) status.current?.focus();
  }, [state]);

  return (
    <form ref={form} action={action} noValidate className="relative grid gap-10">
      <Honeypot />
      <div className="grid gap-10 sm:grid-cols-2">
        <Field id="c-name" name="name" label={labels.name} autoComplete="name" required error={msg(state.errors?.name)} />
        <Field id="c-email" name="email" type="email" label={labels.email} autoComplete="email" required error={msg(state.errors?.email)} />
      </div>
      <Field id="c-message" name="message" textarea label={labels.message} required error={msg(state.errors?.message)} />
      <Consent id="c-consent" label={labels.consent} error={msg(state.errors?.consent)} />
      <div className="flex flex-wrap items-center justify-between gap-6">
        <Submit pending={pending} label={labels.submit} pendingLabel={labels.sending} />
        <p ref={status} tabIndex={-1} role="status" aria-live="polite" className="t-small outline-none">
          {state.ok ? labels.success : state.failed ? labels.failed : state.errors ? labels.error : ""}
        </p>
      </div>
    </form>
  );
}
