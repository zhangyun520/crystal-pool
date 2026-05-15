import { readFile, writeFile } from "node:fs/promises";
import {
  createWorkerResult,
  parseJsonl,
  serializeJsonl,
  type CrystalWorkerInput,
} from "../src/lib/jobManifest";

async function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath) {
    console.error(
      "Usage: npm run corpus:worker -- <input.jsonl> [output.jsonl]",
    );
    process.exit(1);
  }

  const inputText = await readFile(inputPath, "utf8");
  const inputs = parseJsonl<CrystalWorkerInput>(inputText);
  const results = inputs.map((input) => createWorkerResult(input));
  const output = serializeJsonl(results);

  if (outputPath) {
    await writeFile(outputPath, `${output}\n`, "utf8");
  } else {
    process.stdout.write(`${output}\n`);
  }

  console.error(
    `Marked ${inputs.length} corpus item${inputs.length === 1 ? "" : "s"} into ${results.reduce(
      (sum, result) => sum + result.marks.length,
      0,
    )} meaning mark${results.length === 1 ? "" : "s"}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
