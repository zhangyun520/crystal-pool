import { describe, expect, it } from "vitest";
import {
  buildRepairQueueItems,
  createRepairQueueManifest,
  generateRepairQueueReport,
  repairItemToJiEvent,
  repairItemToSandboxInput,
  type RepairQueueContext,
} from "@/lib/repairQueue";
import { validateJiEvent } from "@/lib/ji";
import { validateSandboxRunInput } from "@/lib/sandbox";

const cleanContext: RepairQueueContext = {
  generatedAt: "2026-05-16T10:00:00.000Z",
  constitutionStatus: "pass",
  constitutionWarn: 0,
  constitutionFail: 0,
  aestheticSmokeStatus: "pass",
  aestheticSmokeFailed: 0,
  aiFailedOrSkippedCycles: 0,
  aiInvalidDecisions: 0,
  jiInboxErrors: 0,
  corpusWarnings: 0,
  sandboxProposedLearnings: 0,
};

describe("hopepunk repair queue", () => {
  it("stays active as a readiness mechanism when no repair signal is present", () => {
    const items = buildRepairQueueItems(cleanContext);
    const manifest = createRepairQueueManifest({
      runId: "repair-test",
      generatedAt: cleanContext.generatedAt,
      items,
    });

    expect(items).toEqual([]);
    expect(manifest).toMatchObject({
      mode: "hopepunk_repair_queue",
      status: "pass",
      canonicalMutationAllowed: false,
    });
  });

  it("turns failures and warnings into review-gated repair proposals", () => {
    const items = buildRepairQueueItems({
      ...cleanContext,
      constitutionStatus: "warn",
      constitutionWarn: 1,
      aestheticSmokeStatus: "fail",
      aestheticSmokeFailed: 2,
      aiFailedOrSkippedCycles: 3,
      sandboxProposedLearnings: 4,
    });
    const manifest = createRepairQueueManifest({
      runId: "repair-test",
      generatedAt: cleanContext.generatedAt,
      items,
      jiEventsWritten: items.length,
      sandboxRunsCreated: 1,
    });

    expect(items.map((item) => item.sourceKind)).toEqual([
      "constitution_warning",
      "aesthetic_smoke_failure",
      "ai_cycle_failure",
      "sandbox_learning_followup",
    ]);
    expect(manifest).toMatchObject({
      status: "watch",
      items: 4,
      jiEventsWritten: 4,
      sandboxRunsCreated: 1,
    });
  });

  it("serializes repair items into JiEvents and sandbox runs without canonical promotion", () => {
    const [item] = buildRepairQueueItems({
      ...cleanContext,
      aiInvalidDecisions: 1,
    });
    const event = repairItemToJiEvent({
      item,
      runId: "repair-test",
      occurredAt: cleanContext.generatedAt,
    });
    const sandboxInput = repairItemToSandboxInput(item, event.id);

    expect(validateJiEvent(event)).toMatchObject({
      sourceProject: "crystal-pool",
      kind: "manual.note",
      suggestedPhase: "seed",
    });
    expect(event.body).toContain("Candidate kind: hopepunk_repair_signal");
    expect(event.body).toContain("cannot promote canonical pool state");
    expect(validateSandboxRunInput(sandboxInput)).toMatchObject({
      mode: "SONATA",
      worldlineKey: "HOPEPUNK_REPAIR",
      sourceJiEventIds: [event.id],
    });
  });

  it("generates a Markdown report with the repair boundary", () => {
    const items = buildRepairQueueItems({
      ...cleanContext,
      jiInboxErrors: 1,
    });
    const manifest = createRepairQueueManifest({
      runId: "repair-test",
      generatedAt: cleanContext.generatedAt,
      items,
    });
    const report = generateRepairQueueReport({
      manifest,
      context: cleanContext,
      items,
    });

    expect(report).toContain("# Crystal Pool Hopepunk Repair Queue");
    expect(report).toContain("ji_inbox_error");
    expect(report).toContain("does not promote canonical pool state");
  });
});
