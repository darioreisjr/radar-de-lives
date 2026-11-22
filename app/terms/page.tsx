import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: `Termos de uso | ${siteConfig.name}`,
  description: "Condições de uso do Radar de Lives.",
};

const YOUTUBE_TERMS = "https://www.youtube.com/t/terms";
const linkClass = "text-accent-cyan underline underline-offset-2";

export default function TermsPage() {
  return (
    <LegalPage title="Termos de uso">
      <LegalSection title="Aceite">
        <p>
          Ao selecionar &ldquo;Li e concordo. Continuar&rdquo; e usar o {siteConfig.name}, você concorda com estes termos e
          com a{" "}
          <Link href="/privacy" className={linkClass}>
            política de privacidade
          </Link>
          . Se não concordar, não use as funcionalidades do site.
        </p>
      </LegalSection>

      <LegalSection title="O serviço">
        <p>
          O {siteConfig.name} é um diretório gratuito e independente que lista <strong>lives encontradas</strong> pela busca
          pública da YouTube Data API. A busca depende de títulos, idioma e região e{" "}
          <strong>não garante cobertura completa</strong>. Idioma e relação com o jogo são estimados e podem estar errados.
          O site não tem conta, login, cadastro, pagamento nem publicidade própria.
        </p>
      </LegalSection>

      <LegalSection title="YouTube e serviços de terceiros">
        <p>
          O site usa os YouTube API Services. Ao usar o {siteConfig.name}, você concorda em cumprir os{" "}
          <ExternalLink href={YOUTUBE_TERMS}>Termos de Serviço do YouTube</ExternalLink>. O tratamento de dados pelo Google
          segue a <ExternalLink href="https://policies.google.com/privacy">Política de Privacidade do Google</ExternalLink>.
        </p>
        <p>
          O YouTube, o Google e outros terceiros podem alterar, restringir ou remover conteúdos e funcionalidades. O{" "}
          {siteConfig.name} não controla a disponibilidade, as políticas nem o tratamento de dados desses serviços.
        </p>
      </LegalSection>

      <LegalSection title="Marcas e conteúdo">
        <p>{siteConfig.disclaimer}</p>
        <p>
          O site não é afiliado, patrocinado, aprovado nem administrado pela Rockstar Games, pela Take-Two Interactive ou
          pelo YouTube. O uso de &ldquo;GTA 6&rdquo; é apenas descritivo, para identificar o tema das transmissões listadas,
          e não indica autorização, endosso nem vínculo comercial.
        </p>
        <p>
          Vídeos, títulos, miniaturas e nomes de canais pertencem aos seus criadores e são exibidos como o YouTube os
          fornece. O site não baixa, armazena nem retransmite vídeos e não reivindica propriedade sobre esse conteúdo.
          Pedidos sobre conteúdo hospedado no YouTube devem ir ao titular do canal ou ao YouTube.
        </p>
      </LegalSection>

      <LegalSection title="Uso permitido">
        <p>
          Você pode usar o diretório para fins pessoais e lícitos. Não use o site para interromper seu funcionamento,
          contornar limites técnicos, enviar requisições abusivas, acessar sistemas sem autorização, violar direitos de
          terceiros ou descumprir os Termos de Serviço do YouTube e a lei.
        </p>
      </LegalSection>

      <LegalSection title="Atualidade e disponibilidade">
        <p>
          As informações podem estar atrasadas, incompletas ou indisponíveis. Os dados ficam em cache por até cerca de 25
          minutos, e uma live pode terminar depois da última atualização. O número de espectadores só aparece quando o
          canal o torna público.
        </p>
        <p>
          O site depende de limites de uso da API do YouTube. Quando esse limite é atingido, novas buscas ficam suspensas
          até a renovação diária e podem ser exibidos resultados salvos, sempre sinalizados. O serviço é gratuito e pode ser
          alterado, suspenso ou encerrado. Esta cláusula não afasta garantias ou direitos que a lei não permita excluir.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilidade">
        <p>
          Na medida permitida pela lei, o responsável pelo site não responde por indisponibilidade, alterações, remoções ou
          conteúdo de serviços de terceiros que não controla, nem pelo uso do site em desacordo com estes termos. Nada nestes
          termos exclui ou limita responsabilidade que a lei não permita excluir, nem afasta direitos garantidos pelo Código
          de Defesa do Consumidor ou por outras normas obrigatórias.
        </p>
      </LegalSection>

      <LegalSection title="Privacidade">
        <p>
          O tratamento de dados pessoais está descrito na{" "}
          <Link href="/privacy" className={linkClass}>
            política de privacidade
          </Link>
          . Concordar com estes termos e com a política não é consentimento para finalidades que não estejam descritas nela
          nem para todo tratamento feito por terceiros.
        </p>
      </LegalSection>

      <LegalSection title="Alterações">
        <p>
          Estes termos podem mudar para refletir alterações no serviço, nos fornecedores ou na lei. A versão vigente fica
          nesta página, com a data de atualização no topo. Quando os termos ou a política mudam, o site pede o aceite de
          novo antes de liberar a lista de lives.
        </p>
      </LegalSection>

      <LegalSection title="Lei aplicável e foro">
        <p>
          Estes termos seguem as leis da República Federativa do Brasil. Vale o foro que a lei definir como competente,
          inclusive o do domicílio do consumidor, quando aplicável.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
