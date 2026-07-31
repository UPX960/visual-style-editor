import {
  CheckCircle2,
  ChevronRight,
  CircleOff,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  Layers3,
  Loader2,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { translate } from "../i18n";
import type { Locale, RuntimeRequest, RuntimeResponse } from "../types";
import { getDesign, getSettings } from "../utils/storage";

interface TabInfo {
  id: number;
  url: string;
  hostname: string;
  originPattern: string;
  supported: boolean;
}

async function getActiveTabInfo(): Promise<TabInfo | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id || !tab.url) return null;
  try {
    const url = new URL(tab.url);
    const supported = url.protocol === "http:" || url.protocol === "https:";
    return {
      id: tab.id,
      url: tab.url,
      hostname: supported ? url.hostname : url.protocol.replace(":", ""),
      originPattern: supported ? `${url.origin}/*` : "",
      supported
    };
  } catch {
    return null;
  }
}

async function runtimeMessage(request: RuntimeRequest): Promise<RuntimeResponse> {
  return (await chrome.runtime.sendMessage(request)) as RuntimeResponse;
}

async function tabMessage(
  tabId: number,
  request: RuntimeRequest
): Promise<RuntimeResponse | null> {
  try {
    return (await chrome.tabs.sendMessage(tabId, request)) as RuntimeResponse;
  } catch {
    return null;
  }
}

export function PopupApp() {
  const [tab, setTab] = useState<TabInfo | null>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const [hasPermission, setHasPermission] = useState(false);
  const [active, setActive] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ruleCount, setRuleCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const direction = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    void (async () => {
      const [activeTab, settings] = await Promise.all([
        getActiveTabInfo(),
        getSettings()
      ]);
      setTab(activeTab);
      setLocale(settings.locale);
      if (!activeTab?.supported) return;

      const [permission, design, status] = await Promise.all([
        chrome.permissions.contains({ origins: [activeTab.originPattern] }),
        getDesign(activeTab.hostname),
        tabMessage(activeTab.id, { type: "VSE_GET_STATUS" })
      ]);
      setHasPermission(permission);
      setSaved(Boolean(design));
      setActive(Boolean(status?.active));
      setRuleCount(status?.ruleCount ?? design?.rules.length ?? 0);
    })().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : "Unable to inspect this tab.")
    );
  }, []);

  const displayHost = useMemo(() => tab?.hostname || "Current tab", [tab]);

  const ensureContent = async (): Promise<void> => {
    if (!tab?.supported) throw new Error(t("unsupportedPage"));
    let permission = hasPermission;
    if (!permission) {
      permission = await chrome.permissions.request({ origins: [tab.originPattern] });
      setHasPermission(permission);
    }
    if (!permission) throw new Error("Domain permission was not granted.");

    const registered = await runtimeMessage({
      type: "VSE_ENSURE_ORIGIN_SCRIPT",
      originPattern: tab.originPattern
    });
    if (!registered.ok)
      throw new Error(registered.error || "Could not register the editor.");
    const injected = await runtimeMessage({ type: "VSE_INJECT", tabId: tab.id });
    if (!injected.ok) throw new Error(injected.error || "Could not inject the editor.");
  };

  const activateEditor = async () => {
    setBusy(true);
    setError("");
    try {
      await ensureContent();
      const response = await tabMessage(tab!.id, {
        type: "VSE_SET_ACTIVE",
        active: true
      });
      if (!response?.ok) throw new Error(response?.error || "Editor did not respond.");
      setActive(true);
      setRuleCount(response.ruleCount ?? ruleCount);
      window.close();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not activate the editor."
      );
    } finally {
      setBusy(false);
    }
  };

  const disableEditor = async () => {
    if (!tab) return;
    setBusy(true);
    const response = await tabMessage(tab.id, {
      type: "VSE_SET_ACTIVE",
      active: false
    });
    setActive(false);
    setRuleCount(response?.ruleCount ?? ruleCount);
    setBusy(false);
  };

  const resetPage = async () => {
    if (!tab) return;
    setBusy(true);
    setError("");
    try {
      await ensureContent();
      const response = await tabMessage(tab.id, { type: "VSE_RESET_PAGE" });
      if (!response?.ok) throw new Error(response?.error || "Reset failed.");
      setSaved(false);
      setRuleCount(0);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Reset failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir={direction} className="w-[360px] overflow-hidden bg-[#f7f8fb] text-ink">
      <header className="relative overflow-hidden bg-[#11131a] px-5 pb-5 pt-4 text-white">
        <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-violet-500/20 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#887cff] to-[#5948ee] font-bold shadow-lg shadow-violet-600/20">
              V
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">{t("appName")}</h1>
              <p className="mt-0.5 text-[10px] text-white/55">
                Local visual CSS workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => chrome.runtime.openOptionsPage()}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label={t("settings")}
          >
            <Settings size={16} />
          </button>
        </div>

        <div className="relative mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.06] p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Globe2 size={16} className="shrink-0 text-violet-300" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{displayHost}</p>
              <p className="mt-0.5 text-[9px] text-white/50">
                {hasPermission ? t("permissionGranted") : t("permissionNeeded")}
              </p>
            </div>
          </div>
          {hasPermission ? (
            <ShieldCheck size={18} className="text-emerald-400" />
          ) : (
            <CircleOff size={18} className="text-amber-400" />
          )}
        </div>
      </header>

      <main className="space-y-3 p-4">
        {!tab?.supported && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
            {t("unsupportedPage")}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] leading-relaxed text-rose-700">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={busy || !tab?.supported}
          onClick={() => void activateEditor()}
          className="flex w-full items-center justify-between rounded-xl bg-[#6d5dfc] px-4 py-3.5 text-left text-white shadow-lg shadow-violet-500/20 transition hover:bg-[#5d4df5] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center gap-3">
            {busy ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            <span>
              <strong className="block text-xs">
                {active ? t("openPanel") : t("activate")}
              </strong>
              <small className="mt-0.5 block text-[9px] text-white/65">
                Select, style, undo and save
              </small>
            </span>
          </span>
          <ChevronRight size={17} className={direction === "rtl" ? "rotate-180" : ""} />
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy || !active}
            onClick={() => void disableEditor()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-[11px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-45"
          >
            {active ? <EyeOff size={15} /> : <Eye size={15} />}
            {t("disable")}
          </button>
          <button
            type="button"
            disabled={busy || !tab?.supported}
            onClick={() => void resetPage()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-[11px] font-medium text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-45"
          >
            <RotateCcw size={15} />
            {t("resetPage")}
          </button>
        </div>

        <button
          type="button"
          onClick={() => chrome.runtime.openOptionsPage()}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300"
        >
          <span className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600">
              <Layers3 size={15} />
            </span>
            <span>
              <strong className="block text-[11px] text-slate-800">
                {t("savedDesigns")}
              </strong>
              <small className="mt-0.5 block text-[9px] text-slate-400">
                {saved
                  ? `${ruleCount} CSS rule${ruleCount === 1 ? "" : "s"} on this domain`
                  : "No saved design"}
              </small>
            </span>
          </span>
          {saved ? (
            <CheckCircle2 size={17} className="text-emerald-500" />
          ) : (
            <ExternalLink size={15} className="text-slate-400" />
          )}
        </button>
      </main>

      <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-2.5 text-[9px] text-slate-400">
        <span>Changes stay in your browser</span>
        <button
          type="button"
          onClick={() => setLocale(locale === "en" ? "ar" : "en")}
          className="font-semibold text-violet-600 hover:text-violet-700"
        >
          {locale === "en" ? "العربية" : "English"}
        </button>
      </footer>
    </div>
  );
}
