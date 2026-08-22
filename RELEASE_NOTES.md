# Visual Style Editor v0.3.0

This release makes Visual Style Editor easier to back up, build, test, and install on Windows while keeping the extension local-first and Manifest V3 compatible.

## Highlights

- **Backup all saved designs:** Settings now includes a one-click JSON backup containing every saved domain design, a schema version, and export timestamp.
- **Windows 10 / 11 packaging:** `npm run package` works natively on Windows through the built-in PowerShell `Compress-Archive` command. A separate Unix `zip` utility is no longer required on Windows.
- **Chrome + Microsoft Edge instructions:** The repository now includes a dedicated Windows guide covering installation from a release, source builds, updates, PowerShell execution-policy workarounds, and troubleshooting.
- **Cross-platform CI:** Formatting, TypeScript, unit tests, linting, production builds, and packaging are validated on both Ubuntu and Windows. A Playwright smoke test loads the built extension in Chromium and verifies the popup/settings experience.
- **Consistent line endings:** Repository text files are normalized to LF so Windows checkout no longer causes false Prettier failures.

## Windows quick install

1. Download `visual-style-editor-extension.zip` from this release.
2. Extract the ZIP to a permanent folder.
3. Chrome: open `chrome://extensions`. Edge: open `edge://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
6. Pin the extension, open a regular website, and choose **Activate visual editor**.

See `docs/WINDOWS.md` for the complete Windows 10 / 11 guide in English and Arabic.

## Verification performed

- Prettier format check
- TypeScript typecheck
- 20 Vitest unit tests
- ESLint
- Vite production builds
- Linux extension packaging + ZIP verification
- Windows extension packaging + ZIP verification
- Playwright extension smoke test
