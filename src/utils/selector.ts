import type { InspectorMode, SelectorMetadata } from "../types";

const PREFERRED_DATA_ATTRIBUTES = [
  "data-testid",
  "data-test",
  "data-qa",
  "data-cy",
  "data-component",
  "aria-label",
  "name"
];

const UNSTABLE_CLASS_PATTERNS = [
  /^css-[a-z0-9]{5,}$/i,
  /^sc-[a-z0-9]{5,}$/i,
  /__[a-z0-9]{5,}$/i,
  /[a-f0-9]{8,}/i,
  /^jsx-\d+$/i,
  /^_[a-z0-9]{6,}$/i
];

function escapeCss(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/(^-?\d)|[^a-zA-Z0-9_-]/g, (match, leadingDigit) =>
    leadingDigit ? `\\3${leadingDigit} ` : `\\${match}`
  );
}

function escapeAttribute(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function isStableClassName(className: string): boolean {
  if (!className || className.length > 64) return false;
  if (UNSTABLE_CLASS_PATTERNS.some((pattern) => pattern.test(className))) return false;
  const digits = (className.match(/\d/g) ?? []).length;
  return digits <= Math.max(3, Math.floor(className.length / 2));
}

function safeQueryCount(selector: string, root: ParentNode = document): number {
  try {
    return root.querySelectorAll(selector).length;
  } catch {
    return 0;
  }
}

function isSafeId(id: string): boolean {
  return Boolean(id) && id.length <= 80 && !/[a-f0-9]{16,}/i.test(id);
}

function getSemanticClasses(element: Element): string[] {
  return Array.from(element.classList).filter(isStableClassName).slice(0, 3);
}

function getPreferredAttribute(element: Element): [string, string] | null {
  for (const attribute of PREFERRED_DATA_ATTRIBUTES) {
    const value = element.getAttribute(attribute)?.trim();
    if (value && value.length <= 100 && !value.includes("\n")) {
      return [attribute, value];
    }
  }
  return null;
}

function getNthOfType(element: Element): number {
  const parent = element.parentElement;
  if (!parent) return 1;
  return (
    Array.from(parent.children)
      .filter((child) => child.tagName === element.tagName)
      .indexOf(element) + 1
  );
}

function elementSegment(element: Element): { segment: string; penalty: number } {
  const tag = element.tagName.toLowerCase();
  if (isSafeId(element.id)) {
    return { segment: `#${escapeCss(element.id)}`, penalty: 0 };
  }

  const preferredAttribute = getPreferredAttribute(element);
  if (preferredAttribute) {
    const [name, value] = preferredAttribute;
    return {
      segment: `${tag}[${name}="${escapeAttribute(value)}"]`,
      penalty: 2
    };
  }

  const classes = getSemanticClasses(element);
  let segment = `${tag}${classes.map((name) => `.${escapeCss(name)}`).join("")}`;
  let penalty = classes.length > 0 ? 4 : 10;

  if (
    element.parentElement &&
    safeQueryCount(`:scope > ${segment}`, element.parentElement) > 1
  ) {
    segment += `:nth-of-type(${getNthOfType(element)})`;
    penalty += 12;
  }

  return { segment, penalty };
}

export function calculateSpecificity(selector: string): string {
  const ids = (selector.match(/#[\w-]+/g) ?? []).length;
  const classes = (
    selector.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+(?:\([^)]*\))?/g) ?? []
  ).length;
  const elements = (
    selector
      .replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|::?[\w-]+(?:\([^)]*\))?/g, " ")
      .match(/\b[a-z][\w-]*\b/gi) ?? []
  ).length;
  return `${ids},${classes},${elements}`;
}

export function validateSelector(selector: string): {
  valid: boolean;
  matchCount: number;
  error?: string;
} {
  const trimmed = selector.trim();
  if (!trimmed) return { valid: false, matchCount: 0, error: "Selector is empty." };
  if (trimmed.length > 500 || /[{}@;]/.test(trimmed)) {
    return { valid: false, matchCount: 0, error: "Selector contains unsafe tokens." };
  }

  try {
    return { valid: true, matchCount: document.querySelectorAll(trimmed).length };
  } catch {
    return { valid: false, matchCount: 0, error: "Selector is not valid CSS." };
  }
}

export function generateSelector(
  element: Element,
  mode: InspectorMode = "flexible"
): SelectorMetadata {
  if (mode === "single") {
    let localId = element.getAttribute("data-visual-editor-id");
    if (!localId) {
      localId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      element.setAttribute("data-visual-editor-id", localId);
    }
    const selector = `[data-visual-editor-id="${escapeAttribute(localId)}"]`;
    return {
      selector,
      matchCount: 1,
      specificity: calculateSpecificity(selector),
      stabilityScore: 100,
      warnings: ["Single-element selectors last only for the current page session."],
      mode
    };
  }

  if (isSafeId(element.id)) {
    const selector = `#${escapeCss(element.id)}`;
    if (safeQueryCount(selector) === 1) {
      return {
        selector,
        matchCount: 1,
        specificity: calculateSpecificity(selector),
        stabilityScore: 96,
        warnings: [],
        mode
      };
    }
  }

  const preferredAttribute = getPreferredAttribute(element);
  if (preferredAttribute) {
    const [name, value] = preferredAttribute;
    const selector = `${element.tagName.toLowerCase()}[${name}="${escapeAttribute(value)}"]`;
    const matchCount = safeQueryCount(selector);
    if (matchCount === 1) {
      return {
        selector,
        matchCount,
        specificity: calculateSpecificity(selector),
        stabilityScore: 92,
        warnings: [],
        mode
      };
    }
  }

  const direct = elementSegment(element);
  if (safeQueryCount(direct.segment) === 1) {
    const score = Math.max(45, 92 - direct.penalty);
    return {
      selector: direct.segment,
      matchCount: 1,
      specificity: calculateSpecificity(direct.segment),
      stabilityScore: score,
      warnings: score < 70 ? ["This selector may depend on page structure."] : [],
      mode
    };
  }

  const segments: string[] = [];
  let totalPenalty = 0;
  let current: Element | null = element;

  while (current && current !== document.documentElement && segments.length < 6) {
    const { segment, penalty } = elementSegment(current);
    segments.unshift(segment);
    totalPenalty += penalty;
    const selector = segments.join(" > ");
    const matchCount = safeQueryCount(selector);
    if (matchCount === 1) {
      const score = Math.max(28, 90 - totalPenalty - (segments.length - 1) * 4);
      return {
        selector,
        matchCount,
        specificity: calculateSpecificity(selector),
        stabilityScore: score,
        warnings:
          score < 70
            ? [
                "This selector depends on DOM position and may change after a site update."
              ]
            : [],
        mode
      };
    }
    current = current.parentElement;
  }

  const fallback = segments.join(" > ") || element.tagName.toLowerCase();
  const matchCount = safeQueryCount(fallback);
  return {
    selector: fallback,
    matchCount,
    specificity: calculateSpecificity(fallback),
    stabilityScore: 25,
    warnings: [
      matchCount > 1
        ? `This selector matches ${matchCount} elements.`
        : "This selector strongly depends on DOM position."
    ],
    mode
  };
}
