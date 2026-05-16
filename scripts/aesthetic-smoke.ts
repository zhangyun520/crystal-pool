import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import {
  aestheticSmokeRoutes,
  aestheticSmokeViewports,
  createAestheticSmokeManifest,
  generateAestheticSmokeReport,
  type AestheticSmokeRouteCheck,
} from "../src/lib/aestheticSmoke";
import { aestheticSmokeRunsDir } from "../src/server/aestheticSmoke";

function getArgValue(args: string[], name: string) {
  const exactIndex = args.indexOf(name);
  if (exactIndex >= 0) return args[exactIndex + 1];
  const prefix = `${name}=`;
  return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function runIdFromDate(date = new Date()) {
  return `aesthetic-smoke-${date.toISOString().replace(/[:.]/g, "-")}`;
}

function joinUrl(baseUrl: string, routePath: string) {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return `${normalizedBase}${routePath}`;
}

async function fileSize(filePath: string) {
  try {
    return (await stat(filePath)).size;
  } catch {
    return 0;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = getArgValue(args, "--base-url") ?? "http://localhost:3000";
  const runId = getArgValue(args, "--run-id") ?? runIdFromDate();
  const createdAt = new Date().toISOString();
  const runDir = path.join(aestheticSmokeRunsDir, runId);
  const screenshotsDir = path.join(runDir, "screenshots");
  await mkdir(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const checks: AestheticSmokeRouteCheck[] = [];

  try {
    for (const viewport of aestheticSmokeViewports) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      });
      for (const route of aestheticSmokeRoutes) {
        const response = await page.goto(joinUrl(baseUrl, route.path), {
          waitUntil: "networkidle",
        });
        const statusCode = response?.status() ?? null;
        const bodyText = await page.locator("body").innerText().catch(() => "");
        const missingText = route.expectedText.filter(
          (text) => !bodyText.includes(text),
        );
        const layout = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
        }));
        const screenshotName = `${route.path.replace(/^\//, "").replace(/\//g, "-")}-${viewport.label}.png`;
        const screenshotPath = path.join(screenshotsDir, screenshotName);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        const screenshotBytes = await fileSize(screenshotPath);
        const horizontalOverflow = layout.scrollWidth > layout.viewportWidth + 4;
        const passed =
          statusCode === 200 &&
          missingText.length === 0 &&
          !horizontalOverflow &&
          screenshotBytes > 0 &&
          bodyText.trim().length > 120;

        checks.push({
          path: route.path,
          label: route.label,
          viewport: viewport.label,
          statusCode,
          screenshotPath: path.relative(runDir, screenshotPath),
          screenshotBytes,
          expectedText: [...route.expectedText],
          missingText,
          scrollWidth: layout.scrollWidth,
          viewportWidth: layout.viewportWidth,
          horizontalOverflow,
          bodyTextLength: bodyText.trim().length,
          passed,
        });
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  const completedAt = new Date().toISOString();
  const manifest = createAestheticSmokeManifest({
    runId,
    baseUrl,
    createdAt,
    completedAt,
    checks,
  });
  const reportMarkdown = generateAestheticSmokeReport({ manifest, checks });

  await Promise.all([
    writeFile(path.join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
    writeFile(path.join(runDir, "route-checks.json"), `${JSON.stringify(checks, null, 2)}\n`),
    writeFile(path.join(runDir, "report.md"), `${reportMarkdown}\n`),
  ]);

  console.log("Crystal Pool aesthetic screenshot smoke");
  console.log(`- runId: ${runId}`);
  console.log(`- runDir: ${runDir}`);
  console.log(`- baseUrl: ${baseUrl}`);
  console.log(`- checks: ${manifest.checks}`);
  console.log(`- passed: ${manifest.passed}`);
  console.log(`- failed: ${manifest.failed}`);
  console.log(`- screenshots: ${manifest.screenshots}`);
  console.log(`- report: ${runDir}/report.md`);
  console.log("- boundary: local screenshots only; no canonical promotion");

  if (manifest.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
