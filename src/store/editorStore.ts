import { create } from "zustand";
import { DEFAULT_SETTINGS, MAX_HISTORY } from "../utils/constants";
import { createId } from "../utils/id";
import { sanitizeCssValue } from "../utils/css";
import type {
  Breakpoint,
  EditorSettings,
  GoogleFontAsset,
  HistoryActionType,
  HistoryEntry,
  InspectorMode,
  SelectedElementInfo,
  StyleRule
} from "../types";

interface RuleSnapshot {
  rules: StyleRule[];
  fontAssets: GoogleFontAsset[];
}

interface ChangeDescriptor {
  selector: string;
  property: string;
  previousValue: string;
  newValue: string;
  breakpoint: Breakpoint;
  actionType: HistoryActionType;
}

interface EditorState {
  active: boolean;
  panelVisible: boolean;
  minimized: boolean;
  inspectorEnabled: boolean;
  inspectorMode: InspectorMode;
  pinned: boolean;
  selected: SelectedElementInfo | null;
  breakpoint: Breakpoint;
  rules: StyleRule[];
  fontAssets: GoogleFontAsset[];
  history: HistoryEntry[];
  past: RuleSnapshot[];
  future: RuleSnapshot[];
  settings: EditorSettings;
  toast: string | null;
  setActive: (active: boolean) => void;
  setPanelVisible: (visible: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setInspectorEnabled: (enabled: boolean) => void;
  setInspectorMode: (mode: InspectorMode) => void;
  setPinned: (pinned: boolean) => void;
  setSelected: (selected: SelectedElementInfo | null) => void;
  setBreakpoint: (breakpoint: Breakpoint) => void;
  setSettings: (settings: EditorSettings) => void;
  patchSettings: (settings: Partial<EditorSettings>) => void;
  loadProject: (rules: StyleRule[], fontAssets?: GoogleFontAsset[]) => void;
  addFontAsset: (asset: GoogleFontAsset) => void;
  clearFontAssets: () => void;
  setToast: (toast: string | null) => void;
  updateDeclaration: (selector: string, property: string, value: string) => boolean;
  resetSelected: (selector: string) => void;
  resetAll: () => void;
  undo: () => void;
  redo: () => void;
  importRules: (rules: StyleRule[], fontAssets?: GoogleFontAsset[]) => void;
}

function cloneRules(rules: StyleRule[]): StyleRule[] {
  return rules.map((rule) => ({
    ...rule,
    declarations: { ...rule.declarations }
  }));
}

function cloneFontAssets(fontAssets: GoogleFontAsset[]): GoogleFontAsset[] {
  return fontAssets.map((asset) => ({
    ...asset,
    weights: [...asset.weights],
    styles: [...asset.styles],
    subsets: [...asset.subsets]
  }));
}

function createHistoryEntry(change: ChangeDescriptor): HistoryEntry {
  return {
    id: createId("history"),
    ...change,
    timestamp: Date.now()
  };
}

function pushChange(
  state: EditorState,
  rules: StyleRule[],
  change: ChangeDescriptor
): Partial<EditorState> {
  return {
    rules,
    past: [
      ...state.past,
      {
        rules: cloneRules(state.rules),
        fontAssets: cloneFontAssets(state.fontAssets)
      }
    ].slice(-MAX_HISTORY),
    future: [],
    history: [...state.history, createHistoryEntry(change)].slice(-MAX_HISTORY)
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  active: false,
  panelVisible: false,
  minimized: false,
  inspectorEnabled: true,
  inspectorMode: "flexible",
  pinned: false,
  selected: null,
  breakpoint: "base",
  rules: [],
  fontAssets: [],
  history: [],
  past: [],
  future: [],
  settings: DEFAULT_SETTINGS,
  toast: null,

  setActive: (active) => set({ active }),
  setPanelVisible: (panelVisible) => set({ panelVisible }),
  setMinimized: (minimized) => set({ minimized }),
  setInspectorEnabled: (inspectorEnabled) => set({ inspectorEnabled }),
  setInspectorMode: (inspectorMode) => set({ inspectorMode }),
  setPinned: (pinned) => set({ pinned, inspectorEnabled: !pinned }),
  setSelected: (selected) => set({ selected }),
  setBreakpoint: (breakpoint) => set({ breakpoint }),
  setSettings: (settings) => set({ settings }),
  patchSettings: (settings) =>
    set((state) => ({ settings: { ...state.settings, ...settings } })),
  setToast: (toast) => set({ toast }),

  loadProject: (rules, fontAssets = []) =>
    set({
      rules: cloneRules(rules),
      fontAssets: cloneFontAssets(fontAssets),
      history: [],
      past: [],
      future: []
    }),

  addFontAsset: (asset) =>
    set((state) => {
      const existing = state.fontAssets.find((item) => item.family === asset.family);
      if (!existing) {
        return {
          fontAssets: [
            ...state.fontAssets,
            { ...asset, weights: [...asset.weights], styles: [...asset.styles] }
          ]
        };
      }
      return {
        fontAssets: state.fontAssets.map((item) =>
          item.family === asset.family
            ? {
                ...item,
                ...asset,
                weights: Array.from(new Set([...item.weights, ...asset.weights])).sort(
                  (a, b) => a - b
                ),
                styles: Array.from(new Set([...item.styles, ...asset.styles])),
                subsets: Array.from(new Set([...item.subsets, ...asset.subsets]))
              }
            : item
        )
      };
    }),

  clearFontAssets: () => set({ fontAssets: [] }),

  updateDeclaration: (selector, property, rawValue) => {
    const state = get();
    const value = sanitizeCssValue(property, rawValue);
    if (value === null) return false;

    const rules = cloneRules(state.rules);
    let rule = rules.find(
      (candidate) =>
        candidate.selector === selector && candidate.breakpoint === state.breakpoint
    );
    const previousValue = rule?.declarations[property] ?? "";
    if (previousValue === value) return true;

    if (!rule && value) {
      rule = {
        id: createId("rule"),
        selector,
        declarations: {},
        breakpoint: state.breakpoint,
        updatedAt: Date.now()
      };
      rules.push(rule);
    }

    if (rule) {
      if (value) rule.declarations[property] = value;
      else delete rule.declarations[property];
      rule.updatedAt = Date.now();
      if (Object.keys(rule.declarations).length === 0) {
        rules.splice(rules.indexOf(rule), 1);
      }
    }

    set(
      pushChange(state, rules, {
        selector,
        property,
        previousValue,
        newValue: value,
        breakpoint: state.breakpoint,
        actionType:
          property === "display" && value === "none" ? "hide-element" : "style-change"
      })
    );
    return true;
  },

  resetSelected: (selector) => {
    const state = get();
    const matchingRules = state.rules.filter((rule) => rule.selector === selector);
    if (matchingRules.length === 0) return;
    const rules = state.rules.filter((rule) => rule.selector !== selector);
    set(
      pushChange(state, cloneRules(rules), {
        selector,
        property: "*",
        previousValue: `${matchingRules.length} rule(s)`,
        newValue: "",
        breakpoint: state.breakpoint,
        actionType: "reset-element"
      })
    );
  },

  resetAll: () => {
    const state = get();
    if (state.rules.length === 0) return;
    set(
      pushChange(state, [], {
        selector: "*",
        property: "*",
        previousValue: `${state.rules.length} rule(s)`,
        newValue: "",
        breakpoint: state.breakpoint,
        actionType: "reset-page"
      })
    );
  },

  undo: () => {
    const state = get();
    const previous = state.past.at(-1);
    if (!previous) return;
    set({
      rules: cloneRules(previous.rules),
      fontAssets: cloneFontAssets(previous.fontAssets),
      past: state.past.slice(0, -1),
      future: [
        {
          rules: cloneRules(state.rules),
          fontAssets: cloneFontAssets(state.fontAssets)
        },
        ...state.future
      ].slice(0, MAX_HISTORY)
    });
  },

  redo: () => {
    const state = get();
    const next = state.future[0];
    if (!next) return;
    set({
      rules: cloneRules(next.rules),
      fontAssets: cloneFontAssets(next.fontAssets),
      past: [
        ...state.past,
        {
          rules: cloneRules(state.rules),
          fontAssets: cloneFontAssets(state.fontAssets)
        }
      ].slice(-MAX_HISTORY),
      future: state.future.slice(1)
    });
  },

  importRules: (rules, fontAssets = []) => {
    const state = get();
    set({
      ...pushChange(state, cloneRules(rules), {
        selector: "*",
        property: "*",
        previousValue: `${state.rules.length} rule(s)`,
        newValue: `${rules.length} rule(s)`,
        breakpoint: state.breakpoint,
        actionType: "import"
      }),
      fontAssets: cloneFontAssets(fontAssets)
    });
  }
}));
