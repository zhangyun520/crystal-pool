"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { runAIDirectorCycle, submitHumanSuggestion } from "./aiDirector";

const suggestionSchema = z.object({
  actorAlias: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(140),
  body: z.string().trim().min(1).max(1_500),
});

function formObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function submitHumanSuggestionAction(formData: FormData) {
  const parsed = suggestionSchema.parse(formObject(formData));
  await submitHumanSuggestion({
    alias: parsed.actorAlias,
    title: parsed.title,
    body: parsed.body,
  });
  redirect("/ai-pool?suggested=1");
}

export async function runAIDirectorCycleAction() {
  await runAIDirectorCycle();
  redirect("/ai-pool?cycle=1");
}
