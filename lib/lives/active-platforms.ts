import "server-only";
import { getServerEnv } from "@/lib/config/server-env";
import { parseProviderList, selectProviders } from "@/lib/lives/providers/select";
import type { LivesProvider } from "@/lib/lives/providers/types";
import type { Platform } from "@/lib/lives/types";
import { isTwitchConfigured } from "@/lib/twitch/client";

/** Candidato só para a seleção: os textos não buscam lives. */
const stub = (platform: Platform, configured: boolean): LivesProvider => ({
  platform,
  isConfigured: () => configured,
  getLives: () => Promise.reject(new Error("só para seleção")),
});

/**
 * Plataformas ativas para os textos do site (spec 034), com a mesma regra do agregador
 * (spec 023): LIVES_PROVIDERS + credenciais. Lido no build (metadata e imagem OG) e no
 * servidor; mudar a variável na Vercel exige redeploy, como no agregador.
 */
export function getActivePlatforms(): Platform[] {
  const env = getServerEnv();
  const { platforms } = parseProviderList(env.livesProviders);
  const { providers } = selectProviders(platforms, {
    youtube: stub("youtube", true),
    twitch: stub("twitch", isTwitchConfigured(env)),
  });
  return providers.map((p) => p.platform);
}
