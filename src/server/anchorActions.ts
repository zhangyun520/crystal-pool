"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { anchorProviders } from "@/lib/market";
import { recordManualAnchorExternalReference } from "./market";

const manualAnchorReferenceSchema = z.object({
  anchorId: z.string().trim().min(1),
  externalProvider: z.enum(anchorProviders),
  externalRef: z.string().trim().min(1),
  externalNote: z.string().trim().optional(),
});

function formObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function recordManualAnchorReferenceAction(formData: FormData) {
  const parsed = manualAnchorReferenceSchema.parse(formObject(formData));
  await recordManualAnchorExternalReference({
    anchorId: parsed.anchorId,
    externalProvider: parsed.externalProvider,
    externalRef: parsed.externalRef,
    note: parsed.externalNote,
  });
  revalidatePath("/observe");
  redirect("/observe#anchors");
}
