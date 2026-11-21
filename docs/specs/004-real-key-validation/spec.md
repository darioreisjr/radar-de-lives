# 004 — Validação com chave real e calibração do idioma

Status: implementada e verificada · Data: 2026-11-21
Fonte: [003 tasks](../003-launch-readiness/tasks.md) (próxima fatia), PRD §3 P0-6 ("idioma estimado").

## 1. Contexto

O usuário configurou `YOUTUBE_API_KEY` em `.env.local` e confirmou que lives reais aparecem. A análise foi feita lendo `GET /api/lives` **do cache** do servidor do usuário (sem gastar quota).

## 2. Observações com dados reais (2026-11-21, 1 página, 50 itens)

| Item | Resultado |
| --- | --- |
| Itens | 50 (`maxResults=50`), `nextPageToken` presente |
| Duplicatas | 0 (50 IDs únicos) |
| Relevância | 50/50 citam GTA 6/VI/Grand Theft Auto VI no título ou descrição |
| `concurrentViewers` | 6 `null`, 0 zeros falsos |
| Miniatura / início | 50/50 com miniatura e `liveStartedAt` |
| `embedAllowed` | 50/50 `true` |
| Idioma estimado | pt 14 · en 33 · es 2 · outro 1 |
| UI | 50 cards, sem rolagem horizontal, "do cache", "Carregar mais" visível |

**Problema encontrado:** `en` vem só de metadados (`defaultAudioLanguage`/`defaultLanguage`), pois a heurística por título nunca devolve `en`. Muitos criadores deixam o padrão "en": títulos claramente em português ("GTA 6 AO VIVO 🔥 | EXPLORANDO") e transmissões que se declaram em hindi/télugo aparecem como "Inglês".

## 3. Objetivo

Reduzir classificações erradas de idioma sem prometer precisão: o rótulo continua "estimado".

## 4. Decisões

- **D1 — Metadado "en" é fraco.** Se o metadado diz `en` e o título tem pista forte de pt ou es, vence o título.
- **D2 — Metadados pt/es continuam valendo** (raramente são deixados por acaso).
- **D3 — Outros idiomas explícitos viram "Outro".** Título que cita o idioma (hindi, télugo, tâmil, urdu, bengali, marathi, malaiala, canarês, árabe) ou usa escrita não latina (árabe, devanágari e demais índicas, cirílico, CJK, coreano, tailandês) → `unknown`, mesmo com metadado `en`. "India" sozinho **não** conta (é lugar, não idioma).
- **D4 — Metadado de idioma não suportado** (ex.: `hi`, `ar`) → `unknown`, em vez de cair para a heurística.
- **D5 — Pistas ambíguas não decidem**: palavras comuns a pt e es (ex.: "explorando", "historia") não são usadas.
- **D6 — Testes com títulos sintéticos** que imitam os padrões observados; não versionamos títulos reais de terceiros.

## 5. Critérios de aceite

1. **CA1** metadado `en` + título com "ao vivo"/"jogando"/"zerando" → `pt`.
2. **CA2** metadado `en` + título com "en vivo"/"en directo" → `es`.
3. **CA3** metadado `en` + "hindi"/"telugu" no título ou escrita não latina → `unknown`.
4. **CA4** metadado `hi` → `unknown`; metadado `pt-BR` → `pt` mesmo com título em inglês.
5. **CA5** "India" sozinho não muda o resultado.
6. **CA6** Reaplicando a regra aos 50 itens observados (assumindo metadado `en` onde o rótulo era `en`), os casos de pt e hindi/télugo citados em §2 mudam; nenhum item pt/es muda.
7. **CA7** lint, typecheck, testes e build passam.

## 6. Resultado (CA6)

Reaplicando aos 50 itens: pt 14→15, en 33→29, outro 1→4, es 2→2. Mudaram 4 itens, todos corretos: 1 título em português com metadado "en" → pt; 3 títulos que declaram télugo/hindi → Outro. Nenhum item pt/es mudou.

Observação: o idioma é calculado na normalização e fica no cache. Os rótulos novos aparecem na próxima consulta ao YouTube (até 15 min) ou ao reiniciar o servidor.

## 7. Fora do escopo / pendente

- Medir a quota real por atualização: depende dos logs `youtube_call` no terminal do usuário (telemetria da 003).
- Ampliar ou trocar `LIVE_SEARCH_TERMS`: a amostra mostrou 100% de relevância; sem evidência para mudar.
- Player com live real: o usuário pode testar "Assistir aqui" (gasta 1 unidade de `videos.list`, do bucket de 10.000).
