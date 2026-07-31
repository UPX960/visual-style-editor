import type { RuntimeRequest, RuntimeResponse } from "../types";
import { CONTENT_SCRIPT_PREFIX } from "../utils/constants";
import { hashString } from "../utils/id";

function isValidOriginPattern(value: string): boolean {
  return /^https?:\/\/[^/*\s]+(?::\d+)?\/\*$/.test(value);
}

async function ensureOriginContentScript(originPattern: string): Promise<void> {
  if (!isValidOriginPattern(originPattern)) throw new Error("Invalid origin permission.");
  const id = `${CONTENT_SCRIPT_PREFIX}${hashString(originPattern)}`;
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (existing.length > 0) return;

  await chrome.scripting.registerContentScripts([
    {
      id,
      matches: [originPattern],
      js: ["content.js"],
      runAt: "document_start",
      persistAcrossSessions: true,
      world: "ISOLATED"
    }
  ]);
}

async function inject(tabId: number): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
    world: "ISOLATED"
  });
}

chrome.runtime.onMessage.addListener(
  (
    message: RuntimeRequest,
    _sender,
    sendResponse: (response: RuntimeResponse) => void
  ) => {
    void (async () => {
      if (message.type === "VSE_ENSURE_ORIGIN_SCRIPT") {
        await ensureOriginContentScript(message.originPattern);
      } else if (message.type === "VSE_INJECT") {
        await inject(message.tabId);
      }
      return { ok: true } satisfies RuntimeResponse;
    })()
      .then(sendResponse)
      .catch((error: unknown) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Background action failed."
        })
      );
    return true;
  }
);

async function sendCommand(request: RuntimeRequest): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id || !tab.url?.startsWith("http")) return;
  try {
    await chrome.tabs.sendMessage(tab.id, request);
  } catch {
    try {
      await inject(tab.id);
      await chrome.tabs.sendMessage(tab.id, request);
    } catch {
      // Restricted pages and origins without permission are intentionally ignored.
    }
  }
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-editor") void sendCommand({ type: "VSE_TOGGLE" });
  if (command === "undo-change") void sendCommand({ type: "VSE_UNDO" });
  if (command === "redo-change") void sendCommand({ type: "VSE_REDO" });
});
