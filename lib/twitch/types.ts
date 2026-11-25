import { z } from "zod";

/**
 * Campos usados de GET /helix/streams (spec 019, spec 028).
 * Cada item é validado separadamente (D6). tag_ids e is_mature são obsoletos e ignorados.
 */
export const TwitchStreamSchema = z.object({
  id: z.string().min(1),
  user_id: z.string().min(1),
  user_login: z.string().regex(/^[A-Za-z0-9_]{1,40}$/),
  user_name: z.string().optional().default(""),
  type: z.string().optional().default("live"),
  title: z.string().optional().default(""),
  viewer_count: z.unknown().optional(),
  started_at: z.string().optional(),
  language: z.string().optional().default(""),
  thumbnail_url: z.string().optional().default(""),
  tags: z.array(z.string()).nullable().optional(),
});
export type TwitchStream = z.infer<typeof TwitchStreamSchema>;

/** Página de streams: itens ainda não validados (validação item a item, D6). */
export const TwitchStreamsPageSchema = z.object({
  data: z.array(z.unknown()),
  pagination: z.object({ cursor: z.string().optional() }).partial().optional(),
});

/** GET /helix/channels: só o que o selo de conteúdo adulto usa (spec 028 D1). */
export const TwitchChannelsSchema = z.object({
  data: z.array(
    z.object({
      broadcaster_id: z.string(),
      content_classification_labels: z.array(z.string()).optional().default([]),
    }),
  ),
});
