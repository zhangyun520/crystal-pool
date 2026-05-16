import { parseSandboxMode } from "../src/lib/sandbox";
import { buildWorldlineSandboxInput, parseWorldlineKey } from "../src/lib/worldline";
import { runSandboxProtocol } from "../src/server/sandbox";
import { prisma } from "../src/server/db";

function getArgValue(args: string[], name: string) {
  const exactIndex = args.indexOf(name);
  if (exactIndex >= 0) return args[exactIndex + 1];
  const prefix = `${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function listArg(value?: string) {
  return (value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function main() {
  const args = process.argv.slice(2);
  const worldline = parseWorldlineKey(getArgValue(args, "--worldline"));
  const mode = parseSandboxMode(getArgValue(args, "--mode") ?? "SYMPHONY");
  const run = await runSandboxProtocol(
    buildWorldlineSandboxInput({
      worldlineKey: worldline,
      mode,
      title: getArgValue(args, "--title"),
      worldlineHypothesis: getArgValue(args, "--hypothesis"),
      responsibilityQuestion: getArgValue(args, "--responsibility-question"),
      sourceJiEventIds: listArg(getArgValue(args, "--source-ji")),
    }),
  );

  console.log("Worldline sandbox run");
  console.log(`- id: ${run.id}`);
  console.log(`- mode: ${run.mode}`);
  console.log(`- worldline: ${run.worldlineKey ?? worldline}`);
  console.log(`- status: ${run.status}`);
  console.log(`- url: /sandbox?run=${run.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
