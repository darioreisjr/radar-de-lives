import { z } from "zod";

export const livesQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(80, "q deve ter no máximo 80 caracteres")
    .optional()
    .transform((v) => (v ? v : undefined)),
  lang: z.enum(["all", "pt", "en", "es"], { error: "lang deve ser all, pt, en ou es" }).default("all"),
  sort: z
    .enum(["relevance", "viewers", "recent"], { error: "sort deve ser relevance, viewers ou recent" })
    .default("relevance"),
  pageToken: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,128}$/, "pageToken inválido")
    .optional(),
});

export type LivesQuery = z.infer<typeof livesQuerySchema>;

const ALLOWED = new Set(["q", "lang", "sort", "pageToken"]);

export function parseLivesQuery(params: URLSearchParams):
  | { ok: true; data: LivesQuery }
  | { ok: false; message: string } {
  const raw: Record<string, string> = {};
  for (const [key, value] of params) {
    if (!ALLOWED.has(key)) return { ok: false, message: `Parâmetro não suportado: ${key.slice(0, 30)}` };
    if (key in raw) return { ok: false, message: `Parâmetro repetido: ${key}` };
    raw[key] = value;
  }
  // q vazio é tratado como ausente; q só com espaços também.
  const parsed = livesQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  return { ok: true, data: parsed.data };
}
