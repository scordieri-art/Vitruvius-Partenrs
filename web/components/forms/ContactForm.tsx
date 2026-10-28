"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { sendContact, type FormState } from "@/lib/actions";
import { Choice, Consent, ErrorSummary, Field, Files, firstInvalid, focusField, Honeypot, MailFallback, Select, Sent, Submit, useLiveErrors, useSubmitKeepingValues } from "./Fields";
import { company } from "@/content/site";
import { EMAIL, PHONE } from "./patterns";

type Topic = "property" | "invest" | "supplier" | "press" | "other";
const TOPICS: Topic[] = ["property", "invest", "supplier", "press", "other"];

type Labels = {
  failed: string;
  mailFallback: string;
  mailSubject: string;
  mailNote: string;
  name: string;
  email: string;
  message: string;
  consent: string;
  submit: string;
  sending: string;
  success: string;
  error: string;
  consentShort: string;
  sentTitle: string;
  sentTitleProperty: string;
  again: string;
  sentWrite: string;
  required: string;
  invalidEmail: string;
  invalidPhone: string;
  topic: string;
  topics: Record<Topic, string>;
  chooseTopic: string;
  city: string;
  type: string;
  types: Record<string, string>;
  area: string;
  condition: string;
  conditions: Record<string, string>;
  choose: string;
  phone: string;
  phoneHint: string;
  photos: string;
  photosButton: string;
  noPhotos: string;
  photosHint: string;
  /** plain strings: labels cross from the server to this client component */
  photosChosenOne: string;
  photosChosen: string;
  invalidPhotos: string;
  messageProperty: string;
};

const noopSubscribe = () => () => {};
/** ?topic=property preselects a topic (the home's "Let's talk about your property" links here) */
const topicFromUrl = (): Topic | "" => {
  const t = new URLSearchParams(window.location.search).get("topic");
  return TOPICS.includes(t as Topic) ? (t as Topic) : "";
};

/**
 * Contact: first what the message is about, then only the fields that topic needs.
 * A property offer asks for city, type, size, condition and optional photographs,
 * so the group receives it already labelled and complete.
 * A failed attempt lists what to correct above the form and takes the focus to the first field;
 * each error goes as soon as its field is right. A sent message gives way to a confirmation.
 */
export function ContactForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContact, { ok: false });
  const urlTopic = useSyncExternalStore(noopSubscribe, topicFromUrl, () => "" as const);
  const [picked, setPicked] = useState<Topic | "" | null>(null);
  const topic = picked ?? urlTopic;
  const form = useRef<HTMLFormElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const live = useLiveErrors(state.errors);
  const errors = live.errors;
  // the confirmation stays until the visitor asks for a new form
  const [dismissed, setDismissed] = useState<number | undefined>();
  const msg = (k?: string) =>
    k === "email" ? labels.invalidEmail : k === "phone" ? labels.invalidPhone : k === "file" ? labels.invalidPhotos : k ? labels.required : undefined;
  const property = topic === "property";
  const onSubmit = useSubmitKeepingValues(action);

  useEffect(() => {
    if (state.errors) focusField(firstInvalid(form.current), form.current?.querySelector<HTMLElement>(".vp-errsum"));
    else if (state.failed) status.current?.focus();
  }, [state]);
  // back from the confirmation: the new form starts at its first question
  useEffect(() => {
    if (dismissed !== undefined) focusField(document.getElementById("c-topic"));
  }, [dismissed]);

  const options = (rec: Record<string, string>) => Object.entries(rec).map(([value, label]) => ({ value, label }));
  // the fields in the form's order, as the summary names them; only those the chosen topic shows
  const fields: { name: string; id: string; label: string; message?: string }[] = [
    { name: "topic", id: "c-topic", label: labels.topic, message: labels.chooseTopic },
    ...(property
      ? [
          { name: "city", id: "c-city", label: labels.city },
          { name: "type", id: "c-type", label: labels.type },
        ]
      : []),
    { name: "name", id: "c-name", label: labels.name },
    { name: "email", id: "c-email", label: labels.email },
    ...(property || topic === "invest" ? [{ name: "phone", id: "c-phone", label: labels.phone }] : []),
    { name: "message", id: "c-message", label: property ? labels.messageProperty : labels.message },
    ...(property ? [{ name: "photos", id: "c-photos", label: labels.photos }] : []),
    { name: "consent", id: "c-consent", label: labels.consentShort },
  ];
  const wrong = fields.flatMap((f) => (errors?.[f.name] ? [{ id: f.id, label: f.label, message: f.message ?? msg(errors[f.name]) ?? "" }] : []));

  if (state.ok && state.sent !== dismissed)
    return (
      <Sent
        title={property ? labels.sentTitleProperty : labels.sentTitle}
        text={labels.success}
        note={
          <>
            {labels.sentWrite}{" "}
            <a href={`mailto:${company.email}`} className="vp-ulink">
              {company.email}
            </a>
          </>
        }
      >
        <button type="button" className="vp-cta" onClick={() => setDismissed(state.sent)}>
          <span className="vp-cta__rule" aria-hidden="true" />
          <span className="vp-cta__text">{labels.again}</span>
        </button>
      </Sent>
    );

  return (
    // after a sent message the form comes back fresh and empty (new key); the chosen topic stays
    <form
      key={state.ok ? state.sent : "form"}
      ref={form}
      action={action}
      onSubmit={onSubmit}
      onInput={live.onInput}
      onBlur={live.onBlur}
      noValidate
      className="relative grid gap-10"
    >
      <Honeypot />
      <ErrorSummary title={labels.error} items={wrong} />
      <Choice
        id="c-topic"
        name="topic"
        legend={labels.topic}
        options={TOPICS.map((t) => ({ value: t, label: labels.topics[t] }))}
        value={topic}
        onChange={(v) => setPicked(v as Topic)}
        error={errors?.topic ? labels.chooseTopic : undefined}
      />

      {property ? (
        <div className="vp-reveal-group grid gap-10">
          <div className="grid gap-10 sm:grid-cols-2">
            <Field id="c-city" name="city" label={labels.city} autoComplete="address-level2" required error={msg(errors?.city)} />
            <Select
              id="c-type"
              name="type"
              label={labels.type}
              placeholder={labels.choose}
              options={options(labels.types)}
              required
              error={msg(errors?.type)}
            />
          </div>
          <div className="grid gap-10 sm:grid-cols-2">
            <Field id="c-area" name="area" label={labels.area} inputMode="numeric" pattern="[0-9 .]*" />
            <Select id="c-condition" name="condition" label={labels.condition} placeholder={labels.choose} options={options(labels.conditions)} />
          </div>
        </div>
      ) : null}

      <div className="grid gap-10 sm:grid-cols-2">
        <Field id="c-name" name="name" label={labels.name} autoComplete="name" required error={msg(errors?.name)} />
        <Field id="c-email" name="email" type="email" label={labels.email} autoComplete="email" pattern={EMAIL} required error={msg(errors?.email)} />
      </div>
      {property || topic === "invest" ? (
        <Field id="c-phone" name="phone" type="tel" label={labels.phone} autoComplete="tel" pattern={PHONE} hint={labels.phoneHint} error={msg(errors?.phone)} />
      ) : null}
      <Field id="c-message" name="message" textarea label={property ? labels.messageProperty : labels.message} required error={msg(errors?.message)} />
      {property ? (
        <Files
          id="c-photos"
          name="photos"
          label={labels.photos}
          button={labels.photosButton}
          hint={labels.photosHint}
          accept="image/jpeg,image/png,image/webp"
          chosenLabel={(n) => (n === 1 ? labels.photosChosenOne : labels.photosChosen.replace("{n}", String(n)))}
          empty={labels.noPhotos}
          error={msg(errors?.photos)}
        />
      ) : null}
      <Consent id="c-consent" label={labels.consent} error={msg(errors?.consent)} />
      <div className="flex flex-wrap items-center justify-between gap-6">
        <Submit pending={pending} label={labels.submit} pendingLabel={labels.sending} />
        <p ref={status} tabIndex={-1} role="status" aria-live="polite" className="t-small outline-none">
          {state.failed ? labels.failed : ""}
          {state.failed ? " " : null}
          {state.failed ? (
            <MailFallback form={form} to={company.email} subject={labels.mailSubject} label={labels.mailFallback} note={property ? labels.mailNote : undefined} />
          ) : null}
        </p>
      </div>
    </form>
  );
}
