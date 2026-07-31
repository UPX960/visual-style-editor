# Chrome Web Store Listing

## Name

Visual Style Editor

## Short description

Visually customize websites with browser-local CSS—no coding required.

## Detailed description

Visual Style Editor turns supported web pages into a local visual design workspace. Hover over an element, click to select it, then adjust more than 100 CSS properties covering typography, colors, backgrounds, spacing, dimensions, borders, positioning, Flexbox, Grid, effects, transforms, and responsive overrides from an isolated sidebar.

Changes appear instantly and remain inside your browser. Browse 1,908 indexed Google Font families, preview only the family you choose, and apply it to one element, all headings, or the entire page. Save a design for the current domain, reload the page, undo or redo edits, reset individual elements, or export clean CSS and a portable JSON project.

Key features:

- Visual hover inspector and element selection.
- Automatic CSS selector generation with match and stability feedback.
- Dark/light Shadow DOM editor that website styles cannot contaminate.
- More than 100 typography, background, box-model, sizing, border, layout, Flexbox, Grid, effects, transform, list, and transition controls.
- Complete searchable Google Fonts index with category/language filters, Arabic families, previews, weight/style selection, and recent fonts.
- Only selected Google Font families and variants are loaded.
- Base, desktop, tablet, and mobile overrides.
- Undo/redo history.
- Domain-local saves and automatic reapplication.
- Clean CSS export and validated JSON import/export.
- English and Arabic interface support.
- Browser-local privacy model with sensitive-input exclusions.

Known limitations: Chrome internal pages, the Chrome Web Store, browser-protected surfaces, closed Shadow DOM, inaccessible cross-origin iframes, and enterprise-blocked pages cannot be edited.

## Permission explanations

### `activeTab`

Used after the user clicks the extension to interact with the currently visible tab. It does not provide background access to unrelated tabs.

### `scripting`

Used to inject the packaged visual editor into a user-approved website and to register it for automatic reapplication on that origin.

### `storage`

Used to store the user’s CSS designs and editor preferences locally in Chrome.

### Optional host access

The extension declares HTTP and HTTPS access as optional. It requests only the current website origin after the user clicks **Activate visual editor**. This access is needed to inspect elements and apply the user’s local CSS on that domain. It is not used to collect browsing history or page content.

## Single purpose statement

Visual Style Editor’s single purpose is to let users create, save, and export browser-local visual CSS customizations for websites they choose.

## Remote code

The extension does not execute remote code. All JavaScript is packaged with the extension. Google Fonts supplies font stylesheets and font files only after the user previews or applies a family; these resources contain no extension JavaScript. User imports are data-only JSON/CSS declarations and are validated; arbitrary JavaScript is not accepted.

## Screenshot plan

Create five 1280 × 800 or 640 × 400 screenshots:

1. Inspector hover state on a clean landing page.
2. Selected hero heading with advanced typography controls.
3. Google Fonts search filtered to Arabic with a live preview.
4. Grid/effects controls and a mobile breakpoint override.
5. Exported CSS or saved-design settings with an Arabic interface example.

Avoid real customer data, personal information, passwords, payment pages, third-party trademarks used misleadingly, or unsupported claims.

## Promotional assets

- Store icon: 128 × 128 PNG.
- Small promo tile: 440 × 280 PNG.
- Marquee promo tile, if used: 1400 × 560 PNG.
- Screenshots: 1280 × 800 preferred.
- Visual direction: near-black canvas, violet accent `#6D5DFC`, white editor panel details, concise callouts, no excessive text.

## Pre-submission checklist

- Replace the privacy-policy contact placeholder.
- Host the privacy policy at a public HTTPS URL.
- Run typecheck, tests, lint, and production build.
- Test permission approval, denial, removal, and re-grant.
- Test clean install and upgrade.
- Test supported and restricted pages.
- Verify the ZIP root contains `manifest.json`.
- Verify no `.env`, source maps, test fixtures, or API keys are included.
