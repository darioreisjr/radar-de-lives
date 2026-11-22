import { describe, expect, it } from "vitest";
import {
  POLICY_STORAGE_KEY,
  POLICY_VERSION,
  isAccepted,
  readAcceptance,
  serializeAcceptance,
  writeAcceptance,
} from "@/lib/consent/policy-acceptance";
import { siteConfig } from "@/lib/config/site";

function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

describe("aceite da política (spec 016)", () => {
  it("a versão é a data de atualização das páginas legais", () => {
    expect(POLICY_VERSION).toBe(siteConfig.legal.updatedAt);
  });

  it("sem valor guardado, não há aceite", () => {
    expect(isAccepted(null)).toBe(false);
    expect(isAccepted("")).toBe(false);
  });

  it("aceita o valor gravado para a versão vigente", () => {
    expect(isAccepted(serializeAcceptance(POLICY_VERSION, new Date("2026-11-22T12:00:00Z")))).toBe(true);
  });

  it("pede novo aceite quando a versão muda (CA1)", () => {
    expect(isAccepted(serializeAcceptance("2000-01-01"), "2026-11-22")).toBe(false);
  });

  it("ignora valores corrompidos ou incompletos", () => {
    expect(isAccepted("não é json")).toBe(false);
    expect(isAccepted("null")).toBe(false);
    expect(isAccepted(JSON.stringify({ version: POLICY_VERSION }))).toBe(false);
    expect(isAccepted(JSON.stringify({ version: POLICY_VERSION, acceptedAt: "ontem" }))).toBe(false);
  });

  it("guarda só a versão e a data do aceite (CA3)", () => {
    const s = memoryStorage();
    expect(writeAcceptance(s, new Date("2026-11-22T12:00:00Z"))).toBe(true);
    expect(JSON.parse(s.map.get(POLICY_STORAGE_KEY)!)).toEqual({
      version: POLICY_VERSION,
      acceptedAt: "2026-11-22T12:00:00.000Z",
    });
    expect(readAcceptance(s)).toBe(true);
  });

  it("não quebra quando o navegador bloqueia o armazenamento", () => {
    const blocked = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(readAcceptance(blocked)).toBe(false);
    expect(writeAcceptance(blocked)).toBe(false);
    expect(readAcceptance(undefined)).toBe(false);
    expect(writeAcceptance(undefined)).toBe(false);
  });
});
