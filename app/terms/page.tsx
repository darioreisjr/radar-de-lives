import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: `Termos de uso | ${siteConfig.name}`,
  description: "Condições de uso do Radar de Lives.",
};

const YOUTUBE_TERMS = "https://www.youtube.com/t/terms";
/** URLs finais conferidas em 2026-11-25 (spec 033). */
const TWITCH_TERMS = "https://legal.twitch.com/legal/terms-of-service/";
const TWITCH_PRIVACY = "https://legal.twitch.com/legal/privacy-notice/";
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
          pública da YouTube Data API e da API da Twitch. A busca depende de títulos, categoria, idioma e região e{" "}
          <strong>não garante cobertura completa</strong>. Idioma e relação com o jogo são estimados e podem estar errados.
          O site não tem conta, login, cadastro, pagamento nem publicidade própria.
        </p>
      </LegalSection>

      <LegalSection title="YouTube, Twitch e serviços de terceiros">
        <p>
          O site usa os YouTube API Services. Ao usar o {siteConfig.name}, você concorda em cumprir os{" "}
          <ExternalLink href={YOUTUBE_TERMS}>Termos de Serviço do YouTube</ExternalLink>. O tratamento de dados pelo Google
          segue a <ExternalLink href="https://policies.google.com/privacy">Política de Privacidade do Google</ExternalLink>.
        </p>
        <p>
          O site também usa a API e o player oficial da Twitch. Ao assistir ou abrir lives da Twitch, valem os{" "}
          <ExternalLink href={TWITCH_TERMS}>Termos de Serviço da Twitch</ExternalLink>, e o tratamento de dados pela
          Twitch segue o <ExternalLink href={TWITCH_PRIVACY}>Aviso de Privacidade da Twitch</ExternalLink>.
        </p>
        <p>
          O YouTube, o Google, a Twitch e outros terceiros podem alterar, restringir ou remover conteúdos e funcionalidades. O{" "}
          {siteConfig.name} não controla a disponibilidade, as políticas nem o tratamento de dados desses serviços.
        </p>
      </LegalSection>

      <LegalSection title="Marcas e conteúdo">
        <p>{siteConfig.disclaimer}</p>
        <p>
          O site não é afiliado, patrocinado, aprovado nem administrado pela Rockstar Games, pela Take-Two Interactive, pelo
          YouTube ou pela Twitch. Os nomes &ldquo;YouTube&rdquo; e &ldquo;Twitch&rdquo; aparecem só para indicar a origem
          de cada live, sem logotipos. O uso de &ldquo;GTA 6&rdquo; é apenas descritivo, para identificar o tema das transmissões listadas,
          e não indica autorização, endosso nem vínculo comercial.
        </p>
        <p>
          Vídeos, títulos, miniaturas e nomes de canais pertencem aos seus criadores e são exibidos como o YouTube e a
          Twitch os fornecem, sempre com link para a live na plataforma de origem. O site não baixa, armazena nem
          retransmite vídeos e não reivindica propriedade sobre esse conteúdo. Pedidos sobre conteúdo hospedado no
          YouTube ou na Twitch devem ir ao titular do canal ou à plataforma.
        </p>
      </LegalSection>

      <LegalSection title="Uso permitido">
        <p>
          Você pode usar o diretório para fins pessoais e lícitos. Não use o site para interromper seu funcionamento,
          contornar limites técnicos, enviar requisições abusivas, acessar sistemas sem autorização, violar direitos de
          terceiros ou descumprir os Termos de Serviço do YouTube ou da Twitch e a lei.
        </p>
      </LegalSection>

      <LegalSection title="Idade e conteúdo">
        <p>
          O site não é direcionado a crianças menores de 13 anos. As transmissões listadas são de um jogo com
          classificação para adultos e podem ter linguagem, violência ou outros conteúdos impróprios para menores. Lives
          que a plataforma de origem classifica como conteúdo adulto aparecem com o selo &ldquo;Conteúdo adulto&rdquo;;
          essa classificação é feita pelo canal e pela plataforma, não pelo {siteConfig.name}.
        </p>
      </LegalSection>

      <LegalSection title="Atualidade e disponibilidade">
        <p>
          As informações podem estar atrasadas, incompletas ou indisponíveis. Os dados ficam em cache por até cerca de 25
          minutos (YouTube) ou 13 minutos (Twitch), e uma live pode terminar depois da última atualização. O número de
          espectadores só aparece quando a plataforma o informa.
        </p>
        <p>
          O site depende de limites de uso das APIs do YouTube e da Twitch. Quando um limite é atingido, novas buscas
          naquela plataforma ficam suspensas até a renovação e podem ser exibidos resultados salvos, sempre sinalizados.
          Se uma plataforma ficar indisponível, as lives das outras continuam aparecendo. O serviço é gratuito e pode ser
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
