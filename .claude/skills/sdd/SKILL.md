---
name: sdd
description: Conduza mudanças de software com Spec-Driven Development. Use quando iniciar uma funcionalidade, corrigir um fluxo com impacto relevante, planejar uma fatia de trabalho ou continuar uma implementação com spec, plano e tarefas.
---

# SDD - Spec-Driven Development

Use este processo para transformar requisitos em mudanças pequenas, verificáveis e rastreáveis. A especificação é a fonte de verdade para a fatia atual.

## Princípios

- Investigue o repositório antes de propor mudanças.
- Escreva critérios de aceite observáveis, não objetivos vagos.
- Mantenha escopo limitado à fatia aprovada.
- Não invente comportamento de serviços externos. Consulte documentação oficial vigente.
- Registre premissas e decisões reversíveis na especificação.
- Preserve código, convenções, dados e alterações não relacionadas.
- Faça implementação e verificação antes de marcar uma tarefa como concluída.
- Não marque como concluído o que não foi verificado.

## Onde guardar os artefatos

Para cada mudança significativa, crie uma pasta:

    docs/specs/<id>-<slug>/
      spec.md
      plan.md
      tasks.md

Use IDs sequenciais de três dígitos quando possível, por exemplo 001-foundation, 002-youtube-search, 003-filters. Antes de escolher o ID, verifique os diretórios existentes **e os IDs reservados nas issues abertas** (o corpo de cada issue indica a pasta `docs/specs/<id>-<slug>/`). Em correções simples e localizadas, atualize a spec da funcionalidade relacionada em vez de criar uma pasta desnecessária.

## Fluxo obrigatório

### 1. Descobrir

- Leia CLAUDE.md, README, package.json, arquivos de configuração e partes relevantes do código.
- Confira o estado do Git e preserve trabalho em andamento.
- Identifique framework, gerenciador de pacotes, padrões de arquitetura, lint, typecheck e testes.
- Se o pedido mencionar um arquivo, leia esse arquivo antes de planejar.
- Pesquise documentação oficial para APIs, bibliotecas ou políticas que possam ter mudado.

### 2. Especificar

Crie ou atualize spec.md contendo:

- Contexto e problema.
- Objetivo da fatia.
- Escopo incluído e explicitamente excluído.
- Personas ou fluxos afetados, quando relevante.
- Requisitos funcionais e não funcionais.
- Estados de sucesso, vazio, erro e carregamento.
- Contratos de dados e integrações externas.
- Critérios de aceite numerados e verificáveis.
- Premissas, riscos, dependências e decisões ainda bloqueadas.

Separe fatos confirmados de inferências. Se faltar dado, use uma premissa reversível quando segura e registre-a. Pergunte ao usuário apenas se a decisão bloquear o trabalho ou trouxer impacto relevante.

### 3. Planejar

Crie plan.md com:

- Abordagem técnica alinhada à arquitetura existente.
- Arquivos ou módulos que serão criados ou alterados.
- Sequência de implementação.
- Migrações ou variáveis de ambiente, se houver.
- Estratégia de verificação.
- Riscos e rollback simples quando necessário.

Planeje a menor solução que atende aos critérios. Não introduza abstrações ou dependências para necessidades hipotéticas.

### 4. Decompor

Crie tasks.md como checklist ordenado. Cada item deve ser pequeno, ter resultado observável e apontar os critérios de aceite relacionados. Separe implementação, acessibilidade, integração e verificação quando ajudar a acompanhar o progresso.

### 5. Implementar

- Implemente uma fatia vertical por vez.
- Siga a estrutura e padrões existentes antes de introduzir novos.
- Valide dados em fronteiras externas.
- Trate falhas externas com estados explícitos e mensagens úteis.
- Mantenha segredos no servidor.
- Atualize tasks.md logo após concluir e verificar cada item.
- Se descobrir novo requisito, atualizar spec.md e plan.md antes de ampliar o escopo.

### 6. Verificar

Execute as verificações relevantes disponíveis no projeto, como lint, typecheck, testes e build. Para mudanças de interface, valide responsividade, teclado, foco visível e reduced motion quando possível. Para APIs, valide sucesso, parâmetros inválidos, ausência de configuração e falha do provedor.

Se alguma verificação falhar:
- Investigue a causa.
- Corrija quando estiver dentro do escopo.
- Não remova ou enfraqueça testes para obter um resultado verde.
- Registre bloqueios e resultados reais em tasks.md.

### 7. Encerrar ou continuar

Ao concluir a fatia, confira que os critérios de aceite foram cobertos. Atualize os artefatos para refletir o estado real. Na resposta final, informe mudanças, verificações, limitações e próxima tarefa recomendada.

Se o usuário pedir uma construção maior, complete a fatia atual antes de iniciar a próxima. Use as tasks para retomar o trabalho em outra sessão.

## Regras específicas para Radar de Lives

Valem para todas as plataformas (hoje YouTube, Twitch e Kick):

- Nunca prometer todas as lives. Usar “Lives encontradas”.
- Usar só a API oficial de cada plataforma (YouTube Data API, Twitch Helix); não fazer scraping.
- Confirmar na documentação e nos termos vigentes da plataforma os parâmetros, campos, limites de uso e o tempo máximo de cache permitido (ex.: Developer Agreement da Twitch e Developer Terms da Kick, até 24 h).
- Tratar concurrentViewers como opcional e ausente como null.
- Deduplicar por `id` (`<plataforma>:<sourceId>`). `videoId` é obsoleto.
- Manter chaves, client secrets e tokens exclusivamente no servidor, sem `NEXT_PUBLIC_` e sem logar.
- Cada plataforma é um `LivesProvider` com cache e single-flight próprios; uma falha não derruba as outras (`sources` no payload).
- Cachear para controlar quota e limites e exibir timestamp/stale state.
- Não assumir que uma live continua ativa depois da busca: revalidar em `/api/status/[platform]/[id]` antes de abrir o player.
- Só incorporar com o player oficial da plataforma, sem autoplay, depois do consentimento, e manter sempre o link para a plataforma. Respeitar requisitos do player (ex.: `parent` e 400×300 na Twitch).
- Nova plataforma: ligar e desligar por `LIVES_PROVIDERS`, nova origem na CSP, textos pelo mapa de plataformas e `/privacy` e `/terms` atualizados antes da ativação.
- Mudança no formato de dados em cache: testar com cache no formato antigo.
- Identidade visual deve ser própria, sem assets oficiais não licenciados; selo de plataforma só com texto.
- Respeitar acessibilidade e prefers-reduced-motion.

## Checklist de revisão SDD

Antes de fechar uma fatia, confirme:

- [ ] A spec descreve o comportamento realmente implementado.
- [ ] Critérios de aceite são observáveis e estão cobertos.
- [ ] O plano e tasks refletem o código atual.
- [ ] Não há requisitos inventados nem mudanças fora de escopo.
- [ ] Erros, dados ausentes e limites externos foram considerados.
- [ ] Segredos, acessibilidade e responsividade foram tratados quando aplicável.
- [ ] Verificações executadas e limitações estão registradas.
