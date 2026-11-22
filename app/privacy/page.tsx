import type { Metadata } from "next";
import { ExternalLink, LegalPage, LegalSection } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: `Privacidade | ${siteConfig.name}`,
  description: "Como o Radar de Lives trata dados e usa os YouTube API Services.",
};

const GOOGLE_PRIVACY = "https://policies.google.com/privacy";
const YOUTUBE_TERMS = "https://www.youtube.com/t/terms";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" });

export default function PrivacyPage() {
  const { controller, contact } = siteConfig.legal;

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

      <LegalSection title="Controlador e contato">
        <p>
          O controlador dos dados tratados por este site é{" "}
          <strong>{controller ?? "o responsável pelo site (a definir)"}</strong>. Para dúvidas, pedidos ou reclamações
          sobre privacidade, escreva para{" "}
          {contact ? (
            <a href={`mailto:${contact}`} className="text-accent-cyan underline underline-offset-2">
              {contact}
            </a>
          ) : (
            "o contato do site (a definir)"
          )}
          . Esse e-mail é o canal de comunicação com os titulares; o projeto não tem um encarregado (DPO) nomeado
          separadamente.
        </p>
      </LegalSection>

      <LegalSection title="Finalidades e bases legais">
        <p>
          Cada tratamento tem uma finalidade específica e uma base legal da Lei Geral de Proteção de Dados (LGPD, Lei
          13.709/2018):
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Código derivado do IP no limite de requisições:</strong> segurança do site e prevenção de abuso, como
            excesso de consultas que esgotaria a cota da API do YouTube. Base legal: legítimo interesse (art. 7º, IX).
          </li>
          <li>
            <strong>Estatísticas de visitas (Vercel Web Analytics):</strong> saber, de forma agregada, quantas pessoas
            usam o site e quais páginas são vistas, para manter e melhorar o serviço. Base legal: legítimo interesse (art.
            7º, IX).
          </li>
          <li>
            <strong>Miniaturas carregadas do YouTube:</strong> exibir as imagens das lives encontradas, que são parte do
            próprio serviço. Base legal: legítimo interesse (art. 7º, IX).
          </li>
          <li>
            <strong>Player incorporado do YouTube:</strong> assistir à live dentro do site. Só é carregado depois que você
            clica em &ldquo;Carregar player&rdquo;. Base legal: consentimento (art. 7º, I), que você pode deixar de dar
            simplesmente não carregando o player.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Compartilhamento e operadores">
        <p>Não vendemos nem compartilhamos dados para publicidade. Usamos estes serviços para o site funcionar:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Vercel</strong> (operador): hospedagem do site, registros de acesso e estatísticas de visitas.
          </li>
          <li>
            <strong>Upstash</strong> (operador): armazenamento temporário do cache de lives e do código derivado do IP
            usado no limite de requisições.
          </li>
          <li>
            <strong>Google/YouTube</strong>: fornece os dados públicos das lives pela API (o servidor do site não envia
            dados de visitantes nessa consulta), as miniaturas e o player incorporado. Quando seu navegador carrega
            miniaturas ou o player, o Google recebe dados diretamente de você e os trata como controlador, conforme a{" "}
            <ExternalLink href={GOOGLE_PRIVACY}>Política de Privacidade do Google</ExternalLink>.
          </li>
        </ul>
        <p>
          Também podemos fornecer dados quando houver obrigação legal ou ordem de autoridade competente.
        </p>
      </LegalSection>

      <LegalSection title="Transferência internacional">
        <p>
          Os serviços acima são de empresas estrangeiras e podem processar dados fora do Brasil, por exemplo nos Estados
          Unidos. Nesses casos, a transferência segue as garantias oferecidas por esses provedores em seus contratos e
          políticas, conforme o art. 33 da LGPD.
        </p>
      </LegalSection>

      <LegalSection title="Por quanto tempo guardamos">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Código derivado do IP:</strong> até 60 segundos, apagado automaticamente.
          </li>
          <li>
            <strong>Cache de dados públicos do YouTube:</strong> até cerca de 25 minutos. Não contém dados de visitantes.
          </li>
          <li>
            <strong>Estatísticas de visitas:</strong> conforme a Vercel. A identificação da visita é descartada após 24
            horas, e os relatórios agregados ficam disponíveis pelo período do plano contratado.
          </li>
          <li>
            <strong>Registros de acesso da hospedagem:</strong> conforme a política da Vercel.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Seus direitos">
        <p>Pela LGPD (art. 18), você pode pedir:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>confirmação de que tratamos dados seus e acesso a eles;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;</li>
          <li>eliminação de dados tratados com base no seu consentimento;</li>
          <li>informação sobre com quem compartilhamos dados;</li>
          <li>informação sobre a possibilidade de não consentir e suas consequências, e revogação do consentimento;</li>
          <li>oposição a tratamento baseado em legítimo interesse, se você entender que ele não cumpre a lei.</li>
        </ul>
        <p>
          Para exercer esses direitos, envie um e-mail para {contact ?? "o contato do site (a definir)"} descrevendo o
          pedido. Responderemos em até 15 dias. Como o site não tem contas nem cadastro e não guarda o seu IP, na maioria
          dos casos não teremos dados que permitam identificar você; nesse caso, informaremos isso na resposta. Para dados
          tratados pelo Google no player ou nas miniaturas, use também os canais do Google. Você também pode apresentar
          reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </LegalSection>

      <LegalSection title="Seus controles">
        <p>
          Você pode assistir sem carregar o player incorporado, usando os links para o YouTube. Para gerenciar dados que o
          Google associa à sua conta, use as configurações de segurança da sua Conta do Google (
          <ExternalLink href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</ExternalLink>
          ).
        </p>
      </LegalSection>

      <LegalSection title="Atualizações desta política">
        <p>
          Esta política vale a partir de{" "}
          <time dateTime={siteConfig.legal.updatedAt}>{dateFmt.format(new Date(`${siteConfig.legal.updatedAt}T00:00:00Z`))}</time>
          . Se o funcionamento do site mudar, atualizaremos este texto e a data no topo da página. Os itens sobre a LGPD
          estão em revisão jurídica e podem ser ajustados.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
