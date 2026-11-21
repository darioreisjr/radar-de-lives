import { describe, expect, it } from "vitest";
import { parseLivesQuery } from "@/lib/validation/lives-query";

const p = (qs: string) => parseLivesQuery(new URLSearchParams(qs));

describe("validação de /api/lives (CA4)", () => {
  it("aplica padrões", () => {
    expect(p("")).toEqual({ ok: true, data: { lang: "all", sort: "relevance" } });
  });
  it("aceita valores válidos e apara q", () => {
    const r = p("q=%20gta%20&lang=pt&sort=viewers&pageToken=CDIQAA");
    expect(r).toEqual({ ok: true, data: { q: "gta", lang: "pt", sort: "viewers", pageToken: "CDIQAA" } });
  });
  it.each([
    [`q=${"a".repeat(81)}`],
    ["lang=fr"],
    ["sort=popular"],
    ["pageToken=abc%3Cscript%3E"],
    [`pageToken=${"a".repeat(129)}`],
    ["foo=1"],
    ["lang=pt&lang=en"],
  ])("rejeita %s", (qs) => {
    expect(p(qs).ok).toBe(false);
  });
});
