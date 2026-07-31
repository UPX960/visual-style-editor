import { chromium, expect, test } from "@playwright/test";
import { resolve } from "node:path";

test("popup and settings pages load from the built extension", async () => {
  test.skip(
    process.env.RUN_EXTENSION_E2E !== "1",
    "Set RUN_EXTENSION_E2E=1 after building to launch Chromium with the extension."
  );

  const extensionPath = resolve(process.cwd(), "dist");
  const context = await chromium.launchPersistentContext("", {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  try {
    const serviceWorker =
      context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
    const extensionId = new URL(serviceWorker.url()).host;
    const page = await context.newPage();

    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(page.getByText("Visual Style Editor").first()).toBeVisible();

    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await expect(page.getByText("Saved domain designs")).toBeVisible();
  } finally {
    await context.close();
  }
});
