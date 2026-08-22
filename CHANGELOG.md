# Changelog

All notable changes to Visual Style Editor are documented here.

## [0.3.0] - 2026-08-22

### Added

- One-click **Backup all designs** export from the Settings page.
- Versioned full-backup JSON format with export timestamp and all saved designs.
- GitHub Actions validation on both Ubuntu and Windows.
- Playwright extension smoke testing in CI.
- Dedicated Windows 10 / 11 installation, build, update, and troubleshooting guide for Chrome and Microsoft Edge.
- Automated release workflow that publishes the packaged extension ZIP when the extension version changes on `main`.

### Fixed

- Windows packaging no longer depends on the Unix `zip` command; it uses Windows PowerShell `Compress-Archive`.
- Repository line endings are normalized so Prettier, TypeScript, tests, linting, and builds behave consistently on Windows and Linux.

### Changed

- Extension and package version bumped to `0.3.0`.
- GitHub Actions upgraded to current Node 24-runtime action generations.
- Package description now reflects Chromium-based browser compatibility.

### Verification

The release pipeline validates formatting, TypeScript, Vitest, ESLint, production builds, packaging, ZIP creation on Windows and Ubuntu, and a real extension-page Playwright smoke test.

## [0.2.0] - 2026-07-31

- Previous public release.
