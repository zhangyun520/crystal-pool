"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sandboxModes } from "@/lib/sandbox";
import {
  createSandboxFromJiEvent,
  dismissJiEvent,
  draftRfcFromJiEvent,
  importJiEventAsNode,
  importJiInbox,
} from "./ji";

const eventIdSchema = z.object({
  eventId: z.string().trim().min(1),
});

const sandboxFromJiSchema = eventIdSchema.extend({
  mode: z.enum(sandboxModes),
});

const dismissJiSchema = eventIdSchema.extend({
  reason: z.string().trim().max(500).optional(),
});

function formObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function refreshEcosystemPaths() {
  revalidatePath("/ecosystem");
  revalidatePath("/observe");
  revalidatePath("/flow");
  revalidatePath("/");
}

export async function importJiInboxAction() {
  await importJiInbox();
  refreshEcosystemPaths();
  redirect("/ecosystem");
}

export async function importJiEventAsNodeAction(formData: FormData) {
  const parsed = eventIdSchema.parse(formObject(formData));
  const nodeId = await importJiEventAsNode(parsed.eventId);
  refreshEcosystemPaths();
  redirect(`/nodes/${nodeId}`);
}

export async function createSandboxFromJiEventAction(formData: FormData) {
  const parsed = sandboxFromJiSchema.parse(formObject(formData));
  const runId = await createSandboxFromJiEvent(parsed.eventId, parsed.mode);
  refreshEcosystemPaths();
  revalidatePath("/sandbox");
  redirect(`/sandbox?run=${runId}`);
}

export async function draftRfcFromJiEventAction(formData: FormData) {
  const parsed = eventIdSchema.parse(formObject(formData));
  await draftRfcFromJiEvent(parsed.eventId);
  refreshEcosystemPaths();
  redirect("/ecosystem");
}

export async function dismissJiEventAction(formData: FormData) {
  const parsed = dismissJiSchema.parse(formObject(formData));
  await dismissJiEvent(parsed.eventId, parsed.reason);
  refreshEcosystemPaths();
  redirect("/ecosystem");
}
