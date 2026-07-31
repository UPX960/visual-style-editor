import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { APIv2, APIVariable } from "google-font-metadata";

const outputPath = resolve(process.cwd(), "public/catalog/google-fonts.json");
const variableIds = new Set(Object.keys(APIVariable));
const fonts = Object.values(APIv2)
  .map((font) => ({
    id: font.id,
    family: font.family,
    category: font.category,
    weights: font.weights,
    styles: font.styles,
    subsets: font.subsets.filter((subset) => !subset.startsWith("[")),
    variable: variableIds.has(font.id)
  }))
  .sort((a, b) => a.family.localeCompare(b.family));

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `${JSON.stringify({
    schemaVersion: 1,
    source: "Google Fonts metadata",
    count: fonts.length,
    fonts
  })}\n`
);

console.log(`Generated ${fonts.length} Google Fonts families at ${outputPath}`);
