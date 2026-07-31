import { VisualEditorController } from "./VisualEditorController";
import type { RuntimeRequest } from "../types";

if (!window.__VSE_CONTENT_BOOTSTRAPPED__) {
  window.__VSE_CONTENT_BOOTSTRAPPED__ = true;
  const controller = new VisualEditorController();
  const ready = controller.initialize();

  chrome.runtime.onMessage.addListener(
    (message: RuntimeRequest, _sender, sendResponse) => {
      void ready
        .then(() => controller.handleRequest(message))
        .then(sendResponse)
        .catch((error: unknown) =>
          sendResponse({
            ok: false,
            error:
              error instanceof Error ? error.message : "Visual editor failed to start."
          })
        );
      return true;
    }
  );
}
