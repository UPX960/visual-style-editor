export type Breakpoint = "base" | "desktop" | "tablet" | "mobile";
export type DesignScope = "domain" | "page";
export type InspectorMode = "flexible" | "single";
export type ThemeMode = "dark" | "light";
export type DockPosition = "left" | "right";
export type Locale = "en" | "ar";

export interface RectSnapshot {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface SelectorMetadata {
  selector: string;
  matchCount: number;
  specificity: string;
  stabilityScore: number;
  warnings: string[];
  mode: InspectorMode;
}

export interface SelectedElementInfo {
  tagName: string;
  id: string;
  classes: string[];
  label: string;
  rect: RectSnapshot;
  selector: SelectorMetadata;
  computed: Record<string, string>;
}

export interface StyleRule {
  id: string;
  selector: string;
  declarations: Record<string, string>;
  breakpoint: Breakpoint;
  mediaQuery?: string;
  updatedAt: number;
}

export type HistoryActionType =
  "style-change" | "hide-element" | "reset-element" | "reset-page" | "import";

export interface HistoryEntry {
  id: string;
  selector: string;
  property: string;
  previousValue: string;
  newValue: string;
  breakpoint: Breakpoint;
  timestamp: number;
  actionType: HistoryActionType;
}

export interface TextOverride {
  selector: string;
  originalText: string;
  value: string;
}

export interface GoogleFontAsset {
  family: string;
  category: string;
  weights: number[];
  styles: string[];
  subsets: string[];
}

export interface GoogleFontCatalogItem extends GoogleFontAsset {
  id: string;
  variable: boolean;
}

export interface DesignProject {
  schemaVersion: 1;
  id: string;
  name: string;
  hostname: string;
  sourceUrl: string;
  scope: DesignScope;
  enabled: boolean;
  rules: StyleRule[];
  fontAssets: GoogleFontAsset[];
  textOverrides: TextOverride[];
  createdAt: number;
  updatedAt: number;
}

export interface EditorSettings {
  locale: Locale;
  theme: ThemeMode;
  dock: DockPosition;
  panelWidth: number;
  uiScale: number;
  defaultScope: DesignScope;
  recentFonts: string[];
}

export type RuntimeRequest =
  | { type: "VSE_ENSURE_ORIGIN_SCRIPT"; originPattern: string }
  | { type: "VSE_INJECT"; tabId: number }
  | { type: "VSE_TOGGLE" }
  | { type: "VSE_SET_ACTIVE"; active: boolean }
  | { type: "VSE_GET_STATUS" }
  | { type: "VSE_RESET_PAGE" }
  | { type: "VSE_UNDO" }
  | { type: "VSE_REDO" };

export interface RuntimeResponse {
  ok: boolean;
  active?: boolean;
  saved?: boolean;
  ruleCount?: number;
  error?: string;
}
