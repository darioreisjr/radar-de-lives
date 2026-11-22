import type { Metadata } from "next";
import { ExternalLink, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: `Privacidade | ${siteConfig.name}`,
  description: "Como o Radar de Lives trata dados e usa os YouTube API Services.",
};

const GOOGLE_PRIVACY = "https://policies.google.com/privacy";
const YOUTUBE_TERMS = "https://www.youtube.com/t/terms";

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidade">
      <LegalSection title="Resumo">
        <p>
          O {siteConfig.name} não tem contas, não usa cookies próprios e não guarda dados pessoais em banco de dados. Para
          mostrar lives, o site usa os <strong>YouTube API Services</strong>, serviços do Google. Para contar visitas, usa o{" "}
          <strong>Vercel Web Analytics</strong>, que não usa cookies de terceiros.
        </p>
      </LegalSection>

      <LegalSection title="Uso dos YouTube API Services">
        <p>
          O servidor do site consulta a YouTube Data API v3 para encontrar transmissões públicas ao vivo e exibe apenas
          metadados públicos retornados por ela: título, canal, miniatura, horário de início e, quando o canal permite,
          número de espectadores. Esses dados ficam em cache por até cerca de 25 minutos e depois são descartados ou
          atualizados. Em produção, o cache fica no Upstash Redis, um serviço de armazenamento usado pelo site.
        </p>
        <p>
          O uso do YouTube está sujeito aos <ExternalLink href={YOUTUBE_TERMS}>Termos de Serviço do YouTube</ExternalLink>,
          e o tratamento de dados pelo Google segue a{" "}
          <ExternalLink href={GOOGLE_PRIVACY}>Política de Privacidade do Google</ExternalLink>.
        </p>
      </LegalSection>

      <LegalSection title="Dados tratados pelo site">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Endereço IP:</strong> usado para limitar requisições em excesso. O IP não é gravado: guardamos
            apenas um código derivado dele por função de hash com chave secreta (HMAC-SHA256), que não permite
            recuperar o endereço sem essa chave. Esse código fica no Upstash Redis por até 60 segundos e é apagado
            automaticamente.
          </li>
          <li>
            <strong>Registros técnicos:</strong> o site registra eventos de funcionamento (por exemplo, consultas ao
            YouTube e falhas) sem IP nem dados pessoais. O provedor de hospedagem pode manter registros de acesso próprios,
            conforme a política dele. O site é hospedado na Vercel.
          </li>
          <li>
            <strong>Filtros e preferências:</strong> ficam só na página aberta e são perdidos ao recarregar. Nada é salvo no
            navegador.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Estatísticas de visitas">
        <p>
          Usamos o Vercel Web Analytics para saber quantas pessoas visitam o site e quais páginas são vistas. Para cada
          página vista, a Vercel registra: horário, endereço da página (sem parâmetros de busca, que removemos antes do
          envio), página de origem (referrer), país, região e cidade aproximados, sistema operacional, navegador e tipo de
          dispositivo.
        </p>
        <p>
          Segundo a Vercel, esses dados são anônimos, não ficam associados ao seu endereço IP, não usam cookies de terceiros
          e a identificação da visita (um código gerado a partir da requisição) é descartada após 24 horas. Mais detalhes na{" "}
          <ExternalLink href="https://vercel.com/docs/analytics/privacy-policy">
            documentação de privacidade do Vercel Web Analytics
          </ExternalLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="Conteúdo carregado do Google">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Miniaturas:</strong> as imagens das lives são carregadas diretamente dos servidores do YouTube
            (i.ytimg.com). Ao exibi-las, seu navegador se conecta ao Google, que recebe dados técnicos como o IP.
          </li>
          <li>
            <strong>Player incorporado:</strong> o player do YouTube só é carregado depois que você clica em &ldquo;Carregar
            player&rdquo;. A partir daí, o Google pode usar cookies e coletar dados de uso conforme a política dele.
          </li>
          <li>
            <strong>Links para o YouTube:</strong> &ldquo;Assistir no YouTube&rdquo; abre o site do YouTube em nova aba.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Seus controles">
        <p>
          Você pode assistir sem carregar o player incorporado, usando os links para o YouTube. Para gerenciar dados que o
          Google associa à sua conta, use as configurações de segurança da sua Conta do Google (
          <ExternalLink href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</ExternalLink>
          ).
        </p>
      </LegalSection>
    </LegalPage>
  );
}
