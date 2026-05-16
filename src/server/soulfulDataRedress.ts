import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  createSoulfulDataRedressManifest,
  generateSoulfulDataRedressReport,
  redressPacketToJiEvent,
  redressPacketToRfcDraft,
  redressPacketToSandboxInput,
  selectSoulfulDataRedressPackets,
  type SoulfulDataRedressManifest,
  type SoulfulDataRedressPacket,
  type SoulfulDataRedressRunSummary,
} from "@/lib/soulfulDataRedress";
import { completeSandboxRun, runSandboxProtocol } from "./sandbox";
import { listPendingJiEvents, writeJiEventToInbox } from "./ji";

export const soulfulDataRedressRunsDir = path.join(
  process.cwd(),
  "data",
  "ecosystem",
  "soulful-data-redress",
);

export type SoulfulDataRedressRunResult = SoulfulDataRedressRunSummary & {
  runId: string;
  runDir: string;
  jiEventIds: string[];
  sandboxRunIds: string[];
};

async function safeReadText(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

function parseJson<T>(text?: string): T | undefined {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

function jsonl(values: unknown[]) {
  return values.length
    ? `${values.map((value) => JSON.stringify(value)).join("\n")}\n`
    : "";
}

function runIdFromDate(date = new Date()) {
  return `soulful-data-redress-${date.toISOString().replace(/[:.]/g, "-")}`;
}

export async function runSoulfulDataRedressPackets({
  runId = runIdFromDate(),
  writeJiEvents = true,
  createSandboxes = false,
  maxPackets = 8,
  maxSandboxRuns = 4,
}: {
  runId?: string;
  writeJiEvents?: boolean;
  createSandboxes?: boolean;
  maxPackets?: number;
  maxSandboxRuns?: number;
} = {}): Promise<SoulfulDataRedressRunResult> {
  await mkdir(soulfulDataRedressRunsDir, { recursive: true });
  const runDir = path.join(soulfulDataRedressRunsDir, runId);
  await mkdir(runDir, { recursive: true });

  const generatedAt = new Date().toISOString();
  const events = await listPendingJiEvents({ take: Math.max(maxPackets * 4, 24) });
  const packets = selectSoulfulDataRedressPackets({
    events,
    generatedAt,
    maxPackets,
  });
  const jiEvents = packets.map((packet) =>
    redressPacketToJiEvent({ packet, runId }),
  );
  const sandboxInputs = packets.map((packet, index) =>
    redressPacketToSandboxInput(packet, jiEvents[index]?.id),
  );
  const rfcDrafts = packets.map(redressPacketToRfcDraft);

  if (writeJiEvents) {
    for (const event of jiEvents) {
      await writeJiEventToInbox(event, { fileName: "soulful-data-redress" });
    }
  }

  const sandboxRunIds: string[] = [];
  if (createSandboxes) {
    for (const input of sandboxInputs.slice(0, maxSandboxRuns)) {
      const run = await runSandboxProtocol(input);
      const completed =
        run.status === "completed" ? run : await completeSandboxRun(run.id, {});
      sandboxRunIds.push(completed.id);
    }
  }

  const manifest = createSoulfulDataRedressManifest({
    runId,
    generatedAt,
    packets,
    jiEventsWritten: writeJiEvents ? jiEvents.length : 0,
    sandboxRunsCreated: sandboxRunIds.length,
  });
  const reportMarkdown = generateSoulfulDataRedressReport({ manifest, packets });

  await Promise.all([
    writeFile(path.join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(runDir, "packets.json"), `${JSON.stringify(packets, null, 2)}\n`),
    writeFile(path.join(runDir, "ji-events.jsonl"), jsonl(jiEvents)),
    writeFile(path.join(runDir, "sandbox-inputs.jsonl"), jsonl(sandboxInputs)),
    writeFile(path.join(runDir, "sandbox-runs.jsonl"), jsonl(sandboxRunIds.map((id) => ({ id })))),
    writeFile(path.join(runDir, "rfc-drafts.md"), rfcDrafts.join("\n\n---\n\n")),
    writeFile(path.join(runDir, "report.md"), `${reportMarkdown}\n`),
  ]);

  return {
    runId,
    runDir,
    manifest,
    packets,
    reportMarkdown,
    jiEventIds: jiEvents.map((event) => event.id),
    sandboxRunIds,
  };
}

export async function getLatestSoulfulDataRedressSummary(): Promise<
  SoulfulDataRedressRunSummary | undefined
> {
  let entries;
  try {
    entries = await readdir(soulfulDataRedressRunsDir, { withFileTypes: true });
  } catch {
    return undefined;
  }
  const runId = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse()[0];
  if (!runId) return undefined;

  const runDir = path.join(soulfulDataRedressRunsDir, runId);
  const [manifestText, packetsText, reportMarkdown] = await Promise.all([
    safeReadText(path.join(runDir, "manifest.json")),
    safeReadText(path.join(runDir, "packets.json")),
    safeReadText(path.join(runDir, "report.md")),
  ]);
  const manifest = parseJson<SoulfulDataRedressManifest>(manifestText);
  const packets = parseJson<SoulfulDataRedressPacket[]>(packetsText);
  if (!manifest || !packets) return undefined;

  return {
    manifest,
    packets,
    reportMarkdown: reportMarkdown ?? "",
    runDir,
  };
}
