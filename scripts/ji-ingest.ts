import { importJiInbox } from "../src/server/ji";
import { prisma } from "../src/server/db";

async function main() {
  const result = await importJiInbox();
  console.log("JiEvent inbox import");
  console.log(`- files: ${result.scannedFiles}`);
  console.log(`- lines: ${result.scannedLines}`);
  console.log(`- valid: ${result.validEvents}`);
  console.log(`- imported: ${result.importedEvents}`);
  console.log(`- duplicates: ${result.duplicateEvents}`);
  if (result.diagnostics.length > 0) {
    console.log("- diagnostics:");
    for (const diagnostic of result.diagnostics.slice(0, 12)) {
      console.log(
        `  ${diagnostic.severity} ${diagnostic.code} ${diagnostic.file ?? "inbox"}:${diagnostic.line ?? "-"} ${diagnostic.message}`,
      );
    }
  }
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
