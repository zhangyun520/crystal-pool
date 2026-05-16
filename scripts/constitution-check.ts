import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  evaluateConstitutionCheck,
  generateConstitutionCheckMarkdown,
  type ConstitutionPackageJson,
  type ConstitutionSourceText,
} from "../src/lib/ethicalKernel";

const sourceRoots = ["src", "scripts"] as const;
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

async function safeReadText(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function readPackageJson(): Promise<ConstitutionPackageJson | undefined> {
  const text = await safeReadText(path.join(process.cwd(), "package.json"));
  if (!text) return undefined;
  try {
    return JSON.parse(text) as ConstitutionPackageJson;
  } catch {
    return undefined;
  }
}

async function collectSourceTexts(dir: string): Promise<ConstitutionSourceText[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return collectSourceTexts(entryPath);
      if (!entry.isFile() || !sourceExtensions.has(path.extname(entry.name))) {
        return [];
      }
      return [
        {
          path: path.relative(process.cwd(), entryPath),
          text: await safeReadText(entryPath),
        },
      ];
    }),
  );

  return nested.flat();
}

async function main() {
  const [packageJson, sourceTexts] = await Promise.all([
    readPackageJson(),
    Promise.all(sourceRoots.map((root) => collectSourceTexts(path.join(process.cwd(), root)))),
  ]);
  const result = evaluateConstitutionCheck({
    packageJson,
    sourceTexts: sourceTexts.flat(),
  });

  console.log(generateConstitutionCheckMarkdown(result));
  if (result.status === "fail") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
