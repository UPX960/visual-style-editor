import { describe, expect, it } from "vitest";
import { PROPERTY_GROUPS } from "../../src/editor/propertyDefinitions";

describe("advanced property controls", () => {
  it("exposes more than one hundred unique CSS properties", () => {
    const properties = PROPERTY_GROUPS.flatMap((group) =>
      group.properties.map((definition) => definition.property)
    );

    expect(properties.length).toBeGreaterThan(100);
    expect(new Set(properties).size).toBe(properties.length);
  });

  it("covers advanced layout, responsive sizing, and effects", () => {
    const properties = new Set(
      PROPERTY_GROUPS.flatMap((group) =>
        group.properties.map((definition) => definition.property)
      )
    );

    [
      "grid-template-columns",
      "flex-basis",
      "aspect-ratio",
      "backdrop-filter",
      "transition-timing-function"
    ].forEach((property) => expect(properties.has(property)).toBe(true));
  });
});
