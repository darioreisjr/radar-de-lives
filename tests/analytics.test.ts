import { describe, expect, it } from "vitest";
import { stripQuery } from "@/lib/analytics";

describe("stripQuery (spec 006 CA1)", () => {
  it("remove query string e fragmento, mantendo o caminho", () => {
    expect(stripQuery({ type: "pageview" as const, url: "https://radardelives.darioreis.dev/privacy?q=gta&x=1#topo" })).toEqual({
      type: "pageview",
      url: "https://radardelives.darioreis.dev/privacy",
    });
  });
  it("não altera URL sem query", () => {
    expect(stripQuery({ url: "https://radardelives.darioreis.dev/" }).url).toBe("https://radardelives.darioreis.dev/");
  });
  it("aceita URL relativa", () => {
    expect(stripQuery({ url: "/terms?ref=abc" }).url).toBe("/terms");
  });
});
