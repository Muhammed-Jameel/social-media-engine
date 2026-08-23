import { describe, expect, it } from "vitest";
import { loadCanonicalBrandPack, searchBrandEvidence } from "./brand";

describe("brand intelligence", () => {
  it("loads the final green identity and down-ranks historical sources", async () => {
    const pack = await loadCanonicalBrandPack();
    expect((pack["visual-system.yaml"].palette as Record<string, string>).deep).toBe("#003F35");
    const evidence = await searchBrandEvidence("brand identity social design", 12);
    expect(evidence.some((source) => source.authority === "canonical")).toBe(true);
    const firstHistorical = evidence.findIndex((source) => source.authority === "historical");
    const lastCanonical = evidence.map((source) => source.authority).lastIndexOf("canonical");
    expect(firstHistorical === -1 || firstHistorical > lastCanonical).toBe(true);
  });
});

