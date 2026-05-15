import packageJson from "../../package.json";
import {
  evaluateConstitutionCheck,
  generateConstitutionCheckMarkdown,
  type ConstitutionCheckResult,
  type ConstitutionPackageJson,
} from "@/lib/ethicalKernel";

export async function getConstitutionSnapshot(): Promise<
  ConstitutionCheckResult & { reportMarkdown: string }
> {
  const result = evaluateConstitutionCheck({
    packageJson: packageJson as ConstitutionPackageJson,
  });

  return {
    ...result,
    reportMarkdown: generateConstitutionCheckMarkdown(result),
  };
}
