export const siteConfig = {
  name: "Radar de Lives",
  /** Endereço público de produção (decisão do usuário, 2026-11-21). NEXT_PUBLIC_SITE_URL tem precedência. */
  url: "https://radardelives.darioreis.dev",
  title: "Lives de GTA 6 ao vivo | Radar de Lives",
  description: "Encontre transmissões públicas de GTA 6 ao vivo no YouTube.",
  disclaimer:
    "Projeto independente de fãs. Não afiliado à Rockstar Games, Take-Two Interactive ou YouTube. GTA e Grand Theft Auto são marcas de seus respectivos proprietários.",
  coverageNote:
    "Mostramos lives encontradas pela busca pública da YouTube Data API. A busca depende de títulos, idioma e região, e não garante cobertura completa.",
  /** Cooldown do botão Atualizar (PRD §5). */
  refreshCooldownSeconds: 30,
  /**
   * Dados das páginas legais (spec 003 D1). Só o responsável pelo projeto pode definir
   * `controller` e `contact`. Enquanto forem null, /privacy e /terms mostram aviso de versão preliminar.
   */
  legal: {
    controller: "Radar de Lives, projeto independente de fãs" as string | null,
    contact: "dev.darioreis@gmail.com" as string | null,
    updatedAt: "2026-11-21",
  },
} as const;
