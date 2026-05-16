import { stableTextHash, type CorpusDocumentInput } from "./corpusTrail";

export type ChatGptMessageRole =
  | "user"
  | "assistant"
  | "system"
  | "tool"
  | "unknown";

export type ChatGptMessage = {
  role: ChatGptMessageRole;
  body: string;
  createdAt?: string;
};

export type ChatGptConversationDocument = {
  title: string;
  sourceRef: string;
  body: string;
  capturedAt: string;
  messageCount: number;
};

type ChatGptExportConversation = {
  title?: string;
  create_time?: number | null;
  update_time?: number | null;
  mapping?: Record<
    string,
    {
      message?: {
        author?: { role?: string };
        create_time?: number | null;
        content?: { parts?: unknown[]; text?: string };
      } | null;
    }
  >;
};

function normalizeText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function roleFromLabel(label: string): ChatGptMessageRole {
  const normalized = label.toLowerCase();
  if (["user", "you", "me", "human", "我", "用户"].includes(normalized)) {
    return "user";
  }
  if (["assistant", "chatgpt", "gpt", "codex", "助手"].includes(normalized)) {
    return "assistant";
  }
  if (normalized === "system") return "system";
  if (normalized === "tool") return "tool";
  return "unknown";
}

function roleLabel(role: ChatGptMessageRole) {
  if (role === "user") return "User";
  if (role === "assistant") return "Assistant";
  if (role === "system") return "System";
  if (role === "tool") return "Tool";
  return "Message";
}

function isoFromSeconds(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000).toISOString()
    : undefined;
}

function partsToText(parts?: unknown[]) {
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part) {
        const text = (part as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

function messagesToBody(messages: ChatGptMessage[]) {
  return messages
    .map((message) => `${roleLabel(message.role)}:\n${message.body}`)
    .join("\n\n");
}

function extractExportMessages(
  conversation: ChatGptExportConversation,
): ChatGptMessage[] {
  return Object.values(conversation.mapping ?? {})
    .map((node) => {
      const message = node.message;
      if (!message) return undefined;
      const body = normalizeText(
        partsToText(message.content?.parts) || message.content?.text || "",
      );
      if (!body) return undefined;
      const createdAt = isoFromSeconds(message.create_time);
      const parsedMessage: ChatGptMessage = {
        role: roleFromLabel(message.author?.role ?? "unknown"),
        body,
        ...(createdAt ? { createdAt } : {}),
      };
      return parsedMessage;
    })
    .filter((message): message is ChatGptMessage => message !== undefined)
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
}

function parseExportJson(rawText: string): ChatGptConversationDocument[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return [];
  }

  const conversations = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { conversations?: unknown }).conversations)
      ? (parsed as { conversations: unknown[] }).conversations
      : [parsed];

  return conversations
    .map((item, index) => {
      const conversation = item as ChatGptExportConversation;
      if (!conversation.mapping) return undefined;
      const messages = extractExportMessages(conversation);
      if (messages.length === 0) return undefined;
      const title = normalizeText(conversation.title || `ChatGPT conversation ${index + 1}`);
      const capturedAt =
        isoFromSeconds(conversation.update_time) ??
        messages[messages.length - 1]?.createdAt ??
        new Date().toISOString();
      const body = messagesToBody(messages);
      return {
        title,
        sourceRef: `chatgpt:export:${stableTextHash(`${title}\n${body}`)}`,
        body,
        capturedAt,
        messageCount: messages.length,
      } satisfies ChatGptConversationDocument;
    })
    .filter((document): document is ChatGptConversationDocument =>
      Boolean(document),
    );
}

export function parsePastedChatGptTranscript(rawText: string): ChatGptMessage[] {
  const text = normalizeText(rawText);
  if (!text) return [];
  const roleLinePattern =
    /^(User|You|Me|Human|Assistant|ChatGPT|GPT|Codex|System|Tool|我|用户|助手)\s*[:：]?\s*$/i;
  const inlineRolePattern =
    /^(User|You|Me|Human|Assistant|ChatGPT|GPT|Codex|System|Tool|我|用户|助手)\s*[:：]\s+(.+)$/i;
  const messages: ChatGptMessage[] = [];
  let currentRole: ChatGptMessageRole = "unknown";
  let currentLines: string[] = [];

  function flush() {
    const body = normalizeText(currentLines.join("\n"));
    if (body) messages.push({ role: currentRole, body });
    currentLines = [];
  }

  for (const line of text.split("\n")) {
    const roleOnly = line.match(roleLinePattern);
    const inlineRole = line.match(inlineRolePattern);
    if (roleOnly) {
      flush();
      currentRole = roleFromLabel(roleOnly[1]);
      continue;
    }
    if (inlineRole) {
      flush();
      currentRole = roleFromLabel(inlineRole[1]);
      currentLines.push(inlineRole[2]);
      continue;
    }
    currentLines.push(line);
  }
  flush();

  return messages.length > 0 ? messages : [{ role: "unknown", body: text }];
}

export function parseChatGptCorpusInput({
  rawText,
  sourceRef,
  title,
  capturedAt = new Date().toISOString(),
  maxDocuments = 50,
}: {
  rawText: string;
  sourceRef?: string;
  title?: string;
  capturedAt?: string;
  maxDocuments?: number;
}): CorpusDocumentInput[] {
  const exportDocuments = parseExportJson(rawText).slice(0, maxDocuments);
  if (exportDocuments.length > 0) {
    return exportDocuments.map((document) => ({
      sourceKind: "chatgpt",
      sourceRef: sourceRef?.trim() || document.sourceRef,
      title: document.title,
      body: document.body,
      capturedAt: document.capturedAt,
      license: "user-provided ChatGPT conversation export",
    }));
  }

  const messages = parsePastedChatGptTranscript(rawText);
  if (messages.length === 0) return [];
  const body = messagesToBody(messages);
  const resolvedTitle =
    title?.trim() ||
    messages.find((message) => message.role === "user")?.body.slice(0, 80) ||
    "ChatGPT web conversation";
  return [
    {
      sourceKind: "chatgpt",
      sourceRef:
        sourceRef?.trim() ||
        `chatgpt:web-paste:${stableTextHash(`${resolvedTitle}\n${body}`)}`,
      title: resolvedTitle,
      body,
      capturedAt,
      license: "user-provided ChatGPT web conversation paste",
    },
  ];
}
