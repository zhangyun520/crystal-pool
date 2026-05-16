import { scanCodingRepository } from "../src/server/codingRepository";
import { prisma } from "../src/server/db";

function getArgValue(args: string[], name: string) {
  const exactIndex = args.indexOf(name);
  if (exactIndex >= 0) return args[exactIndex + 1];
  const prefix = `${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const repo = getArgValue(args, "--repo");
  if (!repo) {
    throw new Error("Missing --repo <owner/name>.");
  }

  const maxRepoBytes =
    parsePositiveInt(getArgValue(args, "--max-repo-mb"), 80) * 1024 * 1024;
  const result = await scanCodingRepository({ repo, maxRepoBytes });

  console.log("Coding repository scan");
  console.log(`- repo: ${result.structure.repo}`);
  console.log(`- commit: ${result.structure.commit}`);
  console.log(`- files: ${result.structure.fileCount}`);
  console.log(`- totalBytes: ${result.structure.totalBytes}`);
  console.log(`- languages: ${result.structure.primaryLanguages.join(", ") || "unknown"}`);
  console.log(`- hints: ${result.structure.architectureHints.join(", ")}`);
  console.log(`- candidates: ${result.candidates.length}`);
  console.log("- boundary: read-only; no install, no execution, no tests");
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
