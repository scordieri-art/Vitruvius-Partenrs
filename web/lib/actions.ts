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

const MAX_PHOTOS = 5;
const MAX_PHOTOS_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

// not exported: a "use server" module may only export async functions
const TOPICS = ["property", "invest", "supplier", "press", "other"] as const;
const TOPIC_SUBJECT: Record<(typeof TOPICS)[number], string> = {
  property: "Proposta immobile",
  invest: "Investimento",
  supplier: "Fornitore",
  press: "Stampa",
  other: "Contatto",
};

/** the email always reads in Italian, whichever language the visitor used */
const TYPE_LABEL: Record<string, string> = {
  residential: "Residenziale",
  building: "Edificio cielo-terra",
  office: "Uffici",
  retail: "Commerciale",
  land: "Terreno",
  other: "Altro",
};
const CONDITION_LABEL: Record<string, string> = {
  renovate: "Da ristrutturare",
  good: "In buono stato",
  renovated: "Ristrutturato o nuovo",
  unknown: "Non so",
};

const optional = z.string().trim().optional().default("");

const contactSchema = z.object({
  topic: z.enum(TOPICS, { message: "required" }),
  name: required,
  email: z.string().trim().min(1, "required").pipe(z.email({ message: "email" })),
  phone: z
    .string()
    .trim()
    .optional()
    .default("")
    .refine((v) => v === "" || /^[+()\d\s.-]{6,20}$/.test(v), "phone"),
  city: optional,
  type: optional,
  area: optional,
  condition: optional,
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
type Attachment = { filename: string; content: string };

async function deliver(subject: string, text: string, attachments: Attachment[] = []): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[form] ${subject}\n${text}${attachments.map((a) => `\n[attachment: ${a.filename}]`).join("")}`);
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
      attachments: attachments.length ? attachments : undefined,
    }),
  });
  if (!res.ok) console.error(`[form] mail delivery failed: ${res.status}`);
  return res.ok;
}

export async function sendContact(_prev: FormState, data: FormData): Promise<FormState> {
  if (String(data.get("website") ?? "")) return { ok: true, sent: Date.now() }; // honeypot
  const raw = Object.fromEntries([...data.entries()].filter(([k]) => k !== "photos"));
  const parsed = contactSchema.safeParse(raw);
  const errors = parsed.success ? {} : collect(parsed.error) ?? {};
  // a property offer needs at least its city and type: checked alongside the other fields,
  // so every missing field is reported in one go
  if (raw.topic === "property") {
    if (!String(raw.city ?? "").trim()) errors.city = "required";
    if (!String(raw.type ?? "").trim()) errors.type = "required";
  }

  // photographs travel only with a property offer
  const photos = parsed.success && parsed.data.topic === "property" ? data.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0) : [];
  const bytes = photos.reduce((n, f) => n + f.size, 0);
  if (photos.length > MAX_PHOTOS || bytes > MAX_PHOTOS_BYTES || photos.some((f) => !PHOTO_TYPES.includes(f.type))) errors.photos = "file";

  if (!parsed.success || Object.keys(errors).length) return { ok: false, errors };
  const d = parsed.data;
  const property = d.topic === "property";
  const fields: [string, string][] = [
    ["Argomento", TOPIC_SUBJECT[d.topic]],
    ["Nome", d.name],
    ["Email", d.email],
    ["Telefono", d.phone],
    ["Città", property ? d.city : ""],
    ["Tipologia", property ? (TYPE_LABEL[d.type] ?? d.type) : ""],
    ["Superficie indicativa", property && d.area ? `${d.area} m²` : ""],
    ["Stato", property ? (CONDITION_LABEL[d.condition] ?? d.condition) : ""],
    ["Foto allegate", photos.length ? String(photos.length) : ""],
  ];
  const lines = [...fields.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`), "", d.message, "", "Consenso privacy: sì"];
  const attachments = await Promise.all(photos.map(async (f) => ({ filename: f.name, content: Buffer.from(await f.arrayBuffer()).toString("base64") })));
  const where = d.topic === "property" ? ` — ${d.city}` : "";
  const delivered = await deliver(`[${TOPIC_SUBJECT[d.topic]}] dal sito${where} — ${d.name}`, lines.join("\n"), attachments).catch(() => false);
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
    [{ filename: file.name, content }],
  ).catch(() => false);
  return delivered ? { ok: true, sent: Date.now() } : { ok: false, failed: true, sent: Date.now() };
}
