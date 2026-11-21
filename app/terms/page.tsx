import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: `Termos de uso | ${siteConfig.name}`,
  description: "Condições de uso do Radar de Lives.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Termos de uso">
      <LegalSection title="Projeto independente">
        <p>{siteConfig.disclaimer}</p>
      </LegalSection>

      <LegalSection title="O que o site faz">
        <p>
          O {siteConfig.name} lista <strong>lives encontradas</strong> pela busca pública da YouTube Data API. A busca
          depende de títulos, idioma e região e <strong>não garante cobertura completa</strong>. Idioma e relação com o jogo
          são estimados e podem estar errados. Uma live pode terminar depois da última atualização, e o número de
          espectadores só aparece quando o canal o torna público.
        </p>
      </LegalSection>

      <LegalSection title="Conteúdo dos criadores e do YouTube">
        <p>
          Vídeos, títulos, miniaturas e nomes de canais pertencem aos seus criadores e são exibidos como o YouTube os
          fornece. O site não baixa, armazena nem retransmite vídeos. Ao assistir aqui ou no YouTube, você também está
          sujeito aos <ExternalLink href="https://www.youtube.com/t/terms">Termos de Serviço do YouTube</ExternalLink>.
        </p>
      </LegalSection>

      <LegalSection title="Disponibilidade">
        <p>
          O site depende de limites de uso da API do YouTube. Quando esse limite é atingido, novas buscas ficam suspensas
          até a renovação diária e podem ser exibidos resultados salvos, sempre sinalizados.
        </p>
      </LegalSection>

      <LegalSection title="Privacidade">
        <p>
          Veja a <Link href="/privacy" className="text-accent-cyan underline underline-offset-2">política de privacidade</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
