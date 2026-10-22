"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendApplication, type FormState } from "@/lib/actions";
import { Consent, Field, Honeypot, MailFallback, Submit, useSubmitKeepingValues } from "./Fields";
import { company } from "@/content/site";

type Labels = {
  failed: string;
  mailFallback: string;
  mailSubject: string;
  mailNote: string;
  title: string;
  name: string;
  birth: string;
  phone: string;
  email: string;
  address: string;
  cv: string;
  cvChoose: string;
  noFile: string;
  cvHint: string;
  consent: string;
  submit: string;
  sending: string;
  success: string;
  error: string;
  required: string;
  invalidEmail: string;
  invalidPhone: string;
  invalidFile: string;
};

export function ApplicationForm({ job, labels }: { job: string; labels: Labels }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendApplication, { ok: false });
  const [fileName, setFileName] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const onSubmit = useSubmitKeepingValues(action);
  const msg = (k?: string) =>
    k === "email" ? labels.invalidEmail : k === "phone" ? labels.invalidPhone : k === "file" ? labels.invalidFile : k ? labels.required : undefined;

  // clear the chosen file name after a successful submission (adjusted during render)
  const [seen, setSeen] = useState(state);
  if (seen !== state) {
    setSeen(state);
    if (state.ok) setFileName("");
  }

  useEffect(() => {
    if (state.ok) form.current?.reset();
    if (state.ok || state.errors || state.failed) status.current?.focus();
  }, [state]);

  return (
    <form ref={form} action={action} onSubmit={onSubmit} noValidate className="relative grid gap-10" aria-labelledby="apply-title">
      <Honeypot />
      <input type="hidden" name="job" value={job} />
      <h2 id="apply-title" className="t-m">{labels.title}</h2>
      <div className="grid gap-10 sm:grid-cols-2">
        <Field id="a-name" name="name" label={labels.name} autoComplete="name" required error={msg(state.errors?.name)} />
        <Field id="a-birth" name="birth" type="date" label={labels.birth} autoComplete="bday" required error={msg(state.errors?.birth)} />
        <Field id="a-phone" name="phone" type="tel" label={labels.phone} autoComplete="tel" inputMode="tel" required error={msg(state.errors?.phone)} />
        <Field id="a-email" name="email" type="email" label={labels.email} autoComplete="email" required error={msg(state.errors?.email)} />
      </div>
      <Field id="a-address" name="address" label={labels.address} autoComplete="address-level2" required error={msg(state.errors?.address)} />

      <div>
        <span className="t-label block" id="a-cv-label">
          {labels.cv} <span aria-hidden="true">*</span>
        </span>
        <label htmlFor="a-cv" className="vp-filerow mt-3 flex cursor-pointer items-center justify-between gap-6 border-b border-[var(--line)] pb-3 pt-2">
          <span className={`t-body-l truncate ${fileName ? "" : "text-[var(--fg-2)]"}`}>{fileName || labels.noFile}</span>
          <span className="vp-ulink t-small shrink-0">{labels.cvChoose}</span>
        </label>
        <input
          id="a-cv"
          name="cv"
          type="file"
          required
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          aria-labelledby="a-cv-label"
          aria-describedby={`a-cv-hint${state.errors?.cv ? " a-cv-error" : ""}`}
          onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? "")}
        />
        <p id="a-cv-hint" className="t-label mt-2">{labels.cvHint}</p>
        {state.errors?.cv ? (
          <p id="a-cv-error" className="t-small mt-2">— {msg(state.errors.cv)}</p>
        ) : null}
      </div>

      <Consent id="a-consent" label={labels.consent} error={msg(state.errors?.consent)} />
      <div className="flex flex-wrap items-center justify-between gap-6">
        <Submit pending={pending} label={labels.submit} pendingLabel={labels.sending} />
        <p ref={status} tabIndex={-1} role="status" aria-live="polite" className="t-small outline-none">
          {state.ok ? labels.success : state.failed ? labels.failed : state.errors ? labels.error : ""}
          {state.failed ? " " : null}
          {state.failed ? <MailFallback form={form} to={company.email} subject={`${labels.mailSubject}: ${job}`} label={labels.mailFallback} note={labels.mailNote} /> : null}
        </p>
      </div>
    </form>
  );
}
