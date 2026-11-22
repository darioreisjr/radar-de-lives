import type { Metadata } from "next";
import Link from "next/link";
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
          Esta política explica como o {siteConfig.name} trata dados quando você acessa {siteConfig.url}. O{" "}
          {siteConfig.name} é um diretório gratuito e independente de transmissões públicas de GTA 6 no YouTube. Não tem
          conta, login, cadastro, pagamento nem publicidade própria, e não usa cookies próprios.
        </p>
        <p>
          Para mostrar as lives, o site usa os <strong>YouTube API Services</strong>, serviços do Google. Antes de liberar a
          lista de lives, o site pede que você leia e concorde com esta política e com os{" "}
          <Link href="/terms" className="text-accent-cyan underline underline-offset-2">
            Termos de Uso
          </Link>
          , como exigem as políticas do YouTube. Essa concordância não é um consentimento para todo tratamento descrito aqui
          nem para o que o Google faz com os dados.
        </p>
      </LegalSection>

      <LegalSection title="Controlador e contato">
        <p>
          O controlador dos dados tratados pelo {siteConfig.name} é <strong>{controller}</strong>, pessoa física responsável
          pelo projeto. Para dúvidas, pedidos sobre dados pessoais ou exercício dos seus direitos, escreva para{" "}
          <a href={`mailto:${contact}`} className="text-accent-cyan underline underline-offset-2">
            {contact}
          </a>
          . Esse é o canal de comunicação com os titulares; o projeto não tem um encarregado (DPO) nomeado separadamente.
        </p>
      </LegalSection>

      <LegalSection title="Uso dos YouTube API Services">
        <p>
          O servidor do site consulta a YouTube Data API v3 para encontrar transmissões públicas ao vivo e exibe apenas
          metadados públicos retornados por ela: título, canal, miniatura, horário de início e, quando o canal permite,
          número de espectadores.
        </p>
        <p>
          O uso do YouTube está sujeito aos <ExternalLink href={YOUTUBE_TERMS}>Termos de Serviço do YouTube</ExternalLink>,
          e o tratamento de dados pelo Google segue a{" "}
          <ExternalLink href={GOOGLE_PRIVACY}>Política de Privacidade do Google</ExternalLink>.
        </p>
      </LegalSection>

      <LegalSection title="Dados tratados, finalidades e bases legais">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong>Segurança e limite de requisições.</strong> O site usa o endereço IP de cada requisição para limitar
            abusos a 30 consultas por minuto. O IP não é gravado: o site guarda apenas um código derivado dele por função
            de hash com chave secreta (HMAC-SHA256), que não permite recuperar o endereço sem essa chave. Esse código fica
            no Upstash Redis por até 60 segundos e é apagado automaticamente. O código continua sendo um dado
            pseudonimizado, não anônimo. Finalidade: proteger a disponibilidade do site e prevenir abuso. Base legal:
            legítimo interesse do controlador em segurança (art. 7º, IX, da LGPD).
          </li>
          <li>
            <strong>Busca e cache das transmissões.</strong> Os metadados públicos das lives ficam em cache no Upstash Redis
            por 15 minutos e, como dado antigo, por até cerca de 25 minutos no total, para reduzir consultas ao YouTube.
            Esse cache não contém dados de quem visita o site.
          </li>
          <li>
            <strong>Registros técnicos.</strong> O site registra eventos de funcionamento (por exemplo, consultas ao YouTube
            e falhas) sem IP nem dados pessoais. A Vercel, que hospeda o site, recebe o IP de cada requisição e pode
            manter registros de acesso próprios, conforme os serviços e prazos dela.
          </li>
          <li>
            <strong>Aceite da política.</strong> Quando você seleciona &ldquo;Li e concordo&rdquo;, o navegador guarda no
            armazenamento local (<code>localStorage</code>) apenas a versão da política aceita e a data do aceite. Essa
            informação não é enviada ao servidor. Se você limpar os dados do navegador, usar outro navegador ou a política
            mudar, o site pede o aceite de novo.
          </li>
          <li>
            <strong>Filtros e preferências.</strong> Ficam só na página aberta e são perdidos ao recarregar. Não são
            gravados em cookies nem no navegador.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Estatísticas de visitas">
        <p>
          Usamos o Vercel Web Analytics para saber quantas pessoas visitam o site e quais páginas são vistas. O site envia
          só visualizações de página, sem eventos personalizados nem identificação de usuário, e remove os parâmetros de
          busca do endereço antes do envio. Para cada página vista, a Vercel registra: horário, endereço da página, página
          de origem (referrer), país, região e cidade aproximados, sistema operacional, navegador e tipo de dispositivo.
        </p>
        <p>
          Segundo a Vercel, esses dados são anônimos, não ficam associados ao seu endereço IP, não usam cookies e a
          identificação da visita (um código gerado a partir da requisição) é descartada após 24 horas. As estatísticas
          funcionam também nas páginas de política e termos, antes do aceite. Mais detalhes na{" "}
          <ExternalLink href="https://vercel.com/docs/analytics/privacy-policy">
            documentação de privacidade do Vercel Web Analytics
          </ExternalLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="Conteúdo carregado do Google">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Miniaturas:</strong> depois do aceite, as imagens das lives são carregadas diretamente dos servidores do
            YouTube (i.ytimg.com). Nessa conexão, o Google recebe o seu IP e dados técnicos da requisição.
          </li>
          <li>
            <strong>Player incorporado:</strong> o player do YouTube não é carregado automaticamente. Ele só abre depois
            que você seleciona &ldquo;Carregar player&rdquo;. A partir daí, o YouTube pode usar cookies e tratar dados
            conforme os termos e a política do Google.
          </li>
          <li>
            <strong>Links para o YouTube:</strong> &ldquo;Assistir no YouTube&rdquo; abre o site do YouTube em nova aba.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Fornecedores e compartilhamento">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Vercel:</strong> hospedagem, registros técnicos da hospedagem e estatísticas de visitas (
            <ExternalLink href="https://vercel.com/legal/privacy-notice">política da Vercel</ExternalLink>).
          </li>
          <li>
            <strong>Upstash:</strong> armazenamento temporário do cache e dos códigos do limite de requisições (
            <ExternalLink href="https://upstash.com/privacy">política da Upstash</ExternalLink>).
          </li>
          <li>
            <strong>Google/YouTube:</strong> fornece os dados públicos das lives pela API (o servidor do site não envia
            dados de visitantes nessa consulta), as miniaturas e o player. Quando seu navegador carrega miniaturas ou o
            player, o Google recebe dados diretamente de você e os trata como controlador, conforme a{" "}
            <ExternalLink href={GOOGLE_PRIVACY}>Política de Privacidade do Google</ExternalLink>.
          </li>
        </ul>
        <p>
          Esses fornecedores tratam dados conforme seus contratos e políticas. O site não vende dados pessoais nem os
          compartilha para publicidade. Dados também podem ser fornecidos quando houver obrigação legal ou ordem de
          autoridade competente.
        </p>
      </LegalSection>

      <LegalSection title="Transferência internacional">
        <p>
          As funções do site na Vercel e o banco Upstash Redis estão configurados na região de Washington, D.C., nos
          Estados Unidos. Por isso o IP, o código derivado dele e os registros técnicos são tratados nos Estados Unidos. O
          Google trata os dados das miniaturas e do player na infraestrutura global dele. Essas transferências ocorrem
          sob os contratos e as garantias de proteção de dados oferecidos por cada fornecedor, indicados acima.
        </p>
      </LegalSection>

      <LegalSection title="Retenção">
        <ul className="list-disc space-y-2 pl-5">
          <li>Código do limite de requisições: até 60 segundos.</li>
          <li>Cache de metadados públicos das lives: 15 minutos, mais até cerca de 10 minutos como dado antigo.</li>
          <li>
            Estatísticas de visitas: a identificação da visita é descartada em 24 horas; os relatórios agregados ficam
            disponíveis pelo período do plano da Vercel.
          </li>
          <li>Registros técnicos da hospedagem: pelos prazos definidos pela Vercel.</li>
          <li>Aceite da política: no seu navegador, até você apagar os dados do site ou a política mudar.</li>
        </ul>
        <p>
          Terminada a finalidade, os dados são eliminados ou mantidos apenas quando a lei permitir. Estatísticas agregadas
          e anônimas podem ser mantidas.
        </p>
      </LegalSection>

      <LegalSection title="Seus direitos">
        <p>
          Pelo art. 18 da LGPD, você pode pedir: confirmação de que há tratamento; acesso aos dados; correção;
          anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;
          informação sobre compartilhamento; informação sobre a possibilidade de não consentir e suas consequências;
          revogação do consentimento, quando aplicável; e oposição a tratamento irregular.
        </p>
        <p>
          Envie o pedido para <strong>{contact}</strong>. Podemos pedir informações razoáveis para confirmar sua identidade.
          Como o site não tem cadastro e o código do limite de requisições dura até 60 segundos, pode não haver registro a
          localizar depois desse prazo. Você também pode apresentar petição à{" "}
          <ExternalLink href="https://www.gov.br/anpd/">Autoridade Nacional de Proteção de Dados (ANPD)</ExternalLink>.
        </p>
      </LegalSection>

      <LegalSection title="Seus controles">
        <p>
          Você pode assistir sem carregar o player incorporado, usando os links para o YouTube. Para apagar o aceite, limpe
          os dados deste site no seu navegador. Para gerenciar dados que o Google associa à sua conta, use as configurações
          de segurança da sua Conta do Google (
          <ExternalLink href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</ExternalLink>
          ).
        </p>
      </LegalSection>

      <LegalSection title="Segurança">
        <p>
          Adotamos medidas compatíveis com a natureza e o volume dos dados: minimização, retenção curta do código do limite
          de requisições, chave secreta fora do código e fornecedores de infraestrutura com controle de acesso. Nenhum
          sistema na internet é totalmente seguro. Em caso de incidente com risco ou dano relevante, faremos as
          comunicações exigidas pela lei.
        </p>
      </LegalSection>

      <LegalSection title="Crianças e adolescentes">
        <p>
          O site não pede cadastro nem dados pessoais de crianças ou adolescentes. Se você acredita que dados de uma
          criança ou adolescente foram tratados de forma inadequada, escreva para {contact}.
        </p>
      </LegalSection>

      <LegalSection title="Alterações e vigência">
        <p>
          Esta política pode mudar para refletir alterações no site, nos fornecedores, no tratamento de dados ou na lei. A
          versão vigente fica nesta página e vale a partir de{" "}
          <time dateTime={siteConfig.legal.updatedAt}>{dateFmt.format(new Date(`${siteConfig.legal.updatedAt}T00:00:00Z`))}</time>
          . Quando a política
          muda, o site pede o aceite de novo antes de liberar a lista de lives. Esta política segue a legislação brasileira,
          inclusive a Lei nº 13.709/2018 (LGPD).
        </p>
      </LegalSection>
    </LegalPage>
  );
}
