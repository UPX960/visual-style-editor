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
const result = spawnSync("zip", ["-q", "-r", output, "."], {
  cwd: distDirectory,
  stdio: "inherit"
});

if (result.status !== 0) {
  throw new Error(
    "Could not create the extension ZIP. Ensure the zip utility is installed."
  );
}

console.log(`Created ${output}`);
