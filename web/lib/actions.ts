"use server";

import { z } from "zod";

export type FormState = {
  ok: boolean;
  errors?: Record<string, "required" | "email" | "phone" | "file">;
  /** valid data, but the message could not be delivered */
  failed?: boolean;
  sent?: number;
};

const MAX_CV = 5 * 1024 * 1024;
const CV_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const required = z.string().trim().min(1, "required");

const contactSchema = z.object({
  name: required,
  email: z.string().trim().min(1, "required").pipe(z.email({ message: "email" })),
  message: required,
  consent: z.literal("on", { message: "required" }),
});

const applicationSchema = z.object({
  job: required,
  name: required,
  birth: required,
  phone: z.string().trim().min(1, "required").regex(/^[+()\d\s.-]{6,20}$/, "phone"),
  email: z.string().trim().min(1, "required").pipe(z.email({ message: "email" })),
  address: required,
  consent: z.literal("on", { message: "required" }),
});

function collect(error: z.ZodError): FormState["errors"] {
  const out: NonNullable<FormState["errors"]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    if (!out[key]) out[key] = issue.message === "email" ? "email" : issue.message === "phone" ? "phone" : "required";
  }
  return out;
}

/**
 * Delivery through Resend (RESEND_API_KEY, MAIL_FROM, MAIL_TO).
 * Without a key the message is only logged in development; in production
 * the visitor is told that sending failed, so nothing is lost silently.
 */
async function deliver(subject: string, text: string, attachment?: { filename: string; content: string }): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[form] ${subject}\n${text}${attachment ? `\n[attachment: ${attachment.filename}]` : ""}`);
      return true;
    }
    console.error("[form] RESEND_API_KEY missing: message not delivered");
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM ?? "Sito Vitruvius & Partners <noreply@vitruviusandpartners.com>",
      to: [process.env.MAIL_TO ?? "info@vitruviusandpartners.com"],
      subject,
      text,
      attachments: attachment ? [attachment] : undefined,
    }),
  });
  if (!res.ok) console.error(`[form] mail delivery failed: ${res.status}`);
  return res.ok;
}

export async function sendContact(_prev: FormState, data: FormData): Promise<FormState> {
  if (String(data.get("website") ?? "")) return { ok: true, sent: Date.now() }; // honeypot
  const parsed = contactSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { ok: false, errors: collect(parsed.error) };
  const { name, email, message } = parsed.data;
  const delivered = await deliver(`Contatto dal sito — ${name}`, `Nome: ${name}\nEmail: ${email}\n\n${message}\n\nConsenso privacy: sì`).catch(() => false);
  return delivered ? { ok: true, sent: Date.now() } : { ok: false, failed: true, sent: Date.now() };
}

export async function sendApplication(_prev: FormState, data: FormData): Promise<FormState> {
  if (String(data.get("website") ?? "")) return { ok: true, sent: Date.now() };
  const parsed = applicationSchema.safeParse(Object.fromEntries([...data.entries()].filter(([k]) => k !== "cv")));
  const errors = parsed.success ? {} : collect(parsed.error) ?? {};
  const cv = data.get("cv");
  if (!(cv instanceof File) || cv.size === 0) errors.cv = "required";
  else if (cv.size > MAX_CV || !CV_TYPES.includes(cv.type)) errors.cv = "file";
  if (!parsed.success || Object.keys(errors).length) return { ok: false, errors };
  const d = parsed.data;
  const file = cv as File;
  const content = Buffer.from(await file.arrayBuffer()).toString("base64");
  const delivered = await deliver(
    `Candidatura — ${d.job} — ${d.name}`,
    `Posizione: ${d.job}\nNome e cognome: ${d.name}\nData di nascita: ${d.birth}\nTelefono: ${d.phone}\nEmail: ${d.email}\nDomicilio: ${d.address}\nConsenso privacy: sì`,
    { filename: file.name, content },
  ).catch(() => false);
  return delivered ? { ok: true, sent: Date.now() } : { ok: false, failed: true, sent: Date.now() };
}
