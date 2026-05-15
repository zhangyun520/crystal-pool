import { describe, expect, it } from "vitest";
import {
  assessSoulfulData,
  ethicalInvariants,
  evaluateConstitutionCheck,
  generateConstitutionCheckMarkdown,
} from "@/lib/ethicalKernel";

describe("ethical kernel", () => {
  it("keeps invariant ids unique and covers the core boundaries", () => {
    const ids = ethicalInvariants.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ethicalInvariants.map((item) => item.title)).toEqual(
      expect.arrayContaining([
        "AI non-sovereignty",
        "Canonical review gate",
        "Local proof-chain boundary",
        "No real-money instruments",
        "Soulful data",
        "Hopepunk repair",
      ]),
    );
  });

  it("keeps soulful data as a review signal when provenance or repair is weak", () => {
    const assessment = assessSoulfulData({
      title: "Audience spike",
      body: "A short signal arrived without enough context.",
    });

    expect(assessment.status).toBe("review_signal");
    expect(assessment.canPromoteAutomatically).toBe(false);
    expect(assessment.promotionPolicy).toBe("review_required");
    expect(assessment.weakSignals.map((item) => item.key)).toEqual(
      expect.arrayContaining(["provenance", "repairability"]),
    );
  });

  it("passes the current dependency shape without forbidden chain clients", () => {
    const result = evaluateConstitutionCheck({
      packageJson: {
        dependencies: {
          next: "16.2.6",
          react: "19.2.4",
          zod: "4.4.3",
        },
      },
      sourceTexts: [
        {
          path: "src/lib/responsibilityMaturity.ts",
          text: "canAutoUnlock: false",
        },
      ],
    });

    expect(result.status).toBe("pass");
    expect(generateConstitutionCheckMarkdown(result)).toContain(
      "# Crystal Pool Constitution Check",
    );
  });

  it("fails clearly when wallet, token, RPC, or automatic upload clients appear", () => {
    const result = evaluateConstitutionCheck({
      packageJson: {
        dependencies: {
          ethers: "^6.0.0",
          arweave: "^1.0.0",
        },
      },
    });

    expect(result.status).toBe("fail");
    const marketBoundary = result.results.find(
      (item) => item.invariantId === "CP-ETH-004",
    );
    const proofBoundary = result.results.find(
      (item) => item.invariantId === "CP-ETH-003",
    );
    expect(marketBoundary?.detail).toContain("ethers");
    expect(proofBoundary?.detail).toContain("arweave");
  });

  it("fails when source enables AI mainline auto-unlock or canonical daemon mutation", () => {
    const result = evaluateConstitutionCheck({
      sourceTexts: [
        {
          path: "src/lib/future.ts",
          text: "export const policy = { canAutoUnlock: true, canonicalMutationAllowed: true };",
        },
      ],
    });

    expect(result.status).toBe("fail");
    const aiBoundary = result.results.find(
      (item) => item.invariantId === "CP-ETH-001",
    );
    const canonicalBoundary = result.results.find(
      (item) => item.invariantId === "CP-ETH-002",
    );
    expect(aiBoundary?.detail).toContain("auto-unlock");
    expect(canonicalBoundary?.detail).toContain("canonical");
  });
});
