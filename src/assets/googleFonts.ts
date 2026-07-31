import type { GoogleFontAsset, GoogleFontCatalogItem } from "../types";

interface GoogleFontsApiFamily {
  family: string;
  category: string;
  variants: string[];
  subsets: string[];
  axes?: Array<{ tag: string; start: number; end: number }>;
}

interface GoogleFontsApiResponse {
  items?: GoogleFontsApiFamily[];
}

interface BundledGoogleFontsCatalog {
  schemaVersion: 1;
  source: string;
  count: number;
  fonts: GoogleFontCatalogItem[];
}

function fontId(family: string): string {
  return family
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function variantWeight(variant: string): number {
  if (variant === "regular" || variant === "italic") return 400;
  return Number.parseInt(variant.replace("italic", ""), 10) || 400;
}

export async function loadBundledGoogleFontsCatalog(): Promise<GoogleFontCatalogItem[]> {
  const url =
    typeof chrome !== "undefined" && chrome.runtime?.getURL
      ? chrome.runtime.getURL("catalog/google-fonts.json")
      : "/catalog/google-fonts.json";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Bundled Google Fonts catalog could not be loaded.");
  const payload = (await response.json()) as BundledGoogleFontsCatalog;
  if (payload.schemaVersion !== 1 || !Array.isArray(payload.fonts)) {
    throw new Error("Google Fonts catalog format is invalid.");
  }
  return payload.fonts;
}

export async function fetchGoogleFontsCatalog(
  apiKey = import.meta.env.VITE_GOOGLE_FONTS_API_KEY as string | undefined
): Promise<GoogleFontCatalogItem[]> {
  if (!apiKey) throw new Error("VITE_GOOGLE_FONTS_API_KEY is not configured.");

  const endpoint = new URL("https://www.googleapis.com/webfonts/v1/webfonts");
  endpoint.searchParams.set("key", apiKey);
  endpoint.searchParams.set("sort", "popularity");
  endpoint.searchParams.set("capability", "WOFF2");

  const response = await fetch(endpoint, { referrerPolicy: "no-referrer" });
  if (!response.ok) throw new Error(`Google Fonts request failed (${response.status}).`);
  const payload = (await response.json()) as GoogleFontsApiResponse;

  return (payload.items ?? []).map((font) => ({
    id: fontId(font.family),
    family: font.family,
    category: font.category,
    weights: Array.from(new Set(font.variants.map(variantWeight))).sort((a, b) => a - b),
    styles: Array.from(
      new Set(
        font.variants.map((variant) => (variant.includes("italic") ? "italic" : "normal"))
      )
    ),
    subsets: font.subsets,
    variable: Boolean(font.axes?.length)
  }));
}

function sanitizeFamily(family: string): string {
  return family
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .slice(0, 100);
}

export function googleFontCssUrl(
  family: string,
  weights: number[] = [400],
  styles: string[] = ["normal"]
): string {
  const safeFamily = sanitizeFamily(family);
  const safeWeights = Array.from(
    new Set(weights.filter((weight) => weight >= 100 && weight <= 900))
  ).sort((a, b) => a - b);
  const requestedWeights = safeWeights.length > 0 ? safeWeights : [400];
  const includesNormal = styles.includes("normal");
  const includesItalic = styles.includes("italic");
  const encodedFamily = encodeURIComponent(safeFamily).replace(/%20/g, "+");

  let specification = `${encodedFamily}:wght@${requestedWeights.join(";")}`;
  if (includesItalic) {
    const tuples = [
      ...(includesNormal ? requestedWeights.map((weight) => `0,${weight}`) : []),
      ...requestedWeights.map((weight) => `1,${weight}`)
    ];
    specification = `${encodedFamily}:ital,wght@${tuples.join(";")}`;
  }
  return `https://fonts.googleapis.com/css2?family=${specification}&display=swap`;
}

export function googleFontStack(
  font: Pick<GoogleFontAsset, "family" | "category">
): string {
  const family = sanitizeFamily(font.family).replace(/"/g, '\\"');
  const fallback =
    font.category === "handwriting" || font.category === "display"
      ? "cursive"
      : ["serif", "sans-serif", "monospace"].includes(font.category)
        ? font.category
        : "sans-serif";
  return `"${family}", ${fallback}`;
}

export function toGoogleFontAsset(
  font: GoogleFontCatalogItem,
  weight: number,
  style: string
): GoogleFontAsset {
  return {
    family: font.family,
    category: font.category,
    weights: [weight],
    styles: [style],
    subsets: font.subsets
  };
}
