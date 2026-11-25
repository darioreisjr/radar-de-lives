# 034 — Tarefas

- [x] Levantamento e classificação das ocorrências de "YouTube" (tabela da spec).
- [x] `apiLabel` no mapa; funções de texto em `lib/lives/copy.ts`. (D2)
- [x] `getActivePlatforms()` com a regra do agregador. (D1)
- [x] Metadata, imagem OG, hero, rodapé, aviso de aceite, radar e nota de cobertura usando a lista. (D3, D5)
- [x] `tests/copy.test.ts`: 8 testes. (CA1 a CA4)
- [x] Verificação em 2026-11-25:
  - lint e typecheck: ok;
  - `npm test`: 25 arquivos, 248 testes;
  - `npm run test:e2e`: 62 testes (os textos do YouTube não mudaram);
  - **Build real com `LIVES_PROVIDERS=youtube,twitch` e credenciais falsas:**
    - metadata e texto alternativo da OG: "no YouTube e na Twitch";
    - hero: "encontradas no YouTube e na Twitch" e "na plataforma de origem";
    - rodapé com "A lista também usa a API da Twitch";
  - **Build padrão:** os mesmos trechos idênticos aos de antes, sem a frase da Twitch.
