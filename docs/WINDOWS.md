# Windows 10 / 11 Guide

Visual Style Editor v0.3.0 supports Windows 10 and Windows 11 with current Chromium-based browsers. You do **not** need Node.js to install a published release. Node.js is only required when building from source.

## Quick install from a release

### Google Chrome

1. Open the repository's **Releases** page and download `visual-style-editor-extension.zip` from the latest release.
2. Right-click the ZIP and choose **Extract All**. Keep the extracted folder in a permanent location; Chrome references that folder after installation.
3. Open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Click **Load unpacked**.
6. Select the extracted folder that directly contains `manifest.json`.
7. Pin **Visual Style Editor** from the extensions menu.
8. Open a normal `http://` or `https://` website, click the extension, choose **Activate visual editor**, and approve access to that site when Chrome asks.

### Microsoft Edge

1. Download and extract `visual-style-editor-extension.zip` from the latest release.
2. Open `edge://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted folder that directly contains `manifest.json`.
6. Pin the extension, open a normal website, and activate the visual editor.

> Chrome and Edge cannot load an unpacked extension directly from a ZIP file. Extract it first.

## Updating an installed release

1. Download the newer release ZIP.
2. Extract it to a new permanent folder, or replace the files in the folder you already use.
3. Open `chrome://extensions` or `edge://extensions`.
4. Click **Reload** on Visual Style Editor.
5. Confirm the version shown by the browser matches the new release.

Saved domain designs and editor preferences live in browser extension storage, so rebuilding or replacing the unpacked folder does not normally remove them. Use **Settings → Backup all designs** before major browser/profile changes if you want an additional JSON backup.

## Build from source on Windows 10 / 11

### Requirements

- Windows 10 or Windows 11
- Git
- Node.js 20 or newer
- npm 10 or newer
- Google Chrome or Microsoft Edge
- Windows PowerShell (included with Windows)

Open **PowerShell** or **Windows Terminal**:

```powershell
git clone https://github.com/UPX960/visual-style-editor.git
cd visual-style-editor
npm ci
npm run validate
npm run package
```

`npm run package` now uses Windows PowerShell's built-in `Compress-Archive` on Windows, so a separate Unix-style `zip` executable is not required.

Build outputs:

- `dist\` — load this directory with **Load unpacked**.
- `visual-style-editor-extension.zip` — packaged extension archive.

## If PowerShell blocks npm scripts

Some Windows setups block the `npm.ps1` shim because of the local execution policy. You do not need to weaken the machine-wide policy. Use Command Prompt, or call the executable shim directly:

```powershell
npm.cmd ci
npm.cmd run validate
npm.cmd run package
```

## Windows troubleshooting

### “Manifest file is missing or unreadable”

You selected the wrong folder. Choose the extracted folder whose top level contains `manifest.json`, not its parent folder and not the ZIP file.

### The editor does not appear on a page

- Reload the extension from the browser's extensions page.
- Reload the website tab.
- Activate the editor again and approve the requested site permission.
- Browser-internal pages, extension stores, protected pages, and some enterprise-managed pages cannot be edited.

### My saved styles are not reapplying

Open Visual Style Editor settings and confirm the saved domain design is **Enabled**. Also verify the extension still has permission for that website.

---

# دليل Windows 10 / 11 بالعربية

الإصدار v0.3.0 يدعم Windows 10 وWindows 11 مع Chrome وMicrosoft Edge. لتثبيت النسخة المنشورة لا تحتاج Node.js؛ تحتاجه فقط إذا أردت بناء المشروع من المصدر.

## التثبيت السريع

1. افتح صفحة **Releases** في المستودع وحمّل `visual-style-editor-extension.zip` من أحدث إصدار.
2. فك الضغط عبر **Extract All** وضع المجلد في مكان ثابت.
3. في Chrome افتح `chrome://extensions`، أو في Edge افتح `edge://extensions`.
4. فعّل **Developer mode**.
5. اختر **Load unpacked**.
6. اختر المجلد الذي يحتوي `manifest.json` مباشرة.
7. ثبّت الإضافة في شريط المتصفح، وافتح أي موقع عادي يبدأ بـ `http://` أو `https://`.
8. اضغط **Activate visual editor** ووافق على صلاحية الموقع عند الطلب.

> لا تختَر ملف ZIP مباشرة؛ يجب فك الضغط أولًا.

## البناء من المصدر على Windows

من PowerShell أو Windows Terminal:

```powershell
git clone https://github.com/UPX960/visual-style-editor.git
cd visual-style-editor
npm ci
npm run validate
npm run package
```

أمر `npm run package` يستخدم الآن `Compress-Archive` المدمج في Windows PowerShell، لذلك لا تحتاج لتثبيت أمر `zip` الخاص بأنظمة Unix.

إذا منع PowerShell تشغيل `npm.ps1` استخدم `npm.cmd` بدل تغيير سياسة النظام:

```powershell
npm.cmd ci
npm.cmd run validate
npm.cmd run package
```

قبل تغيير بروفايل المتصفح أو نقل بياناتك، تستطيع من صفحة الإعدادات استخدام **Backup all designs** لتنزيل نسخة JSON واحدة تشمل جميع التصاميم المحفوظة.
