import { z } from "zod";
import { edgeRelations, phases, sourceTypes } from "./domain";
import { defaultPoolIds } from "./pools";

export const backupSchemaVersion = "crystal-pool.backup.v1";

export type BackupTables = {
  nodes: unknown[];
  edges: unknown[];
  tags: unknown[];
  nodeTags: unknown[];
  phaseEvents: unknown[];
};

export type CrystalPoolBackup = BackupTables & {
  schemaVersion: typeof backupSchemaVersion;
  exportedAt: string;
};

export function createBackupDocument(
  tables: BackupTables,
  exportedAt = new Date().toISOString(),
): CrystalPoolBackup {
  return {
    schemaVersion: backupSchemaVersion,
    exportedAt,
    nodes: tables.nodes,
    edges: tables.edges,
    tags: tables.tags,
    nodeTags: tables.nodeTags,
    phaseEvents: tables.phaseEvents,
  };
}

const dateString = z.union([
  z.string().datetime(),
  z.date().transform((date) => date.toISOString()),
]);

const nodeRowSchema = z.object({
  id: z.string().min(1),
  poolId: z.string().min(1).default(defaultPoolIds.canonical),
  title: z.string().min(1),
  body: z.string(),
  phase: z.enum(phases),
  crystallizationScore: z.number().default(0),
  entropyResistance: z.number().default(0),
  publicness: z.number().default(0),
  privateIntensity: z.number().default(0),
  emotionFear: z.number().default(0),
  emotionCuriosity: z.number().default(0),
  emotionJoy: z.number().default(0),
  emotionBoredom: z.number().default(0),
  emotionHa: z.number().default(0),
  sourceType: z.enum(sourceTypes),
  sourceRef: z.string().nullable().optional(),
  archivedAt: dateString.nullable().optional(),
  archiveReason: z.string().nullable().optional(),
  createdAt: dateString,
  updatedAt: dateString,
});

const edgeRowSchema = z.object({
  id: z.string().min(1),
  fromId: z.string().min(1),
  toId: z.string().min(1),
  relation: z.enum(edgeRelations),
  weight: z.number(),
  createdAt: dateString,
});

const tagRowSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: dateString,
});

const nodeTagRowSchema = z.object({
  nodeId: z.string().min(1),
  tagId: z.string().min(1),
  assignedAt: dateString,
});

const phaseEventRowSchema = z.object({
  id: z.string().min(1),
  nodeId: z.string().min(1),
  fromPhase: z.enum(phases).nullable().optional(),
  toPhase: z.enum(phases),
  reason: z.string(),
  createdAt: dateString,
});

export const crystalPoolBackupSchema = z.object({
  schemaVersion: z.literal(backupSchemaVersion),
  exportedAt: dateString,
  nodes: z.array(nodeRowSchema),
  edges: z.array(edgeRowSchema),
  tags: z.array(tagRowSchema),
  nodeTags: z.array(nodeTagRowSchema),
  phaseEvents: z.array(phaseEventRowSchema),
});

export type ParsedCrystalPoolBackup = z.infer<typeof crystalPoolBackupSchema>;

export type BackupTableName =
  | "nodes"
  | "edges"
  | "tags"
  | "nodeTags"
  | "phaseEvents";

export type BackupIntegrityIssue = {
  severity: "error" | "warning";
  table: BackupTableName | "document";
  id?: string;
  message: string;
};

export type BackupIntegrityReport = {
  restorable: boolean;
  counts: Record<BackupTableName, number>;
  activeNodes: number;
  archivedNodes: number;
  errors: BackupIntegrityIssue[];
  warnings: BackupIntegrityIssue[];
};

export type BackupInspectionResult =
  | {
      ok: true;
      backup: ParsedCrystalPoolBackup;
      report: BackupIntegrityReport;
    }
  | {
      ok: false;
      message: string;
      report: BackupIntegrityReport;
    };

export function parseCrystalPoolBackup(input: unknown): ParsedCrystalPoolBackup {
  return crystalPoolBackupSchema.parse(input);
}

function emptyIntegrityReport(): BackupIntegrityReport {
  return {
    restorable: false,
    counts: {
      nodes: 0,
      edges: 0,
      tags: 0,
      nodeTags: 0,
      phaseEvents: 0,
    },
    activeNodes: 0,
    archivedNodes: 0,
    errors: [],
    warnings: [],
  };
}

function duplicateValues(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return Array.from(duplicates);
}

function addDuplicateIdIssues(
  issues: BackupIntegrityIssue[],
  table: BackupTableName,
  ids: string[],
) {
  for (const id of duplicateValues(ids)) {
    issues.push({
      severity: "error",
      table,
      id,
      message: `${table} contains duplicate id "${id}".`,
    });
  }
}

export function inspectCrystalPoolBackup(
  input: unknown,
): BackupInspectionResult {
  const parsed = crystalPoolBackupSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path.length ? firstIssue.path.join(".") : "backup";
    return {
      ok: false,
      message: `Backup shape is invalid at ${path}.`,
      report: {
        ...emptyIntegrityReport(),
        errors: [
          {
            severity: "error",
            table: "document",
            message: firstIssue?.message ?? "Backup shape is invalid.",
          },
        ],
      },
    };
  }

  const backup = parsed.data;
  const errors: BackupIntegrityIssue[] = [];
  const warnings: BackupIntegrityIssue[] = [];
  const nodeIds = new Set(backup.nodes.map((node) => node.id));
  const tagIds = new Set(backup.tags.map((tag) => tag.id));
  const poolIds = new Set<string>(Object.values(defaultPoolIds));

  addDuplicateIdIssues(errors, "nodes", backup.nodes.map((node) => node.id));
  addDuplicateIdIssues(errors, "edges", backup.edges.map((edge) => edge.id));
  addDuplicateIdIssues(errors, "tags", backup.tags.map((tag) => tag.id));
  addDuplicateIdIssues(
    errors,
    "phaseEvents",
    backup.phaseEvents.map((event) => event.id),
  );

  for (const name of duplicateValues(backup.tags.map((tag) => tag.name))) {
    warnings.push({
      severity: "warning",
      table: "tags",
      message: `Multiple tags use the name "${name}".`,
    });
  }

  for (const edge of backup.edges) {
    if (!nodeIds.has(edge.fromId)) {
      errors.push({
        severity: "error",
        table: "edges",
        id: edge.id,
        message: `Edge "${edge.id}" points from missing node "${edge.fromId}".`,
      });
    }
    if (!nodeIds.has(edge.toId)) {
      errors.push({
        severity: "error",
        table: "edges",
        id: edge.id,
        message: `Edge "${edge.id}" points to missing node "${edge.toId}".`,
      });
    }
  }

  for (const node of backup.nodes) {
    if (!poolIds.has(node.poolId)) {
      errors.push({
        severity: "error",
        table: "nodes",
        id: node.id,
        message: `Node "${node.id}" uses unknown pool "${node.poolId}".`,
      });
    }
  }

  for (const nodeTag of backup.nodeTags) {
    if (!nodeIds.has(nodeTag.nodeId)) {
      errors.push({
        severity: "error",
        table: "nodeTags",
        id: nodeTag.nodeId,
        message: `NodeTag points to missing node "${nodeTag.nodeId}".`,
      });
    }
    if (!tagIds.has(nodeTag.tagId)) {
      errors.push({
        severity: "error",
        table: "nodeTags",
        id: nodeTag.tagId,
        message: `NodeTag points to missing tag "${nodeTag.tagId}".`,
      });
    }
  }

  for (const event of backup.phaseEvents) {
    if (!nodeIds.has(event.nodeId)) {
      errors.push({
        severity: "error",
        table: "phaseEvents",
        id: event.id,
        message: `PhaseEvent "${event.id}" points to missing node "${event.nodeId}".`,
      });
    }
  }

  const report: BackupIntegrityReport = {
    restorable: errors.length === 0,
    counts: {
      nodes: backup.nodes.length,
      edges: backup.edges.length,
      tags: backup.tags.length,
      nodeTags: backup.nodeTags.length,
      phaseEvents: backup.phaseEvents.length,
    },
    activeNodes: backup.nodes.filter((node) => !node.archivedAt).length,
    archivedNodes: backup.nodes.filter((node) => node.archivedAt).length,
    errors,
    warnings,
  };

  if (errors.length > 0) {
    return {
      ok: false,
      message: errors[0].message,
      report,
    };
  }

  return {
    ok: true,
    backup,
    report,
  };
}

export function inspectCrystalPoolBackupText(
  input: string,
): BackupInspectionResult {
  let rawBackup: unknown;
  try {
    rawBackup = JSON.parse(input);
  } catch {
    return {
      ok: false,
      message: "Backup JSON could not be parsed.",
      report: {
        ...emptyIntegrityReport(),
        errors: [
          {
            severity: "error",
            table: "document",
            message: "Backup JSON could not be parsed.",
          },
        ],
      },
    };
  }

  return inspectCrystalPoolBackup(rawBackup);
}
