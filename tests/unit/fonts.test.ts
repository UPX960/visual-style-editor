import { describe, expect, it } from "vitest";
import catalog from "../../public/catalog/google-fonts.json";
import {
  googleFontCssUrl,
  googleFontStack,
  toGoogleFontAsset
} from "../../src/assets/googleFonts";

describe("Google Fonts catalog", () => {
  it("contains the complete generated family index and Arabic-capable fonts", () => {
    expect(catalog.count).toBe(catalog.fonts.length);
    expect(catalog.fonts.length).toBeGreaterThan(1800);
    expect(
      catalog.fonts.filter((font) => font.subsets.includes("arabic")).length
    ).toBeGreaterThan(40);
    expect(catalog.fonts.some((font) => font.family === "Noto Kufi Arabic")).toBe(true);
  });

  it("builds a valid CSS v2 URL for normal and italic weights", () => {
    const url = googleFontCssUrl("Noto Kufi Arabic", [700, 400], ["normal", "italic"]);
    expect(url).toBe(
      "https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:ital,wght@0,400;0,700;1,400;1,700&display=swap"
    );
  });

  it("creates a safe font stack and persistent asset", () => {
    const font = catalog.fonts.find((item) => item.family === "Noto Kufi Arabic")!;
    expect(googleFontStack(font)).toBe('"Noto Kufi Arabic", sans-serif');
    expect(toGoogleFontAsset(font, 700, "normal")).toMatchObject({
      family: "Noto Kufi Arabic",
      weights: [700],
      styles: ["normal"]
    });
  });
});
