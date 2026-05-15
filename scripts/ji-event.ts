import { phases, type Phase } from "../src/lib/domain";
import {
  jiEventKinds,
  jiSourceProjects,
  type JiEvent,
  type JiEventKind,
  type JiEventRef,
  type JiSourceProject,
} from "../src/lib/ji";
import { writeJiEventToInbox } from "../src/server/ji";

function getArgValue(args: string[], name: string) {
  const exactIndex = args.indexOf(name);
  if (exactIndex >= 0) return args[exactIndex + 1];
  const prefix = `${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function getArgValues(args: string[], name: string) {
  const values: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === name && args[index + 1]) values.push(args[index + 1]);
    if (arg.startsWith(`${name}=`)) values.push(arg.slice(name.length + 1));
  }
  return values;
}

function parseSource(value?: string): JiSourceProject {
  if (jiSourceProjects.includes(value as JiSourceProject)) {
    return value as JiSourceProject;
  }
  throw new Error(
    `Unsupported sourceProject "${value}". Use ${jiSourceProjects.join(", ")}.`,
  );
}

function parseKind(value?: string): JiEventKind {
  if (jiEventKinds.includes(value as JiEventKind)) return value as JiEventKind;
  throw new Error(`Unsupported kind "${value}". Use ${jiEventKinds.join(", ")}.`);
}

function parsePhase(value?: string): Phase | undefined {
  if (!value) return undefined;
  if (phases.includes(value as Phase)) return value as Phase;
  throw new Error(`Unsupported phase "${value}". Use ${phases.join(", ")}.`);
}

function parseRef(value: string): JiEventRef {
  const fields = Object.fromEntries(
    value
      .split(",")
      .map((chunk) => chunk.split("="))
      .filter(([key, entryValue]) => key?.trim() && entryValue?.trim())
      .map(([key, entryValue]) => [key.trim(), entryValue.trim()]),
  );
  if (!fields.label) {
    throw new Error(
      `Invalid --ref "${value}". Use label=Name,path=...,href=...,hash=...`,
    );
  }
  return {
    label: fields.label,
    href: fields.href,
    path: fields.path,
    hash: fields.hash,
  };
}

function generatedId(sourceProject: JiSourceProject, kind: JiEventKind) {
  const stamp = new Date().toISOString().replace(/[^0-9TZ]/g, "");
  return `ji_${sourceProject}_${kind}_${stamp}`.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function main() {
  const args = process.argv.slice(2);
  const sourceProject = parseSource(getArgValue(args, "--source"));
  const kind = parseKind(getArgValue(args, "--kind"));
  const title = getArgValue(args, "--title");
  const body = getArgValue(args, "--body");

  if (!title || !body) {
    throw new Error(
      "Usage: npm run ji:event -- --source open-hermes --kind agent.cycle --title <title> --body <body>",
    );
  }

  const event: JiEvent = {
    id: getArgValue(args, "--id") ?? generatedId(sourceProject, kind),
    sourceProject,
    kind,
    title,
    body,
    occurredAt: getArgValue(args, "--occurred-at") ?? new Date().toISOString(),
    refs: getArgValues(args, "--ref").map(parseRef),
    suggestedPhase: parsePhase(getArgValue(args, "--phase")),
    ha: getArgValue(args, "--ha")
      ? Number.parseFloat(getArgValue(args, "--ha") ?? "0")
      : undefined,
  };

  const { filePath } = await writeJiEventToInbox(event);
  console.log("JiEvent written to ecosystem inbox");
  console.log(`- id: ${event.id}`);
  console.log(`- source: ${event.sourceProject}`);
  console.log(`- kind: ${event.kind}`);
  console.log(`- file: ${filePath}`);
  console.log("- canonical mutation: not performed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
