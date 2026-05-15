import { describe, expect, it } from "vitest";
import {
  parseChatGptCorpusInput,
  parsePastedChatGptTranscript,
} from "@/lib/chatgptTranscript";

describe("ChatGPT transcript corpus parser", () => {
  it("parses pasted role-labeled web transcripts", () => {
    const messages = parsePastedChatGptTranscript(`User:
我们做结晶池。

Assistant:
可以，把这段作为意义残差进入候选队列。`);

    expect(messages).toEqual([
      { role: "user", body: "我们做结晶池。" },
      { role: "assistant", body: "可以，把这段作为意义残差进入候选队列。" },
    ]);

    const [document] = parseChatGptCorpusInput({
      rawText: `User: 我们做结晶池。\nAssistant: 可以，进入候选队列。`,
      title: "结晶池讨论",
      capturedAt: "2026-05-13T00:00:00.000Z",
    });

    expect(document.sourceKind).toBe("chatgpt");
    expect(document.title).toBe("结晶池讨论");
    expect(document.body).toContain("User:");
    expect(document.license).toContain("ChatGPT web conversation");
  });

  it("parses ChatGPT conversations.json exports", () => {
    const exportJson = JSON.stringify([
      {
        title: "Exported pool talk",
        update_time: 1770000000,
        mapping: {
          root: {
            message: {
              author: { role: "system" },
              create_time: 1770000000,
              content: { parts: [""] },
            },
          },
          user: {
            message: {
              author: { role: "user" },
              create_time: 1770000001,
              content: { parts: ["意义是对抗时间的最小单位。"] },
            },
          },
          assistant: {
            message: {
              author: { role: "assistant" },
              create_time: 1770000002,
              content: { parts: ["这会成为一个 seed。"] },
            },
          },
        },
      },
    ]);

    const [document] = parseChatGptCorpusInput({ rawText: exportJson });

    expect(document.sourceKind).toBe("chatgpt");
    expect(document.title).toBe("Exported pool talk");
    expect(document.sourceRef).toMatch(/^chatgpt:export:/);
    expect(document.body).toContain("User:");
    expect(document.body).toContain("Assistant:");
    expect(document.license).toContain("export");
  });
});
