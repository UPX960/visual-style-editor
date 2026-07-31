import { createRoot, type Root } from "react-dom/client";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { EditorApp, type EditorActions } from "../editor/EditorApp";
import { PROPERTY_GROUPS } from "../editor/propertyDefinitions";
import {
  googleFontCssUrl,
  googleFontStack,
  toGoogleFontAsset
} from "../assets/googleFonts";
import { useEditorStore } from "../store/editorStore";
import type {
  DesignProject,
  EditorSettings,
  GoogleFontAsset,
  GoogleFontCatalogItem,
  InspectorMode,
  RectSnapshot,
  RuntimeRequest,
  RuntimeResponse,
  SelectedElementInfo
} from "../types";
import {
  copyText,
  downloadTextFile,
  rulesToCss,
  usedGoogleFontAssets,
  validateImportedProject
} from "../utils/css";
import {
  INSPECTED_PROPERTIES,
  ROOT_ATTRIBUTE,
  SETTINGS_STORAGE_KEY,
  STYLE_ELEMENT_ID
} from "../utils/constants";
import {
  calculateSpecificity,
  generateSelector,
  validateSelector
} from "../utils/selector";
import {
  designStorageKey,
  getDesign,
  getSettings,
  removeDesign,
  saveDomainDesign,
  saveSettings
} from "../utils/storage";
import editorCss from "../styles/editor.css?inline";

const ALL_INSPECTED_PROPERTIES = Array.from(
  new Set([
    ...INSPECTED_PROPERTIES,
    ...PROPERTY_GROUPS.flatMap((group) =>
      group.properties.map((definition) => definition.property)
    )
  ])
);

function rectSnapshot(rect: DOMRect): RectSnapshot {
  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height
  };
}

function getElementLabel(element: Element): string {
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel.slice(0, 80);
  const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
  return text.slice(0, 80);
}

function isSensitiveElement(element: Element): boolean {
  const input = element.closest("input, textarea");
  if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
    return false;
  }
  if (input instanceof HTMLInputElement && input.type === "password") return true;
  const autocomplete = input.autocomplete.toLowerCase();
  return autocomplete.startsWith("cc-") || /card|cvv|cvc|password/i.test(input.name);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, [contenteditable='true'], [contenteditable='']"
    )
  );
}

export class VisualEditorController {
  private host: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;
  private reactRoot: Root | null = null;
  private hoverOutline: HTMLDivElement | null = null;
  private selectedOutline: HTMLDivElement | null = null;
  private hoverTooltip: HTMLDivElement | null = null;
  private selectedElement: Element | null = null;
  private hoveredElement: Element | null = null;
  private animationFrame = 0;
  private initialized = false;
  private listenersAttached = false;
  private currentProject: DesignProject | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private mutationObserver: MutationObserver | null = null;
  private unsubscribeStore: (() => void) | null = null;
  private fontLinks = new Map<string, HTMLLinkElement>();
  private previewFontLink: HTMLLinkElement | null = null;

  private readonly onPointerMove = (event: PointerEvent) => {
    const state = useEditorStore.getState();
    if (!state.active || !state.inspectorEnabled || state.pinned) {
      this.hideHover();
      return;
    }
    if (this.isExtensionEvent(event)) {
      this.hideHover();
      return;
    }
    const target = event.target;
    if (!(target instanceof Element) || isSensitiveElement(target)) {
      this.hideHover();
      return;
    }
    if (target.closest("[data-vse-download], [data-vse-generated]")) {
      this.hideHover();
      return;
    }
    this.hoveredElement = target;
    if (this.animationFrame) return;
    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = 0;
      if (this.hoveredElement) this.renderHover(this.hoveredElement);
    });
  };

  private readonly onClick = (event: MouseEvent) => {
    const state = useEditorStore.getState();
    if (
      !state.active ||
      !state.inspectorEnabled ||
      state.pinned ||
      this.isExtensionEvent(event)
    ) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-vse-download], [data-vse-generated]")) return;
    if (isSensitiveElement(target)) {
      state.setToast("Secure inputs are intentionally excluded.");
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.selectElement(target);
  };

  private readonly onKeyDown = (event: KeyboardEvent) => {
    const state = useEditorStore.getState();
    if (!state.active) return;
    if (event.key === "Escape") {
      state.setInspectorEnabled(!state.inspectorEnabled);
      this.hideHover();
      return;
    }
    if (isEditableTarget(event.target)) return;

    const command = event.metaKey || event.ctrlKey;
    if (command && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) state.redo();
      else state.undo();
      return;
    }
    if (command && event.key.toLowerCase() === "y") {
      event.preventDefault();
      state.redo();
      return;
    }
    if (event.altKey && event.key === "ArrowUp") {
      event.preventDefault();
      this.selectRelative("parent");
    } else if (event.altKey && event.key === "ArrowLeft") {
      event.preventDefault();
      this.selectRelative("previous");
    } else if (event.altKey && event.key === "ArrowRight") {
      event.preventDefault();
      this.selectRelative("next");
    }
  };

  private readonly onViewportChange = () => {
    if (this.animationFrame) return;
    this.animationFrame = requestAnimationFrame(() => {
      this.animationFrame = 0;
      this.refreshSelectionGeometry();
      if (this.hoveredElement) this.renderHover(this.hoveredElement);
    });
  };

  private readonly onStorageChanged = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => {
    if (areaName !== "local") return;
    if (changes[SETTINGS_STORAGE_KEY]?.newValue) {
      useEditorStore
        .getState()
        .setSettings(changes[SETTINGS_STORAGE_KEY].newValue as EditorSettings);
    }

    const designChange = changes[designStorageKey(location.hostname)];
    if (designChange && !useEditorStore.getState().active) {
      this.currentProject = (designChange.newValue as DesignProject | undefined) ?? null;
      const enabledProject = this.currentProject?.enabled ? this.currentProject : null;
      useEditorStore
        .getState()
        .loadProject(enabledProject?.rules ?? [], enabledProject?.fontAssets ?? []);
      this.syncGoogleFonts(
        usedGoogleFontAssets(
          enabledProject?.rules ?? [],
          enabledProject?.fontAssets ?? []
        )
      );
    }
  };

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const [settings, design] = await Promise.all([
      getSettings().catch(() => useEditorStore.getState().settings),
      getDesign(location.hostname).catch(() => null)
    ]);
    this.currentProject = design;
    useEditorStore.getState().setSettings(settings);
    const enabledDesign = design?.enabled ? design : null;
    useEditorStore
      .getState()
      .loadProject(enabledDesign?.rules ?? [], enabledDesign?.fontAssets ?? []);
    this.applyRules(useEditorStore.getState().rules);
    this.syncGoogleFonts(
      usedGoogleFontAssets(
        useEditorStore.getState().rules,
        useEditorStore.getState().fontAssets
      )
    );

    this.unsubscribeStore = useEditorStore.subscribe((state, previous) => {
      if (state.rules !== previous.rules) this.applyRules(state.rules);
      if (state.rules !== previous.rules || state.fontAssets !== previous.fontAssets) {
        this.syncGoogleFonts(usedGoogleFontAssets(state.rules, state.fontAssets));
      }
      if (!state.inspectorEnabled && previous.inspectorEnabled) this.hideHover();
      if (!state.selected && previous.selected) this.hideSelected();
    });
    chrome.storage.onChanged.addListener(this.onStorageChanged);

    this.mutationObserver = new MutationObserver(() => {
      if (this.selectedElement && !this.selectedElement.isConnected) {
        this.selectedElement = null;
        useEditorStore.getState().setSelected(null);
      }
    });
    this.mutationObserver.observe(document.documentElement, {
      subtree: true,
      childList: true
    });
  }

  async handleRequest(message: RuntimeRequest): Promise<RuntimeResponse> {
    try {
      switch (message.type) {
        case "VSE_SET_ACTIVE":
          if (message.active) this.activate();
          else this.deactivate();
          break;
        case "VSE_TOGGLE":
          if (useEditorStore.getState().active) this.deactivate();
          else this.activate();
          break;
        case "VSE_GET_STATUS":
          return {
            ok: true,
            active: useEditorStore.getState().active,
            saved: Boolean(this.currentProject),
            ruleCount: useEditorStore.getState().rules.length
          };
        case "VSE_RESET_PAGE":
          await this.resetPageAndSavedDesign();
          break;
        case "VSE_UNDO":
          useEditorStore.getState().undo();
          break;
        case "VSE_REDO":
          useEditorStore.getState().redo();
          break;
        default:
          break;
      }
      return {
        ok: true,
        active: useEditorStore.getState().active,
        saved: Boolean(this.currentProject),
        ruleCount: useEditorStore.getState().rules.length
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  activate(): void {
    this.mountInterface();
    this.attachListeners();
    const state = useEditorStore.getState();
    state.setActive(true);
    state.setPanelVisible(true);
    state.setInspectorEnabled(true);
    this.refreshSelectionGeometry();
  }

  deactivate(): void {
    this.detachListeners();
    this.hideHover();
    this.hideSelected();
    this.selectedElement = null;
    this.hoveredElement = null;
    this.resizeObserver?.disconnect();
    this.clearGoogleFontPreview();
    document
      .querySelectorAll("[data-visual-editor-id]")
      .forEach((element) => element.removeAttribute("data-visual-editor-id"));

    const state = useEditorStore.getState();
    state.setSelected(null);
    state.setPanelVisible(false);
    state.setActive(false);

    this.reactRoot?.unmount();
    this.reactRoot = null;
    this.host?.remove();
    this.host = null;
    this.shadow = null;
    this.hoverOutline = null;
    this.selectedOutline = null;
    this.hoverTooltip = null;
  }

  private mountInterface(): void {
    if (this.host?.isConnected) return;

    const host = document.createElement("div");
    host.setAttribute(ROOT_ATTRIBUTE, "");
    host.style.setProperty("all", "initial", "important");
    host.style.setProperty("position", "fixed", "important");
    host.style.setProperty("inset", "0", "important");
    host.style.setProperty("width", "0", "important");
    host.style.setProperty("height", "0", "important");
    host.style.setProperty("z-index", "2147483646", "important");
    host.style.setProperty("pointer-events", "none", "important");
    document.documentElement.append(host);

    const shadow = host.attachShadow({ mode: "open" });
    const styles = document.createElement("style");
    styles.textContent = editorCss;
    shadow.append(styles);

    this.hoverOutline = document.createElement("div");
    this.hoverOutline.className = "vse-hover-outline";
    this.selectedOutline = document.createElement("div");
    this.selectedOutline.className = "vse-selected-outline";
    this.hoverTooltip = document.createElement("div");
    this.hoverTooltip.className = "vse-hover-tooltip";
    shadow.append(this.hoverOutline, this.selectedOutline, this.hoverTooltip);

    const mount = document.createElement("div");
    shadow.append(mount);
    this.host = host;
    this.shadow = shadow;
    this.reactRoot = createRoot(mount);
    this.reactRoot.render(
      <ErrorBoundary>
        <EditorApp actions={this.getEditorActions()} />
      </ErrorBoundary>
    );
  }

  private getEditorActions(): EditorActions {
    return {
      close: () => this.deactivate(),
      save: () => this.save(),
      exportCss: () => this.exportCss(),
      exportJson: () => this.exportJson(),
      importJson: (file) => this.importJson(file),
      resetPage: () => this.resetPageAndSavedDesign(),
      previewGoogleFont: (font, weight, style) =>
        this.previewGoogleFont(font, weight, style),
      applyGoogleFont: (font, weight, style, target) =>
        this.applyGoogleFont(font, weight, style, target),
      copySelector: () => this.copySelector(),
      updateSelector: (selector) => this.updateSelector(selector),
      setInspectorMode: (mode) => this.setInspectorMode(mode),
      selectRelative: (relation) => this.selectRelative(relation),
      updateSettings: (settings) => this.updateSettings(settings)
    };
  }

  private attachListeners(): void {
    if (this.listenersAttached) return;
    this.listenersAttached = true;
    document.addEventListener("pointermove", this.onPointerMove, true);
    document.addEventListener("click", this.onClick, true);
    document.addEventListener("keydown", this.onKeyDown, true);
    window.addEventListener("scroll", this.onViewportChange, true);
    window.addEventListener("resize", this.onViewportChange, { passive: true });
  }

  private detachListeners(): void {
    if (!this.listenersAttached) return;
    this.listenersAttached = false;
    document.removeEventListener("pointermove", this.onPointerMove, true);
    document.removeEventListener("click", this.onClick, true);
    document.removeEventListener("keydown", this.onKeyDown, true);
    window.removeEventListener("scroll", this.onViewportChange, true);
    window.removeEventListener("resize", this.onViewportChange);
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
  }

  private isExtensionEvent(event: Event): boolean {
    return Boolean(this.host && event.composedPath().includes(this.host));
  }

  private renderHover(element: Element): void {
    if (!element.isConnected || element === this.host) {
      this.hideHover();
      return;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      this.hideHover();
      return;
    }
    this.positionOutline(this.hoverOutline, rect);
    if (this.hoverTooltip) {
      const classText = Array.from(element.classList)
        .slice(0, 2)
        .map((name) => `.${name}`)
        .join("");
      this.hoverTooltip.textContent = `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${classText}  ${Math.round(rect.width)} × ${Math.round(rect.height)}`;
      this.hoverTooltip.style.display = "block";
      this.hoverTooltip.style.left = `${Math.max(6, Math.min(rect.left, window.innerWidth - 330))}px`;
      this.hoverTooltip.style.top = `${Math.max(6, rect.top - 28)}px`;
    }
  }

  private hideHover(): void {
    if (this.hoverOutline) this.hoverOutline.style.display = "none";
    if (this.hoverTooltip) this.hoverTooltip.style.display = "none";
    this.hoveredElement = null;
  }

  private hideSelected(): void {
    if (this.selectedOutline) this.selectedOutline.style.display = "none";
  }

  private positionOutline(outline: HTMLDivElement | null, rect: DOMRect): void {
    if (!outline) return;
    outline.style.display = "block";
    outline.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
    outline.style.width = `${Math.max(0, rect.width)}px`;
    outline.style.height = `${Math.max(0, rect.height)}px`;
  }

  private getComputed(element: Element): Record<string, string> {
    const computedStyle = getComputedStyle(element);
    return Object.fromEntries(
      ALL_INSPECTED_PROPERTIES.map((property) => [
        property,
        computedStyle.getPropertyValue(property).trim()
      ])
    );
  }

  private selectElement(element: Element): void {
    if (element === this.host || element.closest(`[${ROOT_ATTRIBUTE}]`)) return;
    const state = useEditorStore.getState();
    const selector = generateSelector(element, state.inspectorMode);
    const rect = element.getBoundingClientRect();
    const selected: SelectedElementInfo = {
      tagName: element.tagName.toLowerCase(),
      id: element.id,
      classes: Array.from(element.classList).slice(0, 8),
      label: getElementLabel(element),
      rect: rectSnapshot(rect),
      selector,
      computed: this.getComputed(element)
    };
    this.selectedElement = element;
    state.setSelected(selected);
    this.positionOutline(this.selectedOutline, rect);
    this.hideHover();

    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.refreshSelectionGeometry());
    this.resizeObserver.observe(element);
  }

  private refreshSelectionGeometry(): void {
    if (!this.selectedElement?.isConnected) return;
    const rect = this.selectedElement.getBoundingClientRect();
    this.positionOutline(this.selectedOutline, rect);
    const selected = useEditorStore.getState().selected;
    if (selected) {
      useEditorStore.getState().setSelected({
        ...selected,
        rect: rectSnapshot(rect),
        computed: this.getComputed(this.selectedElement)
      });
    }
  }

  private updateSelector(selector: string): { ok: boolean; error?: string } {
    const validation = validateSelector(selector);
    if (!validation.valid) return { ok: false, error: validation.error };
    const selected = useEditorStore.getState().selected;
    if (!selected) return { ok: false, error: "Select an element first." };
    useEditorStore.getState().setSelected({
      ...selected,
      selector: {
        selector: selector.trim(),
        matchCount: validation.matchCount,
        specificity: calculateSpecificity(selector),
        stabilityScore: validation.matchCount === 1 ? 70 : 45,
        warnings:
          validation.matchCount > 1
            ? [`This selector matches ${validation.matchCount} elements.`]
            : validation.matchCount === 0
              ? ["This selector currently matches no elements."]
              : [],
        mode: "flexible"
      }
    });
    return { ok: true };
  }

  private setInspectorMode(mode: InspectorMode): void {
    useEditorStore.getState().setInspectorMode(mode);
    if (this.selectedElement) this.selectElement(this.selectedElement);
  }

  private selectRelative(relation: "parent" | "previous" | "next"): void {
    if (!this.selectedElement) return;
    const candidate =
      relation === "parent"
        ? this.selectedElement.parentElement
        : relation === "previous"
          ? this.selectedElement.previousElementSibling
          : this.selectedElement.nextElementSibling;
    if (candidate && candidate !== this.host && !candidate.hasAttribute(ROOT_ATTRIBUTE)) {
      this.selectElement(candidate);
    }
  }

  private applyRules(rules: ReturnType<typeof useEditorStore.getState>["rules"]): void {
    let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ELEMENT_ID;
      style.setAttribute("data-vse-generated", "true");
      document.documentElement.append(style);
    }
    style.textContent = rulesToCss(rules, false);
  }

  private ensureGoogleFont(asset: GoogleFontAsset): void {
    const key = asset.family.toLowerCase();
    const existing = this.fontLinks.get(key);
    const href = googleFontCssUrl(asset.family, asset.weights, asset.styles);
    if (existing) {
      if (existing.href !== href) existing.href = href;
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.referrerPolicy = "no-referrer";
    link.href = href;
    link.setAttribute("data-vse-generated", "true");
    link.setAttribute("data-vse-google-font", asset.family);
    link.addEventListener("error", () => {
      if (useEditorStore.getState().active) {
        useEditorStore
          .getState()
          .setToast(`Google Font "${asset.family}" was blocked by this website.`);
      }
    });
    (document.head ?? document.documentElement).append(link);
    this.fontLinks.set(key, link);
  }

  private syncGoogleFonts(assets: GoogleFontAsset[]): void {
    const activeFamilies = new Set(assets.map((asset) => asset.family.toLowerCase()));
    for (const [family, link] of this.fontLinks) {
      if (!activeFamilies.has(family)) {
        link.remove();
        this.fontLinks.delete(family);
      }
    }
    for (const asset of assets) this.ensureGoogleFont(asset);
  }

  private setGoogleFontPreview(asset: GoogleFontAsset): void {
    const href = googleFontCssUrl(asset.family, asset.weights, asset.styles);
    if (!this.previewFontLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.referrerPolicy = "no-referrer";
      link.setAttribute("data-vse-generated", "true");
      link.setAttribute("data-vse-google-font-preview", "true");
      link.addEventListener("error", () => {
        if (useEditorStore.getState().active) {
          const family =
            link.getAttribute("data-vse-google-font-family") ?? "selected font";
          useEditorStore
            .getState()
            .setToast(`Google Font "${family}" could not be previewed.`);
        }
      });
      (document.head ?? document.documentElement).append(link);
      this.previewFontLink = link;
    }
    this.previewFontLink.setAttribute("data-vse-google-font-family", asset.family);
    if (this.previewFontLink.href !== href) this.previewFontLink.href = href;
  }

  private clearGoogleFontPreview(): void {
    this.previewFontLink?.remove();
    this.previewFontLink = null;
  }

  private async previewGoogleFont(
    font: GoogleFontCatalogItem,
    weight: number,
    style: string
  ): Promise<void> {
    this.setGoogleFontPreview(toGoogleFontAsset(font, weight, style));
  }

  private async applyGoogleFont(
    font: GoogleFontCatalogItem,
    weight: number,
    style: string,
    target: "selected" | "headings" | "page"
  ): Promise<void> {
    const state = useEditorStore.getState();
    const selector =
      target === "selected"
        ? state.selected?.selector.selector
        : target === "headings"
          ? "h1, h2, h3, h4, h5, h6"
          : "html, body, button, input, textarea, select";
    if (!selector) throw new Error("Select an element before applying this font.");

    const asset = toGoogleFontAsset(font, weight, style);
    this.clearGoogleFontPreview();
    state.updateDeclaration(selector, "font-family", googleFontStack(font));
    state.updateDeclaration(selector, "font-weight", String(weight));
    state.updateDeclaration(selector, "font-style", style);
    state.addFontAsset(asset);
    const recentFonts = [
      font.family,
      ...state.settings.recentFonts.filter((family) => family !== font.family)
    ].slice(0, 8);
    await this.updateSettings({ recentFonts });
    state.setToast(
      `${font.family} applied to ${
        target === "selected" ? "the selected element" : target
      }.`
    );
  }

  private async save(): Promise<void> {
    const state = useEditorStore.getState();
    const rules = state.rules;
    const persistableRules = rules.filter(
      (rule) => !rule.selector.includes("data-visual-editor-id")
    );
    const persistableFonts = usedGoogleFontAssets(persistableRules, state.fontAssets);
    this.currentProject = await saveDomainDesign(
      location.hostname,
      location.href,
      persistableRules,
      persistableFonts,
      this.currentProject
    );
    if (persistableRules.length !== rules.length) {
      useEditorStore
        .getState()
        .setToast("Session-only single-element rules were not saved.");
    }
  }

  private async exportCss(): Promise<void> {
    const state = useEditorStore.getState();
    const css = rulesToCss(state.rules, true, state.fontAssets);
    await copyText(css);
    downloadTextFile(`${location.hostname}-visual-style.css`, css, "text/css");
    useEditorStore.getState().setToast("CSS copied and downloaded.");
  }

  private exportJson(): void {
    const now = Date.now();
    const state = useEditorStore.getState();
    const project: DesignProject = {
      schemaVersion: 1,
      id: this.currentProject?.id ?? `design-${now}`,
      name: this.currentProject?.name ?? `${location.hostname} visual design`,
      hostname: location.hostname,
      sourceUrl: location.href,
      scope: this.currentProject?.scope ?? "domain",
      enabled: true,
      rules: state.rules,
      fontAssets: usedGoogleFontAssets(state.rules, state.fontAssets),
      textOverrides: [],
      createdAt: this.currentProject?.createdAt ?? now,
      updatedAt: now
    };
    downloadTextFile(
      `${location.hostname}-visual-style.json`,
      JSON.stringify(project, null, 2),
      "application/json"
    );
  }

  private async importJson(file: File): Promise<void> {
    if (file.size > 2_000_000) throw new Error("Project file is too large.");
    const project = validateImportedProject(
      JSON.parse(await file.text()),
      location.hostname
    );
    this.currentProject = project;
    useEditorStore.getState().importRules(project.rules, project.fontAssets);
    await saveDomainDesign(
      location.hostname,
      location.href,
      project.rules,
      project.fontAssets,
      project
    );
  }

  private async copySelector(): Promise<void> {
    const selector = useEditorStore.getState().selected?.selector.selector;
    if (!selector) return;
    await copyText(selector);
    useEditorStore.getState().setToast("Selector copied.");
  }

  private async updateSettings(settings: Partial<EditorSettings>): Promise<void> {
    const state = useEditorStore.getState();
    const next = { ...state.settings, ...settings };
    state.setSettings(next);
    await saveSettings(next);
  }

  private async resetPageAndSavedDesign(): Promise<void> {
    const state = useEditorStore.getState();
    state.resetAll();
    state.clearFontAssets();
    this.clearGoogleFontPreview();
    this.syncGoogleFonts([]);
    await removeDesign(location.hostname);
    this.currentProject = null;
  }
}
