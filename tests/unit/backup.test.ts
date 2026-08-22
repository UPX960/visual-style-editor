import { describe, expect, it } from "vitest";
import * as cssUtils from "../../src/utils/css";
import type { DesignProject } from "../../src/types";

const exampleDesign: DesignProject = {
  schemaVersion: 1,
  id: "design-example",
  name: "Example design",
  hostname: "example.com",
  sourceUrl: "https://example.com/",
  scope: "domain",
  enabled: true,
  rules: [],
  fontAssets: [],
  textOverrides: [],
  createdAt: 1,
  updatedAt: 2
};

describe("design backup export", () => {
  it("serializes all saved designs into a versioned backup document", () => {
    const cssModule = cssUtils as unknown as Record<string, unknown>;
    const serializer = cssModule.serializeDesignBackup;

    expect(typeof serializer).toBe("function");
    if (typeof serializer !== "function") return;

    const output = (serializer as (designs: DesignProject[]) => string)([
      exampleDesign
    ]);
    const backup = JSON.parse(output) as {
      schemaVersion: number;
      exportedAt: string;
      designs: DesignProject[];
    };

    expect(backup.schemaVersion).toBe(1);
    expect(Number.isNaN(Date.parse(backup.exportedAt))).toBe(false);
    expect(backup.designs).toEqual([exampleDesign]);
  });
});
