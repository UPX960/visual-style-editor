# Visual Style Editor

Visual Style Editor is a Manifest V3 browser extension for visually editing a website with local CSS. It provides a Shadow DOM editor, page inspector, responsive overrides, history, domain persistence, and clean CSS/JSON export without modifying the website's source files or server.

**v0.3.0 adds one-click backups plus first-class Windows 10 / 11 build, packaging, Chrome, and Microsoft Edge guidance.** Windows users can follow the complete English + Arabic guide in [docs/WINDOWS.md](docs/WINDOWS.md).

This repository contains the working MVP plus an advanced property inspector and a complete, searchable Google Fonts catalog. Direct-manipulation tools and the remaining asset libraries stay separated so the editor remains fast, testable, and reliable.

## What works

- Optional per-origin permission request instead of permanent access to every website.
- Programmatic content-script registration for automatic style reapplication.
- Hover highlighting, element dimensions, click selection, and navigation to parent/adjacent siblings.
- Flexible selectors and single-element session selectors.
- Selector match count, specificity, stability score, manual editing, and warnings.
- Shadow DOM sidebar with dark/light theme, left/right dock, adjustable width, minimize mode, property search, and keyboard focus states.
- More than 100 editable CSS properties across typography, backgrounds, spacing, dimensions, borders, positioning, Flexbox, Grid, effects, transforms, lists, and transitions.
- Dimension controls with `px`, `%`, `em`, `rem`, viewport, intrinsic-size, and unitless choices where valid.
- Visual box-model controls for individual margin and padding values.
- Base, desktop, tablet, and mobile CSS overrides.
- Complete bundled index of 1,908 Google Fonts families with search, category/language filters, Arabic font filtering, custom preview text, weight/style selection, and recent fonts.
- Apply a Google Font to the selected element, every heading, or the entire page while loading only the chosen family and variants.
- Live injected CSS, undo, redo, change timeline, element reset, and page reset.
- Domain-local persistence with automatic reapplication after reload.
- CSS copy/download and validated JSON import/export.
- One-click **Backup all designs** export from Settings for a versioned JSON backup of every saved domain design.
- Popup, options page, saved-design enable/pause/delete/export controls.
- English and Arabic extension metadata and UI.
- Sensitive password and payment-card inputs are intentionally excluded.
- Cross-platform CI, 20 unit tests, an extension-page Playwright smoke test, privacy policy, and store-listing copy.

## Architecture

```text
src/
├── background/       Service worker, script registration, commands
├── content/          Page inspector and Shadow DOM bootstrap
├── editor/           React editor UI, property definitions, and font browser
├── assets/           Google Fonts integration and optional asset adapters
├── popup/            Extension action popup
├── options/          Settings and saved designs
├── store/            Zustand editor state and history
├── utils/            CSS, selector, storage, and safety utilities
├── i18n/             English and Arabic UI strings
├── styles/           Tailwind extension UI + isolated editor CSS
└── types/            Shared strict TypeScript contracts
```

The UI build uses Vite's multi-page mode. The content script and service worker are produced as separate IIFE bundles so Chromium browsers can execute them as classic Manifest V3 scripts. The editor's CSS is bundled as a string and inserted only inside its Shadow DOM.

## Requirements

### Installing a published release

- Google Chrome or Microsoft Edge based on Chromium.
- Windows 10 / 11, macOS, or Linux.
- No Node.js requirement when loading the published extension ZIP as an unpacked extension.

### Building from source

- Node.js 20 or newer.
- npm 10 or newer.
- Windows PowerShell on Windows 10 / 11 (built in), or the `zip` command on macOS/Linux when packaging.

## Installation

### Windows 10 / 11

See [docs/WINDOWS.md](docs/WINDOWS.md) for the full Chrome + Edge install, update, source-build, PowerShell, and troubleshooting guide in English and Arabic.

Quick path:

1. Download `visual-style-editor-extension.zip` from the latest GitHub Release.
2. Extract it to a permanent folder.
3. Chrome: open `chrome://extensions`. Edge: open `edge://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the extracted folder that directly contains `manifest.json`.
6. Pin Visual Style Editor, open a normal website, and click **Activate visual editor**.
7. Approve access to the current site when the browser asks.

Chrome and Edge cannot load an unpacked extension directly from a ZIP file. Extract it first.

### Build from source

```bash
git clone https://github.com/UPX960/visual-style-editor.git
cd visual-style-editor
npm ci
npm run validate
npm run package
```

Then load `dist/` as an unpacked extension. On Windows, `npm run package` uses the built-in Windows PowerShell `Compress-Archive`; no Unix-style `zip` installation is required.

## Development

Install dependencies:

```bash
npm ci
```

Run the popup/options Vite development server:

```bash
npm run dev
```

A Vite development server is not a complete browser extension because the background and content scripts also need extension bundles. For actual extension testing, use a production build:

```bash
npm run build
```

Rebuild after source changes, then click the extension's reload button on `chrome://extensions` or `edge://extensions`.

## Build and package

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run package
```

Outputs:

- `dist/` — load this folder as an unpacked extension.
- `visual-style-editor-extension.zip` — packaged extension bundle whose root contains `manifest.json`.

Packaging is cross-platform:

- Windows 10 / 11: Windows PowerShell `Compress-Archive`.
- macOS/Linux: system `zip` command.

## Back up all saved designs

Open the extension's Settings page and choose **Backup all designs**. The downloaded JSON file contains:

- backup schema version,
- UTC export timestamp,
- every saved domain design currently stored by Visual Style Editor.

This is useful before moving browser profiles, changing computers, or making large configuration changes. Per-design JSON export remains available as well.

## How domain permission works

The manifest declares `http://*/*` and `https://*/*` under `optional_host_permissions`. It does not receive those origins automatically. When the user clicks **Activate visual editor**, the popup requests only the current origin, such as:

```text
https://example.com/*
```

After approval, the service worker registers `content.js` for that origin so enabled saved CSS can be reapplied on future visits. Browser internal pages, extension stores, cross-origin frames without access, closed Shadow DOM, enterprise-blocked pages, and other protected surfaces cannot be edited.

## How changes are stored

Each hostname uses a Chrome Storage key in this form:

```text
vse:design:example.com
```

A project includes its selectors, declarations, responsive breakpoint, used Google Font families and variants, timestamps, enabled state, and source URL. The extension stores one active design per hostname. Clicking **Save** writes the current stable rules and only the fonts used by those rules. Single-element selectors use a temporary `data-visual-editor-id` and are deliberately excluded from persistent saves because that attribute exists only during the current page session.

No browsing history, full page content, passwords, card fields, or form values are stored.

## Selector strategy

The generator tries, in order:

1. A safe unique ID.
2. A semantic test/data/ARIA attribute.
3. Stable semantic classes.
4. A short ancestor path.
5. `:nth-of-type()` only when required.

Generated-looking hashed classes are penalized or skipped. Every selector is checked against the page and receives a match count, specificity tuple, stability score, and warning when it is broad or structurally fragile.

## Responsive output

Rules are stored separately for `base`, `desktop`, `tablet`, and `mobile`. Exported CSS groups responsive overrides:

```css
.hero h1 {
  font-size: 52px;
}

@media (max-width: 768px) {
  .hero h1 {
    font-size: 34px;
  }
}
```

The editor applies media queries directly to the active tab. A sandboxed viewport preview remains outside this release because many sites block iframe embedding through CSP or `X-Frame-Options`.

## Google Fonts

The Fonts tab lazily opens a local metadata index containing 1,908 families, including 53 Arabic-capable families. Searching and filtering the catalog does not load font files. Selecting a family loads one preview stylesheet, and applying it persists only the chosen family, weight, and style. CSS export adds the matching Google Fonts CSS v2 import automatically.

The index is generated from the pinned `google-font-metadata` development dependency:

```bash
npm run catalog
```

The bundled catalog works without an API key. `VITE_GOOGLE_FONTS_API_KEY` is an optional developer fallback for the metadata API client. A restrictive website Content Security Policy or offline network state can prevent an external font file from loading; the editor reports that failure and keeps the CSS declaration.

## Import safety

JSON imports are limited to 2 MB and schema version 1. Selectors and declarations are validated before application. Values containing style-breaking tokens, `javascript:`, legacy CSS expressions, or other script-capable patterns are rejected. The extension never uses `eval` and does not accept arbitrary JavaScript.

## Optional environment variables

Copy `.env.example` to `.env` only when configuring optional remote integrations:

```bash
cp .env.example .env
```

```dotenv
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
VITE_GOOGLE_FONTS_API_KEY=optional_metadata_api_key
```

Do not commit `.env`. The bundled font catalog and direct image URLs work without keys. A client-side browser extension cannot make a bundled access key secret from a determined user; production Unsplash deployments should use a restricted key and follow Unsplash's current API terms.

## Testing

Run the full validation chain:

```bash
npm run validate
```

That checks formatting, TypeScript, Vitest unit tests, ESLint, and production builds.

Run the extension-page Playwright smoke test after installing Chromium:

```bash
npx playwright install chromium
npm run build
RUN_EXTENSION_E2E=1 npm run test:e2e
```

GitHub Actions also validates the repository on both Ubuntu and Windows, verifies package creation on both platforms, audits production dependencies on Ubuntu, and runs the Chromium extension smoke test.

Manual acceptance:

1. Load `dist/` unpacked.
2. Open `tests/fixtures/test-page.html` through a local HTTP server or any normal website.
3. Activate the editor and grant that origin.
4. Hover and select an element.
5. Change a basic property, then search for and edit an advanced Grid, filter, or transition property.
6. Open **Fonts**, filter by Arabic, preview a family, and apply a weight to the selection.
7. Confirm Undo and Redo.
8. Save, reload the page, and confirm styles and the selected font reapply.
9. Open Settings and confirm **Backup all designs** is available.
10. Export CSS and verify selector grouping and the single Google Fonts import.
11. Disable the editor and confirm its controls disappear while saved CSS remains.
12. Reset the page and confirm local overrides and the saved domain design are removed.

## Continuous integration and releases

Pull requests and pushes to `main` run cross-platform validation. When `public/manifest.json` changes on `main`, the release workflow validates the project again, packages the extension, and publishes the matching `v<version>` GitHub Release with `visual-style-editor-extension.zip` attached.

Release history: [CHANGELOG.md](CHANGELOG.md).

## Current phase boundaries

The following product-specification items are planned for later phases and are not advertised as part of the current release:

- Drag handles, snapping, visual resize/reorder, and distance guides.
- Persistent local text overrides and JSON text export.
- Visual Grid/Flex canvases, full matched-rule source inspection, wireframe mode, and element search.
- Unsplash browser, palette manager, graphical gradient builder, and saved asset collections.
- Named multi-preset designs, page/path scopes, custom media-query editor, and history-state jumping.
- Accessible open-Shadow-DOM traversal and permitted iframe injection.

The codebase is structured so these features can be added without replacing the inspector, storage schema boundary, or CSS exporter.

## Privacy and Chrome Web Store

Read [PRIVACY.md](PRIVACY.md) and [docs/STORE_LISTING.md](docs/STORE_LISTING.md). Before submission:

1. Update the support email and privacy-policy URL.
2. Run all validation commands.
3. Test on a clean browser profile.
4. Create the required screenshots and promotional assets.
5. Run `npm run package`.
6. Upload `visual-style-editor-extension.zip` to the Chrome Web Store dashboard.
7. Copy the permission explanations from the store-listing document.

## License

MIT. See [LICENSE](LICENSE).
