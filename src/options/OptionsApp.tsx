import {
  Download,
  Globe2,
  Languages,
  Moon,
  Palette,
  Save,
  ShieldCheck,
  Sun,
  Trash2
} from "lucide-react";
import { useEffect, useState } from "react";
import type { DesignProject, EditorSettings } from "../types";
import { DEFAULT_SETTINGS } from "../utils/constants";
import { downloadTextFile } from "../utils/css";
import {
  getSettings,
  listDesigns,
  removeDesign,
  replaceDesign,
  saveSettings
} from "../utils/storage";

export function OptionsApp() {
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [designs, setDesigns] = useState<DesignProject[]>([]);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    void Promise.all([getSettings(), listDesigns()]).then(
      ([loadedSettings, loadedDesigns]) => {
        setSettings(loadedSettings);
        setDesigns(loadedDesigns);
      }
    );
  }, []);

  const persistSettings = async () => {
    await saveSettings(settings);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  };

  const toggleDesign = async (design: DesignProject) => {
    const next = { ...design, enabled: !design.enabled, updatedAt: Date.now() };
    await replaceDesign(next);
    setDesigns((current) => current.map((item) => (item.id === next.id ? next : item)));
  };

  const deleteDesign = async (design: DesignProject) => {
    if (!window.confirm(`Delete the saved design for ${design.hostname}?`)) return;
    await removeDesign(design.hostname);
    setDesigns((current) => current.filter((item) => item.id !== design.id));
  };

  const exportDesign = (design: DesignProject) => {
    downloadTextFile(
      `${design.hostname}-visual-style.json`,
      JSON.stringify(design, null, 2),
      "application/json"
    );
  };

  return (
    <div
      dir={settings.locale === "ar" ? "rtl" : "ltr"}
      className="min-h-screen bg-[#f4f5f8] text-slate-900"
    >
      <header className="border-b border-white/10 bg-[#11131a] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-[#887cff] to-[#5948ee] text-lg font-bold shadow-lg shadow-violet-600/20">
              V
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Visual Style Editor</h1>
              <p className="mt-0.5 text-xs text-white/50">Settings and saved designs</p>
            </div>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/55">
            Pro 0.2.0
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[320px_1fr]">
        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Palette size={18} className="text-violet-600" />
            <h2 className="text-sm font-bold">Editor preferences</h2>
          </div>

          <label className="mb-4 block">
            <span className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
              <Languages size={14} /> Interface language
            </span>
            <select
              value={settings.locale}
              onChange={(event) =>
                setSettings({ ...settings, locale: event.target.value as "en" | "ar" })
              }
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs"
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </label>

          <div className="mb-4">
            <span className="mb-1.5 block text-[11px] font-semibold text-slate-600">
              Editor theme
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(["dark", "light"] as const).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setSettings({ ...settings, theme })}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[11px] font-medium ${
                    settings.theme === theme
                      ? "border-violet-400 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
                  {theme}
                </button>
              ))}
            </div>
          </div>

          <label className="mb-4 block">
            <span className="mb-1.5 flex justify-between text-[11px] font-semibold text-slate-600">
              <span>Panel width</span>
              <span>{settings.panelWidth}px</span>
            </span>
            <input
              type="range"
              min="300"
              max="520"
              step="10"
              value={settings.panelWidth}
              onChange={(event) =>
                setSettings({ ...settings, panelWidth: Number(event.target.value) })
              }
              className="w-full accent-violet-600"
            />
          </label>

          <label className="mb-5 block">
            <span className="mb-1.5 flex justify-between text-[11px] font-semibold text-slate-600">
              <span>UI scale</span>
              <span>{Math.round(settings.uiScale * 100)}%</span>
            </span>
            <input
              type="range"
              min="0.85"
              max="1.25"
              step="0.05"
              value={settings.uiScale}
              onChange={(event) =>
                setSettings({ ...settings, uiScale: Number(event.target.value) })
              }
              className="w-full accent-violet-600"
            />
          </label>

          <button
            type="button"
            onClick={() => void persistSettings()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-700"
          >
            <Save size={15} />
            {savedNotice ? "Saved" : "Save preferences"}
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Globe2 size={18} className="text-violet-600" />
                <h2 className="text-sm font-bold">Saved domain designs</h2>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Enabled designs are reapplied when their domain opens.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
              {designs.length}
            </span>
          </div>

          {designs.length === 0 ? (
            <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <div className="max-w-xs p-8">
                <Globe2 size={28} className="mx-auto text-slate-300" />
                <h3 className="mt-3 text-xs font-semibold text-slate-700">
                  No saved designs yet
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  Activate the editor on a website, make a change, then choose Save.
                </p>
              </div>
            </div>
          ) : (
            <div className="ui-scrollbar max-h-[620px] space-y-2 overflow-auto pr-1">
              {designs.map((design) => (
                <article
                  key={design.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                        design.enabled
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {design.enabled ? <ShieldCheck size={17} /> : <Globe2 size={17} />}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-semibold">
                        {design.hostname}
                      </h3>
                      <p className="mt-0.5 text-[9px] text-slate-400">
                        {design.rules.length} rules · {design.fontAssets?.length ?? 0}{" "}
                        fonts · Updated {new Date(design.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void toggleDesign(design)}
                      className={`rounded-lg px-2.5 py-2 text-[10px] font-semibold ${
                        design.enabled
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {design.enabled ? "Enabled" : "Paused"}
                    </button>
                    <button
                      type="button"
                      onClick={() => exportDesign(design)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      title="Export project"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteDesign(design)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Delete project"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-6 pb-8 text-center text-[10px] text-slate-400">
        Visual Style Editor stores CSS and settings locally. It does not collect page
        content, passwords or payment fields.
      </footer>
    </div>
  );
}
