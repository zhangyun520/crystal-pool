import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("hardening guardrail flow", async ({ page, request }) => {
  const stamp = Date.now();
  const title = `E2E Fragment ${stamp}`;
  const editedTitle = `${title} edited`;
  const targetTitle = `E2E Target ${stamp}`;

  await page.goto("/");
  await expect(page.getByText("Pool Surface")).toBeVisible();
  await expect(page.getByText("Phase Map")).toBeVisible();
  const cleanBackupResponse = await request.get("/backup/export.json");
  expect(cleanBackupResponse.ok()).toBe(true);
  const cleanBackupText = await cleanBackupResponse.text();

  await page.goto("/nodes/new");
  await page.getByLabel("Title").fill(title);
  await page
    .getByLabel("Body")
    .fill("A temporary hardening guardrail fragment for archive testing.");
  await page.getByLabel("Phase").selectOption("gas");
  await page.getByLabel("Tags").fill("e2e, hardening");
  await page.getByRole("button", { name: "Save Fragment" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Score Breakdown" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why This Score Now" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Phase Suggestions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Why This Crystallized" })).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).click();
  await page.getByLabel("Title").fill(editedTitle);
  await page.getByLabel("Phase").selectOption("seed");
  await page.getByRole("button", { name: "Update Fragment" }).click();
  await expect(page.getByRole("heading", { name: editedTitle })).toBeVisible();
  const sourceUrl = page.url();

  await page.getByRole("button", { name: "Crystallize" }).click();
  await expect(page.getByText("Manual crystal transition").first()).toBeVisible();

  await page.goto("/nodes/new");
  await page.getByLabel("Title").fill(targetTitle);
  await page
    .getByLabel("Body")
    .fill("A second active fragment used as the relation target.");
  await page.getByLabel("Phase").selectOption("liquid");
  await page.getByRole("button", { name: "Save Fragment" }).click();
  await expect(page.getByRole("heading", { name: targetTitle })).toBeVisible();

  await page.goto(sourceUrl);
  await page.locator('select[name="toId"]').selectOption({ label: targetTitle });
  await page.locator('select[name="relation"]').first().selectOption("resonates_with");
  await page.locator('input[name="weight"]').first().fill("2.5");
  await page.getByRole("button", { name: "Connect" }).click();
  await expect(page.getByRole("link", { name: targetTitle })).toBeVisible();

  const edgeUpdateForm = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Update" }) })
    .first();
  await edgeUpdateForm.locator('select[name="relation"]').selectOption("triggers");
  await edgeUpdateForm.locator('input[name="weight"]').fill("3.1");
  await edgeUpdateForm.getByRole("button", { name: "Update" }).click();
  const updatedEdgeForm = page
    .locator("form")
    .filter({ has: page.getByRole("button", { name: "Update" }) })
    .first();
  await expect(updatedEdgeForm.locator('select[name="relation"]')).toHaveValue(
    "triggers",
  );
  await expect(updatedEdgeForm.locator('input[name="weight"]')).toHaveValue("3.1");
  await expect(
    page.getByText("triggers points outward with weight 3.1.").first(),
  ).toBeVisible();

  await page.getByPlaceholder("New split node title").fill(`E2E Split ${stamp}`);
  await page
    .getByPlaceholder("Extracted concept body")
    .fill("A split concept grown from the original node.");
  await page.getByPlaceholder("tags for split node").fill("e2e, split");
  await page.getByRole("button", { name: "Split New Node" }).click();
  await expect(
    page.getByRole("heading", { name: `E2E Split ${stamp}` }),
  ).toBeVisible();
  await expect(page.getByText(`Split from "${editedTitle}"`).first()).toBeVisible();
  await page.goto(sourceUrl);
  await page
    .locator('select[name="sourceId"]')
    .selectOption({ label: `E2E Split ${stamp}` });
  await page.locator('input[name="mergeReason"]').fill("E2E merge check");
  await page.getByRole("button", { name: "Merge Into This" }).click();
  await expect(
    page.getByText(`Merged "E2E Split ${stamp}" into this node`).first(),
  ).toBeVisible();

  await page.getByLabel("Contribution actor alias").fill("e2e-reviewer");
  await page.getByLabel("Contribution kind").selectOption("review");
  await page.getByLabel("Contribution weight").fill("4");
  await page
    .getByLabel("Contribution body")
    .fill("E2E review says this fragment deserves market attention.");
  await page.getByRole("button", { name: "Record Contribution" }).click();
  await expect(page.getByText("E2E review says this fragment")).toBeVisible();

  await page.getByLabel("Order actor alias").fill("e2e-builder");
  await page.getByLabel("Market order side").selectOption("bid");
  await page.getByLabel("Market order price").fill("37");
  await page.getByLabel("Market order quantity").fill("2");
  await page
    .getByLabel("Market order note")
    .fill("E2E simulated build intent.");
  await page.getByRole("button", { name: "Place Simulated Order" }).click();
  await expect(page.getByText("E2E simulated build intent.")).toBeVisible();

  await page.getByRole("button", { name: "Archive" }).click();
  await expect(page).toHaveURL(/\/nodes$/);
  await expect(page.getByText(editedTitle)).toHaveCount(0);

  await page.goto(`/nodes?status=archived&q=${encodeURIComponent(editedTitle)}`);
  await expect(page.getByText(editedTitle)).toBeVisible();
  await page.getByText(editedTitle).click();
  await expect(page.getByText("Archived nodes keep their phase history")).toBeVisible();
  await expect(page.getByText("Manual crystal transition").first()).toBeVisible();

  const dailyResidueTitle = `E2E Daily Residue ${stamp}`;
  await page.goto("/import");
  await page
    .getByPlaceholder("Paste conversation residue here...")
    .fill(
      `${dailyResidueTitle} 是一个新的核心结晶。\n\n意义是对抗时间的最小单位，这是核心结晶。\n\n哈哈，哈基米提醒系统松一下。`,
    );
  await expect(page.getByText("Review queue")).toBeVisible();
  await expect(page.getByLabel("Phase for candidate 1")).toHaveValue("seed");
  await expect(page.getByLabel("Ha for candidate 3")).toHaveValue("6");
  await expect(page.getByText("Possible duplicate").first()).toBeVisible();
  await page.getByRole("button", { name: "Commit Review Actions" }).click();
  await expect(page.getByText("Import review committed")).toBeVisible();

  await page.goto(`/nodes?q=${encodeURIComponent(dailyResidueTitle)}`);
  await expect(page.getByRole("link", { name: /E2E Daily Residue/ })).toBeVisible();

  await page.goto(
    `/nodes?q=${encodeURIComponent("意义是对抗时间的最小单位")}`,
  );
  await page
    .getByRole("link", { name: "意义是对抗时间的最小单位" })
    .first()
    .click();
  await expect(page.getByText("Merged import candidate").first()).toBeVisible();

  await page.goto("/import");
  await page
    .getByPlaceholder("Paste conversation residue here...")
    .fill("意义与时间互相触发，提醒池面建立关系。");
  await page.getByLabel("Action for candidate 1").selectOption("edge");
  await page
    .getByLabel("Target node for candidate 1")
    .selectOption({ label: "意义是对抗时间的最小单位" });
  await page
    .getByLabel("Edge target for candidate 1")
    .selectOption({ label: "时间是残差的积分路径" });
  await page.getByRole("button", { name: "Commit Review Actions" }).click();
  await expect(page.getByText("1 edges")).toBeVisible();

  await page.goto("/graph");
  await expect(
    page.getByRole("img", { name: "Crystal relation graph" }),
  ).toBeVisible();
  await expect(page.locator("svg circle").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Selected Node" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Node Detail" })).toBeVisible();

  await page.goto("/graph?relation=hardens_into");
  await expect(page.locator('form select[name="relation"]')).toHaveValue(
    "hardens_into",
  );
  await expect(
    page.locator("svg text").filter({ hasText: "hardens_into" }).first(),
  ).toBeVisible();

  await page.goto("/graph?tag=ha");
  await expect(page.locator('form select[name="tag"]')).toHaveValue("ha");
  await expect(page.getByRole("heading", { name: "Selected Node" })).toBeVisible();

  await page.goto("/flow");
  await expect(page.getByRole("heading", { name: "Crystallization Tape" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Meaning Tape" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Market Depth" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Market Tape" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Parallel Lanes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pressure" })).toBeVisible();
  const flowResponse = await request.get("/api/meaning-flow");
  expect(flowResponse.ok()).toBe(true);
  const flowSnapshot = await flowResponse.json();
  expect(Array.isArray(flowSnapshot.events)).toBe(true);
  expect(flowSnapshot.market.contributionEvents).toBeGreaterThan(0);
  expect(flowSnapshot.queue).toHaveProperty("ecosystemPending");
  const aiFlowResponse = await request.get("/api/meaning-flow?pool=ai");
  expect(aiFlowResponse.ok()).toBe(true);
  const aiFlowSnapshot = await aiFlowResponse.json();
  expect(Array.isArray(aiFlowSnapshot.events)).toBe(true);

  await page.goto("/flow?pool=ai");
  await expect(page.getByRole("heading", { name: "Meaning Tape" })).toBeVisible();

  await page.goto("/flow?pool=fugue");
  await expect(page.getByRole("heading", { name: "Meaning Tape" })).toBeVisible();

  await page.goto("/ai-pool");
  await expect(
    page.getByRole("heading", { name: "Humans observe. The director mutates." }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Permission Wall" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit Suggestion" })).toBeVisible();

  await page.goto("/sandbox");
  await expect(
    page.getByRole("heading", {
      name: "Fugue, Sonata, and Symphony rehearsals.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Scenario Gallery" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Run List" })).toBeVisible();
  await expect(page.getByText("Bubble Market")).toBeVisible();
  await page.goto("/fugue");
  await expect(page.getByRole("heading", { name: "Scenario Gallery" })).toBeVisible();

  await page.goto("/ecosystem");
  await expect(page.getByRole("heading", { name: "JiEvent Review Queue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Project Organs" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Typed Proposal Lanes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Import Inbox" })).toBeVisible();

  await page.goto("/corpus");
  await expect(page.getByRole("heading", { name: "Meaning Marking Layer" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "ChatGPT Conversation Intake" }),
  ).toBeVisible();
  await expect(page.getByText("Local Corpus Marker")).toBeVisible();
  await expect(page.getByText("Worker JSONL")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Meaning Marks" })).toBeVisible();

  await page.goto("/observe");
  await expect(page.getByRole("heading", { name: "Long-Run Monitor" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Signals" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ecosystem Intake" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Queue" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pool Health" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Market Watcher" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Anchor Bundles" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Long Goal Compass" })).toBeVisible();

  await page.goto("/backup");
  await expect(page.getByRole("link", { name: "Export JSON" })).toBeVisible();
  await expect(page.getByText("Backup Integrity")).toBeVisible();
  await expect(
    page.getByText("Current export has no broken references."),
  ).toBeVisible();
  const response = await request.get("/backup/export.json");
  expect(response.ok()).toBe(true);
  const backup = await response.json();
  expect(backup.schemaVersion).toBe("crystal-pool.backup.v1");
  expect(backup.nodes.some((node: { title: string }) => node.title === editedTitle)).toBe(
    true,
  );
  expect(
    backup.nodes.some(
      (node: { title: string; archivedAt: string | null }) =>
        node.title === editedTitle && node.archivedAt,
    ),
  ).toBe(true);
  expect(Array.isArray(backup.phaseEvents)).toBe(true);

  await page
    .getByPlaceholder("Paste crystal-pool.backup.v1 JSON here...")
    .fill("{bad json");
  await expect(
    page.getByText("Dry-run failed: Backup JSON could not be parsed."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Restore Backup" })).toBeDisabled();
  const failedRestoreResponse = await request.get("/backup/export.json");
  expect(failedRestoreResponse.ok()).toBe(true);
  const failedRestoreBackup = await failedRestoreResponse.json();
  expect(
    failedRestoreBackup.nodes.some(
      (node: { title: string }) => node.title === editedTitle,
    ),
  ).toBe(true);

  await page.getByPlaceholder("Paste crystal-pool.backup.v1 JSON here...").fill(
    cleanBackupText,
  );
  await expect(
    page.getByRole("heading", { name: "Dry-run preview" }),
  ).toBeVisible();
  await expect(page.getByText("This backup is restorable.")).toBeVisible();
  await page.getByLabel("Replace the current local pool with this backup").check();
  await page.getByRole("button", { name: "Restore Backup" }).click();
  await expect(
    page.getByText("Backup restored. 9 nodes are back in the pool."),
  ).toBeVisible();
  const restoredResponse = await request.get("/backup/export.json");
  expect(restoredResponse.ok()).toBe(true);
  const restoredBackup = await restoredResponse.json();
  expect(restoredBackup.nodes).toHaveLength(9);
  expect(
    restoredBackup.nodes.some(
      (node: { title: string }) => node.title === editedTitle,
    ),
  ).toBe(false);
});

test("mobile viewport keeps core surfaces usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/");
  await expect(page.getByText("Pool Surface")).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("link", { name: "Add Fragment" }),
  ).toBeVisible();

  await page.goto("/nodes?q=时间&sort=title&dir=asc");
  await expect(page.getByRole("heading", { name: "Crystal Nodes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Apply" })).toBeVisible();

  await page.goto("/graph");
  await expect(
    page.getByRole("img", { name: "Crystal relation graph" }),
  ).toBeVisible();

  await page.goto("/flow");
  await expect(page.getByRole("heading", { name: "Meaning Tape" })).toBeVisible();

  await page.goto("/ai-pool");
  await expect(page.getByRole("heading", { name: "Permission Wall" })).toBeVisible();

  await page.goto("/sandbox");
  await expect(page.getByRole("heading", { name: "Scenario Gallery" })).toBeVisible();

  await page.goto("/ecosystem");
  await expect(page.getByRole("heading", { name: "JiEvent Review Queue" })).toBeVisible();

  await page.goto("/corpus");
  await expect(page.getByText("ChatGPT Conversation Intake")).toBeVisible();
  await expect(page.getByText("Local Corpus Marker")).toBeVisible();

  await page.goto("/observe");
  await expect(page.getByRole("heading", { name: "Long-Run Monitor" })).toBeVisible();

  await page.goto("/backup");
  await expect(page.getByRole("link", { name: "Export JSON" })).toBeVisible();
});
