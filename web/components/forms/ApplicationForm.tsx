"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendApplication, type FormState } from "@/lib/actions";
import { Consent, ErrorSummary, Field, firstInvalid, focusField, Honeypot, MailFallback, Sent, Submit, useLiveErrors, useSubmitKeepingValues } from "./Fields";
import { company } from "@/content/site";
import { EMAIL, PHONE } from "./patterns";

type Labels = {
  failed: string;
  mailFallback: string;
  mailSubject: string;
  mailNote: string;
  title: string;
  name: string;
  birth: string;
  birthHint: string;
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
  consentShort: string;
  sentTitle: string;
  required: string;
  invalidEmail: string;
  invalidPhone: string;
  invalidFile: string;
};

/**
 * An application: who, how to reach them, the CV. A failed attempt lists what to correct above the
 * form and takes the focus to the first field; each error goes as soon as its field is right.
 * A sent application gives way to a confirmation.
 */
export function ApplicationForm({ job, labels }: { job: string; labels: Labels }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendApplication, { ok: false });
  const [fileName, setFileName] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const onSubmit = useSubmitKeepingValues(action);
  const live = useLiveErrors(state.errors);
  const errors = live.errors;
  const msg = (k?: string) =>
    k === "email" ? labels.invalidEmail : k === "phone" ? labels.invalidPhone : k === "file" ? labels.invalidFile : k ? labels.required : undefined;

  useEffect(() => {
    if (state.errors) focusField(firstInvalid(form.current), form.current?.querySelector<HTMLElement>(".vp-errsum"));
    else if (state.failed) status.current?.focus();
  }, [state]);

  const fields = [
    { name: "name", id: "a-name", label: labels.name },
    { name: "birth", id: "a-birth", label: labels.birth },
    { name: "phone", id: "a-phone", label: labels.phone },
    { name: "email", id: "a-email", label: labels.email },
    { name: "address", id: "a-address", label: labels.address },
    { name: "cv", id: "a-cv", label: labels.cv },
    { name: "consent", id: "a-consent", label: labels.consentShort },
  ];
  const wrong = fields.flatMap((f) => (errors?.[f.name] ? [{ id: f.id, label: f.label, message: msg(errors[f.name]) ?? "" }] : []));

  if (state.ok)
    return (
      <div>
        <h2 id="apply-title" className="t-m">
          {labels.title}
        </h2>
        <div className="mt-10">
          <Sent title={labels.sentTitle} text={labels.success} />
        </div>
      </div>
    );

  return (
    <form
      ref={form}
      action={action}
      onSubmit={onSubmit}
      onInput={live.onInput}
      onBlur={live.onBlur}
      noValidate
      className="relative grid gap-10"
      aria-labelledby="apply-title"
    >
      <Honeypot />
      <input type="hidden" name="job" value={job} />
      <h2 id="apply-title" className="t-m">{labels.title}</h2>
      <ErrorSummary title={labels.error} items={wrong} />
      <div className="grid gap-10 sm:grid-cols-2">
        <Field id="a-name" name="name" label={labels.name} autoComplete="name" required error={msg(errors?.name)} />
        <Field id="a-birth" name="birth" type="date" label={labels.birth} autoComplete="bday" hint={labels.birthHint} error={msg(errors?.birth)} />
        <Field id="a-phone" name="phone" type="tel" label={labels.phone} autoComplete="tel" inputMode="tel" pattern={PHONE} required error={msg(errors?.phone)} />
        <Field id="a-email" name="email" type="email" label={labels.email} autoComplete="email" pattern={EMAIL} required error={msg(errors?.email)} />
      </div>
      <Field id="a-address" name="address" label={labels.address} autoComplete="address-level2" required error={msg(errors?.address)} />

      <div className="vp-field">
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
          aria-describedby={`a-cv-hint${errors?.cv ? " a-cv-error" : ""}`}
          aria-invalid={!!errors?.cv}
          onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? "")}
        />
        <p id="a-cv-hint" className="t-label mt-2">{labels.cvHint}</p>
        {errors?.cv ? (
          <p id="a-cv-error" className="t-small mt-2">— {msg(errors.cv)}</p>
        ) : null}
      </div>

      <Consent id="a-consent" label={labels.consent} error={msg(errors?.consent)} />
      <div className="flex flex-wrap items-center justify-between gap-6">
        <Submit pending={pending} label={labels.submit} pendingLabel={labels.sending} />
        <p ref={status} tabIndex={-1} role="status" aria-live="polite" className="t-small outline-none">
          {state.failed ? labels.failed : ""}
          {state.failed ? " " : null}
          {state.failed ? <MailFallback form={form} to={company.email} subject={`${labels.mailSubject}: ${job}`} label={labels.mailFallback} note={labels.mailNote} /> : null}
        </p>
      </div>
    </form>
  );
}
