# Architecture Notes

## Runtime flow

1. The popup resolves the active HTTP(S) origin.
2. A user gesture requests that origin through `chrome.permissions`.
3. The service worker registers the packaged content script for that origin and injects it into the current tab.
4. The content script loads the saved hostname project and injects generated CSS.
5. Activating the editor mounts a React application in an open Shadow DOM.
6. Document-level delegated events drive hover and selection without continuous DOM scans.
7. Zustand stores current rules, used font assets, breakpoint, selection metadata, and history snapshots.
8. A store subscription regenerates one dedicated style element after a rule change and synchronizes only the Google Font families used by the design.
9. The Fonts tab lazily reads the bundled 1,908-family metadata catalog. Previewing reuses one temporary stylesheet link; applying a family persists only the selected variants.
10. Save writes the stable rules and font metadata to Chrome Storage. A future visit receives the registered content script at `document_start` and reapplies enabled CSS.

## Boundaries

- The page DOM is read for inspection and receives one local style element.
- The extension UI lives inside its own Shadow DOM.
- Temporary single-element IDs are removed when the editor closes.
- Persistent project rules never contain temporary single-element IDs.
- No page JavaScript is evaluated or rewritten.
- Imported values pass schema, selector, property, and value checks.
- Google Fonts metadata is bundled; the selected external CSS/font files are requested only during preview or when a saved rule uses them.

## Performance decisions

- Pointer movement is throttled through `requestAnimationFrame`.
- The inspector uses delegated listeners instead of listeners on every element.
- `ResizeObserver` watches only the selected element.
- `MutationObserver` checks selection connectivity instead of rescanning the page.
- Computed styles are captured for the 100+ supported controls, not every browser-specific CSS property.
- The font catalog is loaded only when the Fonts tab opens, and results are rendered in deterministic batches of 60.
- One temporary preview link is reused so browsing the catalog cannot accumulate hundreds of font requests.
- Editor listeners and temporary UI are removed when the editor closes.
