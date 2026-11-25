/**
 * Substitui o pacote "server-only" nos testes (spec 024 D6). No Next, quem resolve esse
 * import é o próprio framework, que falha o build se o módulo for parar no cliente.
 * No Vitest não há essa resolução, então o módulo vira vazio só aqui.
 */
export {};
