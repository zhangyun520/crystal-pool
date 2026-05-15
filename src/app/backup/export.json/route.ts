import { NextResponse } from "next/server";
import { buildBackupData } from "@/server/backup";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await buildBackupData();
  const date = data.exportedAt.slice(0, 10);

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "cache-control": "no-store",
      "content-disposition": `attachment; filename="crystal-pool-backup-${date}.json"`,
      "content-type": "application/json; charset=utf-8",
    },
  });
}
