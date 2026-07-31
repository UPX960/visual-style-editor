import { beforeEach, describe, expect, it } from "vitest";
import { useEditorStore } from "../../src/store/editorStore";

describe("editor history", () => {
  beforeEach(() => {
    const state = useEditorStore.getState();
    state.loadProject([]);
    state.setBreakpoint("base");
  });

  it("creates rules and supports undo and redo", () => {
    const state = useEditorStore.getState();
    expect(state.updateDeclaration(".hero", "color", "#ffffff")).toBe(true);
    expect(useEditorStore.getState().rules[0].declarations.color).toBe("#ffffff");

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().rules).toHaveLength(0);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().rules[0].declarations.color).toBe("#ffffff");
  });

  it("keeps breakpoint overrides separate", () => {
    const state = useEditorStore.getState();
    state.updateDeclaration(".hero", "font-size", "40px");
    useEditorStore.getState().setBreakpoint("mobile");
    useEditorStore.getState().updateDeclaration(".hero", "font-size", "24px");
    expect(useEditorStore.getState().rules).toHaveLength(2);
  });

  it("rejects unsafe CSS values without creating history", () => {
    const accepted = useEditorStore
      .getState()
      .updateDeclaration(".hero", "color", "red; } html { display:none");
    expect(accepted).toBe(false);
    expect(useEditorStore.getState().rules).toHaveLength(0);
  });

  it("merges Google Font variants without duplicating the family", () => {
    const state = useEditorStore.getState();
    state.addFontAsset({
      family: "Noto Kufi Arabic",
      category: "sans-serif",
      weights: [400],
      styles: ["normal"],
      subsets: ["arabic"]
    });
    useEditorStore.getState().addFontAsset({
      family: "Noto Kufi Arabic",
      category: "sans-serif",
      weights: [700],
      styles: ["italic"],
      subsets: ["arabic", "latin"]
    });
    expect(useEditorStore.getState().fontAssets).toHaveLength(1);
    expect(useEditorStore.getState().fontAssets[0].weights).toEqual([400, 700]);
    expect(useEditorStore.getState().fontAssets[0].styles).toEqual(["normal", "italic"]);
  });
});
