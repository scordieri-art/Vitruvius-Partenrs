"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { sendContact, type FormState } from "@/lib/actions";
import { Choice, Consent, Field, Files, Honeypot, Select, Submit, useSubmitKeepingValues } from "./Fields";

type Topic = "property" | "invest" | "supplier" | "press" | "other";
const TOPICS: Topic[] = ["property", "invest", "supplier", "press", "other"];

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
 */
export function ContactForm({ labels }: { labels: Labels }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendContact, { ok: false });
  const urlTopic = useSyncExternalStore(noopSubscribe, topicFromUrl, () => "" as const);
  const [picked, setPicked] = useState<Topic | "" | null>(null);
  const topic = picked ?? urlTopic;
  const form = useRef<HTMLFormElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  const msg = (k?: string) =>
    k === "email" ? labels.invalidEmail : k === "phone" ? labels.invalidPhone : k === "file" ? labels.invalidPhotos : k ? labels.required : undefined;
  const property = topic === "property";
  const onSubmit = useSubmitKeepingValues(action);

  useEffect(() => {
    if (state.ok || state.errors || state.failed) status.current?.focus();
  }, [state]);

  const options = (rec: Record<string, string>) => Object.entries(rec).map(([value, label]) => ({ value, label }));

  return (
    // a sent message renders a fresh, empty form (new key); the chosen topic lives above it and stays
    <form key={state.ok ? state.sent : "form"} ref={form} action={action} onSubmit={onSubmit} noValidate className="relative grid gap-10">
      <Honeypot />
      <Choice
        name="topic"
        legend={labels.topic}
        options={TOPICS.map((t) => ({ value: t, label: labels.topics[t] }))}
        value={topic}
        onChange={(v) => setPicked(v as Topic)}
        error={state.errors?.topic ? labels.chooseTopic : undefined}
      />

      {property ? (
        <div className="vp-reveal-group grid gap-10">
          <div className="grid gap-10 sm:grid-cols-2">
            <Field id="c-city" name="city" label={labels.city} autoComplete="address-level2" required error={msg(state.errors?.city)} />
            <Select
              id="c-type"
              name="type"
              label={labels.type}
              placeholder={labels.choose}
              options={options(labels.types)}
              required
              error={msg(state.errors?.type)}
            />
          </div>
          <div className="grid gap-10 sm:grid-cols-2">
            <Field id="c-area" name="area" label={labels.area} inputMode="numeric" pattern="[0-9 .]*" />
            <Select id="c-condition" name="condition" label={labels.condition} placeholder={labels.choose} options={options(labels.conditions)} />
          </div>
        </div>
      ) : null}

      <div className="grid gap-10 sm:grid-cols-2">
        <Field id="c-name" name="name" label={labels.name} autoComplete="name" required error={msg(state.errors?.name)} />
        <Field id="c-email" name="email" type="email" label={labels.email} autoComplete="email" required error={msg(state.errors?.email)} />
      </div>
      {property || topic === "invest" ? (
        <Field id="c-phone" name="phone" type="tel" label={labels.phone} autoComplete="tel" hint={labels.phoneHint} error={msg(state.errors?.phone)} />
      ) : null}
      <Field id="c-message" name="message" textarea label={property ? labels.messageProperty : labels.message} required error={msg(state.errors?.message)} />
      {property ? (
        <Files
          id="c-photos"
          name="photos"
          label={labels.photos}
          button={labels.photosButton}
          hint={labels.photosHint}
          accept="image/jpeg,image/png,image/webp"
          chosenLabel={(n) => (n === 1 ? labels.photosChosenOne : labels.photosChosen.replace("{n}", String(n)))}
          error={msg(state.errors?.photos)}
        />
      ) : null}
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
