"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type InputHTMLAttributes,
  type RefObject,
  type ReactNode,
  type SyntheticEvent,
  type TextareaHTMLAttributes,
} from "react";
import type { FormState } from "@/lib/actions";

/**
 * React 19 clears a form after every action, errors included: a visitor who misses one
 * field would lose everything they wrote. Submitting through this handler skips that
 * reset (the forms reset themselves only on success). The `action` attribute stays on
 * the form, so it still posts before hydration or without JavaScript.
 */
export function useSubmitKeepingValues(action: (data: FormData) => void) {
  const [, startTransition] = useTransition();
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}
import { ButtonBody } from "@/components/ui/Button";
import { Mark } from "@/components/marks/Mark";

type Errors = NonNullable<FormState["errors"]>;
type Verdict = Errors[string] | "ok";

/** What the browser's own checks say of a field, on the rules the server applies. */
function verdict(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): Verdict {
  if (el.type === "radio") return el.form?.querySelector(`input[name="${el.name}"]:checked`) ? "ok" : "required";
  if (el.type === "checkbox") return (el as HTMLInputElement).checked ? "ok" : "required";
  if (el.validity.valueMissing) return "required";
  if (el.validity.valid) return "ok";
  return el.type === "email" ? "email" : el.type === "tel" ? "phone" : el.type === "file" ? "file" : "required";
}

/**
 * The errors of the last attempt, kept true while the visitor corrects them: a field loses its
 * error as soon as it is right (as it is typed), and a field still wrong gets the right message
 * when it is left. A field without an error is never judged while it is being typed in.
 */
export function useLiveErrors(errors: FormState["errors"]) {
  const [over, setOver] = useState<Record<string, Verdict>>({});
  const [seen, setSeen] = useState(errors);
  if (seen !== errors) {
    setSeen(errors);
    setOver({});
  }
  const judge = (settle: boolean) => (e: SyntheticEvent<HTMLFormElement>) => {
    const el = e.target as HTMLInputElement;
    if (!el.name || !errors?.[el.name]) return;
    const v = verdict(el);
    if (v === "ok" || settle) setOver((o) => (o[el.name] === v ? o : { ...o, [el.name]: v }));
  };
  const live: Errors = {};
  for (const [k, v] of Object.entries(errors ?? {})) {
    const now = over[k] ?? v;
    if (now !== "ok") live[k] = now;
  }
  return { errors: errors ? live : undefined, onInput: judge(false), onBlur: judge(true) };
}

/**
 * Focus a field (in a group, the chosen option or else the first) and bring it, label and all, to
 * the upper middle of the screen; with `lead` (the error summary above it), show the summary from
 * its top as well whenever both fit on the screen.
 */
export function focusField(el: HTMLElement | null, lead?: HTMLElement | null) {
  const field = el?.matches("input, select, textarea") ? el : (el?.querySelector<HTMLElement>("input:checked") ?? el?.querySelector<HTMLElement>("input, select, textarea"));
  if (!field) return;
  field.focus({ preventScroll: true });
  const box = field.closest<HTMLElement>(".vp-field, fieldset, label") ?? field;
  // measured against the page's own scroll, which the smooth scroller may not have caught up with yet
  const y = (n: HTMLElement) => n.getBoundingClientRect().top + window.scrollY;
  let top = y(box) - innerHeight / 3;
  if (lead) {
    const below = (document.querySelector(".vp-header")?.getBoundingClientRect().height ?? 0) + 24;
    if (y(box) + box.offsetHeight < y(lead) - below + innerHeight - 24) top = y(lead) - below;
  }
  const lenis = (window as unknown as { __lenis?: { scrollTo: (to: number) => void } }).__lenis;
  if (lenis) lenis.scrollTo(top);
  else window.scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

/** The first field still to correct, in the order of the form. */
export const firstInvalid = (form: HTMLFormElement | null) => form?.querySelector<HTMLElement>('fieldset[data-invalid], [aria-invalid="true"]') ?? null;

/** Ahead of the form after a failed attempt: what is still wrong, each line a link to its field. */
export function ErrorSummary({ title, items }: { title: string; items: { id: string; label: string; message: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="vp-errsum">
      <h3 className="t-body">{title}</h3>
      <ul className="mt-3 grid gap-2">
        {items.map((it) => (
          <li key={it.id} className="t-small">
            <a
              href={`#${it.id}`}
              className="vp-ulink"
              onClick={(e) => {
                e.preventDefault();
                focusField(document.getElementById(it.id));
              }}
            >
              {it.label}
            </a>
            <span className="text-[var(--fg-2)]"> — {it.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** After a successful send the form gives way to this: the symbol fills, the title takes the focus. */
export function Sent({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <div className="vp-sent">
      <Mark className="vp-sent__mark" />
      <h3 ref={heading} tabIndex={-1} aria-describedby="sent-text" className="t-l mt-8 outline-none">
        {title}
      </h3>
      <p id="sent-text" className="t-body-l mt-4 max-w-[40ch] text-[var(--fg-2)]">
        {text}
      </p>
      {children ? <div className="mt-10">{children}</div> : null}
    </div>
  );
}

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

/** Native select dressed as a hairline field: keyboard, screen readers and phone pickers work as usual. */
export function Select({
  id,
  name,
  label,
  options,
  placeholder,
  required,
  error,
}: {
  id: string;
  name: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="vp-field">
      <label htmlFor={id} className="t-label block">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <div className="vp-select">
        <select
          id={id}
          name={name}
          required={required}
          defaultValue=""
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={
            "vp-input w-full appearance-none border-0 border-b bg-transparent px-0 pb-3 pt-2 pr-8 text-[var(--fg)] outline-none t-body-l transition-colors duration-200 " +
            (error ? "border-[var(--fg)]" : "border-[var(--line)] focus:border-[var(--fg)]")
          }
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p id={`${id}-error`} className="t-small mt-2 text-[var(--fg)]">
          — {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * One choice among a few, as large rows: radio inputs under the hood, so arrow keys,
 * labels and form data behave natively. The chosen row carries the brand's slope mark.
 */
export function Choice({
  id,
  name,
  legend,
  options,
  value,
  onChange,
  error,
}: {
  id: string;
  name: string;
  legend: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <fieldset id={id} className="vp-choice" data-invalid={error ? "" : undefined} aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="t-label mb-4">
        {legend}
        <span aria-hidden="true"> *</span>
      </legend>
      <div className="vp-choice__list">
        {options.map((o) => (
          <label key={o.value} className="vp-choice__item">
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} required className="sr-only" />
            <Mark kind={value === o.value ? "solid" : "outline"} className="vp-choice__mark" />
            <span className="t-body-l">{o.label}</span>
          </label>
        ))}
      </div>
      {error ? (
        <p id={`${name}-error`} className="t-small mt-3 text-[var(--fg)]">
          — {error}
        </p>
      ) : null}
    </fieldset>
  );
}

/** Optional photographs: a real file input behind a hairline button, with the chosen names listed. */
export function Files({
  id,
  name,
  label,
  button,
  hint,
  accept,
  error,
  chosenLabel,
  empty,
}: {
  id: string;
  name: string;
  label: string;
  button: string;
  hint: string;
  accept: string;
  error?: string;
  chosenLabel: (n: number) => string;
  /** shown until something is chosen */
  empty: string;
}) {
  const [names, setNames] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const describedBy = [`${id}-hint`, error ? `${id}-error` : null].filter(Boolean).join(" ");

  // the list of chosen files empties with the form
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const clear = () => setNames([]);
    form.addEventListener("reset", clear);
    return () => form.removeEventListener("reset", clear);
  }, []);
  return (
    <div className="vp-field">
      <span className="t-label block" id={`${id}-label`}>
        {label}
      </span>
      {/* same row as the CV field: what is chosen on the left, the action on the right */}
      <label htmlFor={id} className="vp-filerow mt-3 flex cursor-pointer items-center justify-between gap-6 border-b border-[var(--line)] pb-3 pt-2">
        <span className={`t-body-l truncate ${names.length ? "" : "text-[var(--fg-2)]"}`} aria-live="polite">
          {names.length ? chosenLabel(names.length) : empty}
        </span>
        <span className="vp-ulink t-small shrink-0">{button}</span>
      </label>
      <input
        ref={input}
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        onChange={(e) => setNames([...(e.currentTarget.files ?? [])].map((f) => f.name))}
      />
      {names.length ? (
        <ul className="t-label mt-3 grid gap-1">
          {names.map((n, i) => (
            <li key={`${n}-${i}`} className="truncate">
              {n}
            </li>
          ))}
        </ul>
      ) : null}
      <p id={`${id}-hint`} className="t-label mt-2">
        {hint}
      </p>
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

/**
 * When the site cannot send a form, the visitor's own mail app takes over: a link that opens
 * an email to the group already written with what was typed (each field by its label), so
 * nothing has to be typed again. Files cannot travel in a mailto link: `note` asks for them.
 */
export function MailFallback({ form, to, subject, label, note }: { form: RefObject<HTMLFormElement | null>; to: string; subject: string; label: string; note?: string }) {
  const open = () => {
    const f = form.current;
    if (!f) return;
    const lines: string[] = [];
    for (const el of Array.from(f.elements) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[]) {
      if (!el.name || ["website", "consent"].includes(el.name) || (el as HTMLInputElement).type === "file" || el.type === "hidden") continue;
      if ((el.type === "radio" || el.type === "checkbox") && !(el as HTMLInputElement).checked) continue;
      const value = el instanceof HTMLSelectElement ? (el.value ? el.selectedOptions[0]?.text : "") : el.value;
      if (!value?.trim()) continue;
      // a radio is named by its group's legend, its value by its own label
      const group = el.type === "radio" ? el.closest("fieldset")?.querySelector("legend")?.textContent : null;
      const own = el.labels?.[0]?.textContent?.replace(/\s*\*\s*$/, "").trim();
      lines.push(group ? `${group.replace(/\s*\*\s*$/, "").trim()}: ${own ?? value}` : `${own ?? el.name}: ${value.trim()}`);
    }
    if (note) lines.push("", note);
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  };
  return (
    <button type="button" onClick={open} className="vp-ulink t-small mt-2 block text-left">
      {label} <span aria-hidden="true">↗</span>
    </button>
  );
}
