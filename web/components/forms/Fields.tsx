"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

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
  name,
  legend,
  options,
  value,
  onChange,
  error,
}: {
  name: string;
  legend: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <fieldset className="vp-choice" aria-describedby={error ? `${name}-error` : undefined}>
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
}: {
  id: string;
  name: string;
  label: string;
  button: string;
  hint: string;
  accept: string;
  error?: string;
  chosenLabel: (n: number) => string;
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
        <span className="t-body-l truncate" aria-live="polite">
          {names.length ? chosenLabel(names.length) : "—"}
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
