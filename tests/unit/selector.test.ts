import { beforeEach, describe, expect, it } from "vitest";
import {
  calculateSpecificity,
  generateSelector,
  isStableClassName,
  validateSelector
} from "../../src/utils/selector";

describe("selector generator", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("prefers a safe unique id", () => {
    document.body.innerHTML = `<main><button id="checkout-button">Pay now</button></main>`;
    const button = document.querySelector("button")!;
    const result = generateSelector(button);
    expect(result.selector).toBe("#checkout-button");
    expect(result.matchCount).toBe(1);
    expect(result.stabilityScore).toBeGreaterThan(90);
  });

  it("uses a semantic data attribute before structural selectors", () => {
    document.body.innerHTML = `
      <section>
        <button data-testid="hero-cta" class="css-a91b82fd">Start</button>
      </section>
    `;
    const button = document.querySelector("button")!;
    const result = generateSelector(button);
    expect(result.selector).toBe('button[data-testid="hero-cta"]');
    expect(result.matchCount).toBe(1);
  });

  it("builds a unique structural selector when classes are shared", () => {
    document.body.innerHTML = `
      <main class="layout">
        <section class="card"><p class="copy">One</p></section>
        <section class="card"><p class="copy">Two</p></section>
      </main>
    `;
    const target = document.querySelectorAll("p")[1];
    const result = generateSelector(target);
    expect(document.querySelectorAll(result.selector)).toHaveLength(1);
    expect(result.selector).toContain("nth-of-type");
  });

  it("creates a session-only selector in single mode", () => {
    document.body.innerHTML = `<div class="same"></div><div class="same"></div>`;
    const target = document.querySelector("div")!;
    const result = generateSelector(target, "single");
    expect(result.selector).toContain("data-visual-editor-id");
    expect(target.hasAttribute("data-visual-editor-id")).toBe(true);
    expect(result.warnings[0]).toContain("current page session");
  });

  it("rejects unstable generated-looking classes", () => {
    expect(isStableClassName("hero-title")).toBe(true);
    expect(isStableClassName("css-a91b82fd")).toBe(false);
    expect(isStableClassName("jsx-123456")).toBe(false);
  });

  it("validates manual selectors and calculates specificity", () => {
    document.body.innerHTML = `<div id="app"><button class="primary">Go</button></div>`;
    expect(validateSelector("#app .primary").valid).toBe(true);
    expect(validateSelector("button{color:red}").valid).toBe(false);
    expect(calculateSpecificity("#app .primary")).toBe("1,1,0");
  });
});
