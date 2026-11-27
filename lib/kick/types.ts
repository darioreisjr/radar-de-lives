import { z } from "zod";

/**
 * Campos usados de GET /public/v2/livestreams (spec 020; spec 047).
 * Cada item é validado separadamente (D3). Campos opcionais aqui são tolerados para não
 * derrubar a lista se a Kick deixar de enviar algum; os obrigatórios identificam a live.
 */
export const KickLivestreamSchema = z.object({
  title: z.string().optional().default(""),
  language_code: z.string().optional().default(""),
  has_mature_content: z.boolean().optional(),
  viewer_count: z.unknown().optional(),
  thumbnail: z.string().nullable().optional(),
  started_at: z.string().optional(),
  channel: z.object({ slug: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/) }),
  broadcaster_user: z.object({
    id: z.union([z.number().int().nonnegative(), z.string().regex(/^\d{1,20}$/)]),
    username: z.string().optional().default(""),
  }),
});
export type KickLivestream = z.infer<typeof KickLivestreamSchema>;

/** Página de livestreams: itens ainda não validados (validação item a item, D3). */
export const KickLivestreamsPageSchema = z.object({
  data: z.array(z.unknown()),
  pagination: z.object({ next_cursor: z.string().nullable().optional() }).partial().optional(),
});
