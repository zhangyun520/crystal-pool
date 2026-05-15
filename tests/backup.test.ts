import { describe, expect, it } from "vitest";
import {
  backupSchemaVersion,
  createBackupDocument,
  inspectCrystalPoolBackup,
  inspectCrystalPoolBackupText,
  parseCrystalPoolBackup,
} from "@/lib/backup";
import { defaultPoolIds } from "@/lib/pools";

describe("createBackupDocument", () => {
  it("creates the complete export shape and keeps archived nodes", () => {
    const backup = createBackupDocument(
      {
        nodes: [
          { id: "active", title: "active node", archivedAt: null },
          {
            id: "archived",
            title: "archived node",
            archivedAt: "2026-05-12T00:00:00.000Z",
          },
        ],
        edges: [{ id: "edge" }],
        tags: [{ id: "tag" }],
        nodeTags: [{ nodeId: "active", tagId: "tag" }],
        phaseEvents: [{ id: "event", nodeId: "archived" }],
      },
      "2026-05-12T01:02:03.000Z",
    );

    expect(backup).toMatchObject({
      schemaVersion: backupSchemaVersion,
      exportedAt: "2026-05-12T01:02:03.000Z",
    });
    expect(backup.nodes).toHaveLength(2);
    expect(backup.nodes).toContainEqual(
      expect.objectContaining({ id: "archived" }),
    );
    expect(backup).toHaveProperty("edges");
    expect(backup).toHaveProperty("tags");
    expect(backup).toHaveProperty("nodeTags");
    expect(backup).toHaveProperty("phaseEvents");
  });

  it("validates a restore-ready backup document", () => {
    const backup = createBackupDocument(
      {
        nodes: [
          {
            id: "node",
            title: "meaning",
            body: "body",
            phase: "seed",
            crystallizationScore: 42,
            entropyResistance: 3,
            publicness: 4,
            privateIntensity: 5,
            emotionFear: 0,
            emotionCuriosity: 6,
            emotionJoy: 2,
            emotionBoredom: 0,
            emotionHa: 1,
            sourceType: "manual",
            sourceRef: null,
            archivedAt: null,
            archiveReason: null,
            createdAt: "2026-05-12T01:02:03.000Z",
            updatedAt: "2026-05-12T01:02:03.000Z",
          },
        ],
        edges: [],
        tags: [
          {
            id: "tag",
            name: "meaning",
            createdAt: "2026-05-12T01:02:03.000Z",
          },
        ],
        nodeTags: [
          {
            nodeId: "node",
            tagId: "tag",
            assignedAt: "2026-05-12T01:02:03.000Z",
          },
        ],
        phaseEvents: [
          {
            id: "event",
            nodeId: "node",
            fromPhase: null,
            toPhase: "seed",
            reason: "restore test",
            createdAt: "2026-05-12T01:02:03.000Z",
          },
        ],
      },
      "2026-05-12T01:02:03.000Z",
    );

    const parsed = parseCrystalPoolBackup(backup);
    expect(parsed.nodes[0].phase).toBe("seed");
    expect(parsed.nodes[0].poolId).toBe(defaultPoolIds.canonical);
    const inspection = inspectCrystalPoolBackup(backup);
    expect(inspection.ok).toBe(true);
    expect(inspection.report).toMatchObject({
      restorable: true,
      activeNodes: 1,
      archivedNodes: 0,
    });
  });

  it("rejects backup documents with the wrong schema version", () => {
    expect(() =>
      parseCrystalPoolBackup({
        schemaVersion: "wrong",
        exportedAt: "2026-05-12T01:02:03.000Z",
        nodes: [],
        edges: [],
        tags: [],
        nodeTags: [],
        phaseEvents: [],
      }),
    ).toThrow();
  });

  it("dry-runs pasted backup text before restore", () => {
    const result = inspectCrystalPoolBackupText("{bad json");

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected invalid backup text.");
    expect(result.message).toBe("Backup JSON could not be parsed.");
    expect(result.report.restorable).toBe(false);
    expect(result.report.counts.nodes).toBe(0);
  });

  it("reports broken references before restore", () => {
    const backup = createBackupDocument(
      {
        nodes: [
          {
            id: "node",
            title: "meaning",
            body: "body",
            phase: "seed",
            crystallizationScore: 42,
            entropyResistance: 3,
            publicness: 4,
            privateIntensity: 5,
            emotionFear: 0,
            emotionCuriosity: 6,
            emotionJoy: 2,
            emotionBoredom: 0,
            emotionHa: 1,
            sourceType: "manual",
            sourceRef: null,
            archivedAt: "2026-05-12T01:02:03.000Z",
            archiveReason: "test",
            createdAt: "2026-05-12T01:02:03.000Z",
            updatedAt: "2026-05-12T01:02:03.000Z",
          },
        ],
        edges: [
          {
            id: "edge",
            fromId: "node",
            toId: "missing",
            relation: "resonates_with",
            weight: 1,
            createdAt: "2026-05-12T01:02:03.000Z",
          },
        ],
        tags: [],
        nodeTags: [
          {
            nodeId: "node",
            tagId: "missing-tag",
            assignedAt: "2026-05-12T01:02:03.000Z",
          },
        ],
        phaseEvents: [
          {
            id: "event",
            nodeId: "missing",
            fromPhase: null,
            toPhase: "seed",
            reason: "restore test",
            createdAt: "2026-05-12T01:02:03.000Z",
          },
        ],
      },
      "2026-05-12T01:02:03.000Z",
    );

    const inspection = inspectCrystalPoolBackup(backup);

    expect(inspection.ok).toBe(false);
    expect(inspection.report.restorable).toBe(false);
    expect(inspection.report.archivedNodes).toBe(1);
    expect(inspection.report.errors.map((issue) => issue.table)).toContain(
      "edges",
    );
    expect(inspection.report.errors.map((issue) => issue.table)).toContain(
      "phaseEvents",
    );
  });

  it("rejects nodes from unknown pool ids", () => {
    const backup = createBackupDocument(
      {
        nodes: [
          {
            id: "node",
            poolId: "pool_unknown",
            title: "meaning",
            body: "body",
            phase: "seed",
            crystallizationScore: 42,
            entropyResistance: 3,
            publicness: 4,
            privateIntensity: 5,
            emotionFear: 0,
            emotionCuriosity: 6,
            emotionJoy: 2,
            emotionBoredom: 0,
            emotionHa: 1,
            sourceType: "manual",
            sourceRef: null,
            archivedAt: null,
            archiveReason: null,
            createdAt: "2026-05-12T01:02:03.000Z",
            updatedAt: "2026-05-12T01:02:03.000Z",
          },
        ],
        edges: [],
        tags: [],
        nodeTags: [],
        phaseEvents: [],
      },
      "2026-05-12T01:02:03.000Z",
    );

    const inspection = inspectCrystalPoolBackup(backup);

    expect(inspection.ok).toBe(false);
    expect(inspection.report.errors).toContainEqual(
      expect.objectContaining({ table: "nodes" }),
    );
  });
});
