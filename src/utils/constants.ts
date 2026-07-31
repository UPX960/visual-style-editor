import type { Breakpoint, EditorSettings } from "../types";

export const APP_NAME = "Visual Style Editor";
export const ROOT_ATTRIBUTE = "data-vse-extension-root";
export const STYLE_ELEMENT_ID = "vse-user-style-overrides";
export const DESIGN_STORAGE_PREFIX = "vse:design:";
export const SETTINGS_STORAGE_KEY = "vse:settings";
export const CONTENT_SCRIPT_PREFIX = "vse-origin-";
export const PROJECT_SCHEMA_VERSION = 1 as const;
export const MAX_HISTORY = 100;

export const DEFAULT_SETTINGS: EditorSettings = {
  locale: "en",
  theme: "dark",
  dock: "right",
  panelWidth: 360,
  uiScale: 1,
  defaultScope: "domain",
  recentFonts: []
};

export const BREAKPOINT_LABELS: Record<Breakpoint, string> = {
  base: "Base",
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile"
};

export const BREAKPOINT_QUERIES: Record<Breakpoint, string | null> = {
  base: null,
  desktop: "(min-width: 1200px)",
  tablet: "(max-width: 1024px)",
  mobile: "(max-width: 768px)"
};

export const INSPECTED_PROPERTIES = [
  "color",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-transform",
  "text-decoration",
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "gap",
  "width",
  "min-width",
  "max-width",
  "height",
  "min-height",
  "max-height",
  "border-width",
  "border-style",
  "border-color",
  "border-radius",
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "overflow",
  "opacity",
  "box-shadow",
  "transform"
] as const;
