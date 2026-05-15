import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FugueCompatibilityPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string | string[] }>;
}) {
  const params = await searchParams;
  const run = Array.isArray(params.run) ? params.run[0] : params.run;
  redirect(run ? `/sandbox?run=${encodeURIComponent(run)}` : "/sandbox");
}
