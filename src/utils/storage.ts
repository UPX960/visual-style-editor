import {
  DEFAULT_SETTINGS,
  DESIGN_STORAGE_PREFIX,
  PROJECT_SCHEMA_VERSION,
  SETTINGS_STORAGE_KEY
} from "./constants";
import { createId } from "./id";
import type { DesignProject, EditorSettings, GoogleFontAsset, StyleRule } from "../types";

export function designStorageKey(hostname: string): string {
  return `${DESIGN_STORAGE_PREFIX}${hostname.toLowerCase()}`;
}

export async function getSettings(): Promise<EditorSettings> {
  const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  return {
    ...DEFAULT_SETTINGS,
    ...(result[SETTINGS_STORAGE_KEY] as Partial<EditorSettings> | undefined)
  };
}

export async function saveSettings(settings: EditorSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: settings });
}

export async function getDesign(hostname: string): Promise<DesignProject | null> {
  const key = designStorageKey(hostname);
  const result = await chrome.storage.local.get(key);
  const project = result[key] as DesignProject | undefined;
  return project?.schemaVersion === PROJECT_SCHEMA_VERSION ? project : null;
}

export async function saveDomainDesign(
  hostname: string,
  sourceUrl: string,
  rules: StyleRule[],
  fontAssets: GoogleFontAsset[],
  current?: DesignProject | null
): Promise<DesignProject> {
  const now = Date.now();
  const project: DesignProject = {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: current?.id ?? createId("design"),
    name: current?.name ?? `${hostname} visual design`,
    hostname,
    sourceUrl,
    scope: current?.scope ?? "domain",
    enabled: current?.enabled ?? true,
    rules,
    fontAssets,
    textOverrides: current?.textOverrides ?? [],
    createdAt: current?.createdAt ?? now,
    updatedAt: now
  };
  await chrome.storage.local.set({ [designStorageKey(hostname)]: project });
  return project;
}

export async function replaceDesign(project: DesignProject): Promise<void> {
  await chrome.storage.local.set({ [designStorageKey(project.hostname)]: project });
}

export async function removeDesign(hostname: string): Promise<void> {
  await chrome.storage.local.remove(designStorageKey(hostname));
}

export async function listDesigns(): Promise<DesignProject[]> {
  const all = await chrome.storage.local.get(null);
  return Object.entries(all)
    .filter(([key]) => key.startsWith(DESIGN_STORAGE_PREFIX))
    .map(([, value]) => value as DesignProject)
    .filter((project) => project?.schemaVersion === PROJECT_SCHEMA_VERSION)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
