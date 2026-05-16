import { describe, expect, it } from "vitest";
import {
  buildSoulfulDataRedressPacket,
  createSoulfulDataRedressManifest,
  generateSoulfulDataRedressReport,
  redressPacketToJiEvent,
  redressPacketToRfcDraft,
  redressPacketToSandboxInput,
  selectSoulfulDataRedressPackets,
  type SoulfulDataRedressPacket,
} from "@/lib/soulfulDataRedress";
import { validateJiEvent, type JiEvent } from "@/lib/ji";
import { validateSandboxRunInput } from "@/lib/sandbox";

const weakChromeEvent: JiEvent & { status: string; createdAt: string } = {
  id: "ji-weak-chrome",
  sourceProject: "chrome",
  kind: "manual.note",
  title: "Captured platform dashboard fragment",
  body: "A terse authenticated dashboard note without enough provenance or repair path.",
  occurredAt: "2026-05-16T10:00:00.000Z",
  status: "pending",
  createdAt: "2026-05-16T10:01:00.000Z",
};

const strongerEvent: JiEvent & { status: string; createdAt: string } = {
  id: "ji-strong",
  sourceProject: "network",
  kind: "memory.learned",
  title: "Public essay with provenance",
  body: [
    "Domain: PHILOSOPHY_AESTHETICS",
    "Candidate kind: soulful_data_signal",
    "Proposal kind: ETHICAL_INVARIANT_PROPOSAL",
    "This public source includes context, provenance, review questions, and repair language for human reviewers.",
  ].join("\n"),
  occurredAt: "2026-05-16T10:05:00.000Z",
  refs: [{ label: "source", href: "https://example.com/soulful-data" }],
  status: "pending",
  createdAt: "2026-05-16T10:06:00.000Z",
};

describe("soulful-data redress packets", () => {
  it("builds a review-only redress packet for weak signals", () => {
    const packet = buildSoulfulDataRedressPacket({
      event: weakChromeEvent,
      generatedAt: "2026-05-16T10:10:00.000Z",
    });

    expect(packet.status).not.toBe("not_required");
    expect(packet.sourceJiEventId).toBe("ji-weak-chrome");
    expect(packet.canonicalMutationAllowed).toBe(false);
    expect(packet.requestedActions).toContain("restore_provenance");
    expect(packet.requestedActions).toContain("clarify_consent");
    expect(packet.acceptanceCheck).toContain("Before any canonical import");
  });

  it("selects the weakest pending events first", () => {
    const packets = selectSoulfulDataRedressPackets({
      events: [strongerEvent, weakChromeEvent],
      generatedAt: "2026-05-16T10:10:00.000Z",
      maxPackets: 2,
    });

    expect(packets[0].sourceJiEventId).toBe("ji-weak-chrome");
    expect(packets.every((packet) => packet.status !== "not_required")).toBe(true);
  });

  it("serializes packets into JiEvent, Sandbox input, RFC draft, and report", () => {
    const packet: SoulfulDataRedressPacket = buildSoulfulDataRedressPacket({
      event: weakChromeEvent,
      generatedAt: "2026-05-16T10:10:00.000Z",
    });
    const event = validateJiEvent(
      redressPacketToJiEvent({ packet, runId: "redress-test" }),
    );
    const sandbox = validateSandboxRunInput(
      redressPacketToSandboxInput(packet, event.id),
    );
    const manifest = createSoulfulDataRedressManifest({
      runId: "redress-test",
      generatedAt: packet.generatedAt,
      packets: [packet],
      jiEventsWritten: 1,
      sandboxRunsCreated: 1,
    });
    const rfc = redressPacketToRfcDraft(packet);
    const report = generateSoulfulDataRedressReport({
      manifest,
      packets: [packet],
    });

    expect(event.body).toContain("Candidate kind: soulful_data_redress_packet");
    expect(event.body).toContain("cannot promote canonical pool state");
    expect(sandbox.mode).toBe("FUGUE");
    expect(sandbox.worldlineKey).toBe("OTHERNESS_MIRROR");
    expect(rfc).toContain("does not create canonical nodes");
    expect(report).toContain("# Crystal Pool Soulful Data Redress Packets");
    expect(report).toContain("must not promote canonical pool state");
  });
});
