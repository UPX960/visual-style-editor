import { existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const distDirectory = resolve(projectRoot, "dist");
const output = resolve(projectRoot, "visual-style-editor-extension.zip");

if (!existsSync(distDirectory)) {
  throw new Error("dist/ is missing. Run npm run build before packaging.");
}

if (existsSync(output)) rmSync(output);

const escapePowerShellLiteral = (value) => value.replaceAll("'", "''");

const result =
  process.platform === "win32"
    ? spawnSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-Command",
          `$ErrorActionPreference = 'Stop'; Compress-Archive -Path '${escapePowerShellLiteral(
            distDirectory
          )}\\*' -DestinationPath '${escapePowerShellLiteral(output)}' -Force`
        ],
        {
          cwd: projectRoot,
          stdio: "inherit"
        }
      )
    : spawnSync("zip", ["-q", "-r", output, "."], {
        cwd: distDirectory,
        stdio: "inherit"
      });

if (result.error || result.status !== 0) {
  const platformHint =
    process.platform === "win32"
      ? "Ensure Windows PowerShell is available."
      : "Ensure the zip utility is installed.";
  throw new Error(`Could not create the extension ZIP. ${platformHint}`);
}

console.log(`Created ${output}`);
