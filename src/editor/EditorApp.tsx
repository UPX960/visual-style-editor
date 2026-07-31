import {
  ArrowDownToLine,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Code2,
  Download,
  GripVertical,
  Languages,
  Maximize2,
  Minimize2,
  Moon,
  PanelLeft,
  PanelRight,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Sun,
  Undo2,
  Upload,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { translate } from "../i18n";
import { useEditorStore } from "../store/editorStore";
import type { EditorSettings, InspectorMode } from "../types";
import type { GoogleFontCatalogItem } from "../types";
import { BoxModelEditor } from "./components/BoxModelEditor";
import { FloatingToolbar } from "./components/FloatingToolbar";
import { GoogleFontsPanel } from "./components/GoogleFontsPanel";
import { PropertyControl } from "./components/PropertyControl";
import { PROPERTY_GROUPS } from "./propertyDefinitions";

type PanelTab = "properties" | "fonts" | "selector" | "history";

export interface EditorActions {
  close: () => void;
  save: () => Promise<void>;
  exportCss: () => Promise<void>;
  exportJson: () => void;
  importJson: (file: File) => Promise<void>;
  resetPage: () => Promise<void>;
  previewGoogleFont: (
    font: GoogleFontCatalogItem,
    weight: number,
    style: string
  ) => Promise<void>;
  applyGoogleFont: (
    font: GoogleFontCatalogItem,
    weight: number,
    style: string,
    target: "selected" | "headings" | "page"
  ) => Promise<void>;
  copySelector: () => Promise<void>;
  updateSelector: (selector: string) => { ok: boolean; error?: string };
  setInspectorMode: (mode: InspectorMode) => void;
  selectRelative: (relation: "parent" | "previous" | "next") => void;
  updateSettings: (settings: Partial<EditorSettings>) => Promise<void>;
}

interface EditorAppProps {
  actions: EditorActions;
}

export function EditorApp({ actions }: EditorAppProps) {
  const active = useEditorStore((state) => state.active);
  const panelVisible = useEditorStore((state) => state.panelVisible);
  const minimized = useEditorStore((state) => state.minimized);
  const inspectorEnabled = useEditorStore((state) => state.inspectorEnabled);
  const inspectorMode = useEditorStore((state) => state.inspectorMode);
  const selected = useEditorStore((state) => state.selected);
  const breakpoint = useEditorStore((state) => state.breakpoint);
  const rules = useEditorStore((state) => state.rules);
  const history = useEditorStore((state) => state.history);
  const past = useEditorStore((state) => state.past);
  const future = useEditorStore((state) => state.future);
  const settings = useEditorStore((state) => state.settings);
  const toast = useEditorStore((state) => state.toast);
  const setToast = useEditorStore((state) => state.setToast);
  const setMinimized = useEditorStore((state) => state.setMinimized);
  const setInspectorEnabled = useEditorStore((state) => state.setInspectorEnabled);
  const setBreakpoint = useEditorStore((state) => state.setBreakpoint);
  const updateDeclaration = useEditorStore((state) => state.updateDeclaration);
  const resetSelected = useEditorStore((state) => state.resetSelected);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const [tab, setTab] = useState<PanelTab>("properties");
  const [propertySearch, setPropertySearch] = useState("");
  const [selectorDraft, setSelectorDraft] = useState("");
  const [selectorError, setSelectorError] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    background: true,
    spacing: true,
    dimensions: true,
    borders: true,
    layout: true,
    flexbox: true,
    grid: true,
    effects: true,
    lists: true,
    motion: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = (key: Parameters<typeof translate>[1]) => translate(settings.locale, key);

  useEffect(() => {
    setSelectorDraft(selected?.selector.selector ?? "");
    setSelectorError("");
  }, [selected?.selector.selector]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast, setToast]);

  const activeRule = useMemo(
    () =>
      selected
        ? rules.find(
            (rule) =>
              rule.selector === selected.selector.selector &&
              rule.breakpoint === breakpoint
          )
        : undefined,
    [breakpoint, rules, selected]
  );

  const filteredGroups = useMemo(() => {
    const query = propertySearch.trim().toLowerCase();
    if (!query) return PROPERTY_GROUPS;
    return PROPERTY_GROUPS.map((group) => ({
      ...group,
      properties: group.properties.filter(
        (property) =>
          property.label.toLowerCase().includes(query) ||
          property.property.toLowerCase().includes(query)
      )
    })).filter((group) => group.properties.length > 0);
  }, [propertySearch]);

  if (!active) return null;

  const direction = settings.locale === "ar" ? "rtl" : "ltr";
  const panelClass = [
    "vse-sidebar",
    `theme-${settings.theme}`,
    `dock-${settings.dock}`,
    minimized ? "is-minimized" : ""
  ].join(" ");

  const commitSelector = () => {
    const result = actions.updateSelector(selectorDraft);
    setSelectorError(result.ok ? "" : result.error || "Invalid selector");
  };

  return (
    <div
      className={`vse-app theme-${settings.theme}`}
      dir={direction}
      style={{ fontSize: `${settings.uiScale * 13}px` }}
    >
      {panelVisible && (
        <aside
          className={panelClass}
          style={{ width: minimized ? "54px" : `${settings.panelWidth}px` }}
          aria-label="Visual Style Editor"
        >
          {minimized ? (
            <div className="vse-minimized-bar">
              <button
                type="button"
                className="vse-brand-mark"
                onClick={() => setMinimized(false)}
                aria-label="Expand editor"
              >
                V
              </button>
              <button
                type="button"
                className="vse-icon-button"
                onClick={() => setInspectorEnabled(!inspectorEnabled)}
                title={inspectorEnabled ? t("paused") : t("inspecting")}
              >
                {inspectorEnabled ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                type="button"
                className="vse-icon-button"
                onClick={() => setMinimized(false)}
                title="Expand"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          ) : (
            <>
              <header className="vse-header">
                <div className="vse-brand">
                  <span className="vse-brand-mark">V</span>
                  <div>
                    <strong>{t("appName")}</strong>
                    <small>{inspectorEnabled ? t("inspecting") : t("paused")}</small>
                  </div>
                </div>
                <div className="vse-header-actions">
                  <button
                    type="button"
                    className="vse-icon-button"
                    onClick={() =>
                      actions.updateSettings({
                        theme: settings.theme === "dark" ? "light" : "dark"
                      })
                    }
                    title={settings.theme === "dark" ? t("light") : t("dark")}
                  >
                    {settings.theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                  </button>
                  <button
                    type="button"
                    className="vse-icon-button"
                    onClick={() =>
                      actions.updateSettings({
                        dock: settings.dock === "right" ? "left" : "right"
                      })
                    }
                    title={settings.dock === "right" ? t("dockLeft") : t("dockRight")}
                  >
                    {settings.dock === "right" ? (
                      <PanelLeft size={15} />
                    ) : (
                      <PanelRight size={15} />
                    )}
                  </button>
                  <button
                    type="button"
                    className="vse-icon-button"
                    onClick={() =>
                      actions.updateSettings({
                        locale: settings.locale === "en" ? "ar" : "en"
                      })
                    }
                    title="English / العربية"
                  >
                    <Languages size={15} />
                  </button>
                  <button
                    type="button"
                    className="vse-icon-button"
                    onClick={() => setMinimized(true)}
                    title="Minimize"
                  >
                    <Minimize2 size={15} />
                  </button>
                  <button
                    type="button"
                    className="vse-icon-button"
                    onClick={actions.close}
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </header>

              <div className="vse-toolbar-row">
                <button
                  type="button"
                  className={inspectorEnabled ? "is-active" : ""}
                  onClick={() => setInspectorEnabled(!inspectorEnabled)}
                >
                  {inspectorEnabled ? <Pause size={14} /> : <Play size={14} />}
                  {inspectorEnabled ? t("inspecting") : t("paused")}
                </button>
                <div className="vse-history-buttons">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={past.length === 0}
                    title={t("undo")}
                  >
                    <Undo2 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={redo}
                    disabled={future.length === 0}
                    title={t("redo")}
                  >
                    <Redo2 size={15} />
                  </button>
                </div>
              </div>

              <div className="vse-responsive-row" aria-label="Responsive breakpoint">
                {(["base", "desktop", "tablet", "mobile"] as const).map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={breakpoint === item ? "is-active" : ""}
                    onClick={() => setBreakpoint(item)}
                  >
                    {t(item)}
                  </button>
                ))}
              </div>

              <div className="vse-tabs" role="tablist">
                <button
                  type="button"
                  className={tab === "properties" ? "is-active" : ""}
                  onClick={() => setTab("properties")}
                >
                  {t("properties")}
                </button>
                <button
                  type="button"
                  className={tab === "selector" ? "is-active" : ""}
                  onClick={() => setTab("selector")}
                >
                  {t("selector")}
                </button>
                <button
                  type="button"
                  className={tab === "fonts" ? "is-active" : ""}
                  onClick={() => setTab("fonts")}
                >
                  {t("fonts")}
                </button>
                <button
                  type="button"
                  className={tab === "history" ? "is-active" : ""}
                  onClick={() => setTab("history")}
                >
                  {t("history")}
                  {history.length > 0 && <span>{history.length}</span>}
                </button>
              </div>

              <main className="vse-panel-content">
                {!selected && tab !== "fonts" ? (
                  <div className="vse-empty-state">
                    <div className="vse-crosshair">
                      <span />
                    </div>
                    <strong>{t("selectElement")}</strong>
                    <p>{t("noSelection")}</p>
                  </div>
                ) : tab === "fonts" ? (
                  <GoogleFontsPanel
                    onPreview={actions.previewGoogleFont}
                    onApply={actions.applyGoogleFont}
                  />
                ) : tab === "properties" && selected ? (
                  <>
                    <div className="vse-selection-summary">
                      <div>
                        <span>&lt;{selected.tagName}&gt;</span>
                        <strong>{selected.label || selected.id || "Element"}</strong>
                      </div>
                      <small>
                        {Math.round(selected.rect.width)} ×{" "}
                        {Math.round(selected.rect.height)}
                      </small>
                    </div>
                    <div className="vse-search-box">
                      <Search size={14} />
                      <input
                        value={propertySearch}
                        onChange={(event) => setPropertySearch(event.target.value)}
                        placeholder={t("searchProperties")}
                        aria-label={t("searchProperties")}
                      />
                    </div>

                    {!propertySearch && (
                      <section className="vse-property-section">
                        <button
                          type="button"
                          className="vse-section-heading"
                          onClick={() =>
                            setCollapsed((current) => ({
                              ...current,
                              boxModel: !current.boxModel
                            }))
                          }
                        >
                          <span>
                            {collapsed.boxModel ? (
                              <ChevronRight size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                            Box model
                          </span>
                        </button>
                        {!collapsed.boxModel && (
                          <BoxModelEditor
                            selector={selected.selector.selector}
                            computed={selected.computed}
                          />
                        )}
                      </section>
                    )}

                    {filteredGroups.map((group) => (
                      <section className="vse-property-section" key={group.id}>
                        <button
                          type="button"
                          className="vse-section-heading"
                          onClick={() =>
                            setCollapsed((current) => ({
                              ...current,
                              [group.id]: !current[group.id]
                            }))
                          }
                        >
                          <span>
                            {collapsed[group.id] ? (
                              <ChevronRight size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                            {group.label}
                          </span>
                          <small>
                            {
                              group.properties.filter(
                                (property) =>
                                  activeRule?.declarations[property.property] !==
                                  undefined
                              ).length
                            }
                          </small>
                        </button>
                        {(!collapsed[group.id] || Boolean(propertySearch)) && (
                          <div className="vse-property-grid">
                            {group.properties.map((definition) => (
                              <PropertyControl
                                key={`${selected.selector.selector}-${breakpoint}-${definition.property}`}
                                definition={definition}
                                computedValue={
                                  selected.computed[definition.property] || ""
                                }
                                overrideValue={
                                  activeRule?.declarations[definition.property] || ""
                                }
                                onChange={(value) =>
                                  updateDeclaration(
                                    selected.selector.selector,
                                    definition.property,
                                    value
                                  )
                                }
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    ))}
                  </>
                ) : tab === "selector" && selected ? (
                  <div className="vse-selector-panel">
                    <div className="vse-segmented">
                      {(["flexible", "single"] as const).map((mode) => (
                        <button
                          type="button"
                          className={inspectorMode === mode ? "is-active" : ""}
                          onClick={() => actions.setInspectorMode(mode)}
                          key={mode}
                        >
                          {t(mode)}
                        </button>
                      ))}
                    </div>
                    <label htmlFor="vse-selector-editor">{t("selector")}</label>
                    <textarea
                      id="vse-selector-editor"
                      value={selectorDraft}
                      onChange={(event) => setSelectorDraft(event.target.value)}
                      onBlur={commitSelector}
                      spellCheck={false}
                    />
                    {selectorError && <p className="vse-field-error">{selectorError}</p>}
                    <div className="vse-selector-actions">
                      <button type="button" onClick={commitSelector}>
                        <Code2 size={14} /> Apply
                      </button>
                      <button type="button" onClick={actions.copySelector}>
                        <Clipboard size={14} /> Copy
                      </button>
                    </div>
                    <div className="vse-selector-metrics">
                      <div>
                        <span>{t("matches")}</span>
                        <strong>{selected.selector.matchCount}</strong>
                      </div>
                      <div>
                        <span>Specificity</span>
                        <strong>{selected.selector.specificity}</strong>
                      </div>
                      <div>
                        <span>{t("stability")}</span>
                        <strong>{selected.selector.stabilityScore}%</strong>
                      </div>
                    </div>
                    {selected.selector.warnings.map((warning) => (
                      <p className="vse-warning" key={warning}>
                        {warning}
                      </p>
                    ))}
                    <h3>{t("computed")}</h3>
                    <div className="vse-computed-list">
                      {Object.entries(selected.computed)
                        .filter(([, value]) => value)
                        .map(([property, value]) => (
                          <button
                            type="button"
                            key={property}
                            onClick={() =>
                              navigator.clipboard
                                .writeText(value)
                                .then(() => setToast(t("copied")))
                            }
                          >
                            <span>{property}</span>
                            <code>{value}</code>
                          </button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="vse-history-list">
                    {history.length === 0 ? (
                      <div className="vse-empty-state compact">
                        <strong>No edits yet</strong>
                        <p>Every property change appears here.</p>
                      </div>
                    ) : (
                      [...history].reverse().map((entry) => (
                        <article key={entry.id}>
                          <span className={`vse-history-icon ${entry.actionType}`}>
                            <GripVertical size={13} />
                          </span>
                          <div>
                            <strong>{entry.property}</strong>
                            <code>{entry.newValue || "reset"}</code>
                            <small>
                              {entry.breakpoint} ·{" "}
                              {new Date(entry.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </small>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                )}
              </main>

              <div className="vse-resize-control">
                <span>Panel width</span>
                <input
                  type="range"
                  min="300"
                  max="520"
                  step="10"
                  value={settings.panelWidth}
                  onChange={(event) =>
                    actions.updateSettings({ panelWidth: Number(event.target.value) })
                  }
                  aria-label="Panel width"
                />
              </div>

              <footer className="vse-footer">
                <div className="vse-footer-primary">
                  <button
                    type="button"
                    className="primary"
                    onClick={() => actions.save().then(() => setToast(t("saved")))}
                  >
                    <Save size={14} /> {t("save")}
                  </button>
                  <button type="button" onClick={() => actions.exportCss()}>
                    <Download size={14} /> CSS
                  </button>
                  <button
                    type="button"
                    onClick={actions.exportJson}
                    title={t("exportJson")}
                  >
                    <ArrowDownToLine size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title={t("importJson")}
                  >
                    <Upload size={14} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        actions
                          .importJson(file)
                          .then(() => setToast(t("imported")))
                          .catch((error: unknown) =>
                            setToast(
                              error instanceof Error ? error.message : "Import failed"
                            )
                          );
                      }
                      event.currentTarget.value = "";
                    }}
                  />
                </div>
                <div className="vse-footer-secondary">
                  <button
                    type="button"
                    onClick={() => selected && resetSelected(selected.selector.selector)}
                    disabled={!selected}
                  >
                    <RotateCcw size={13} /> {t("resetElement")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      actions.resetPage().then(() => setToast("Page design reset"))
                    }
                    disabled={rules.length === 0}
                  >
                    <X size={13} /> {t("resetAll")}
                  </button>
                </div>
              </footer>
              <p className="vse-local-note">{t("domainOnly")}</p>
            </>
          )}
        </aside>
      )}

      <FloatingToolbar
        copySelector={() => void actions.copySelector()}
        selectRelative={actions.selectRelative}
      />

      {toast && <div className="vse-toast">{toast}</div>}
    </div>
  );
}
