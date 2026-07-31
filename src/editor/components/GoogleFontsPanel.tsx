import {
  Check,
  ChevronDown,
  Loader2,
  Search,
  Sparkles,
  Type,
  WholeWord
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { loadBundledGoogleFontsCatalog } from "../../assets/googleFonts";
import { useEditorStore } from "../../store/editorStore";
import type { GoogleFontCatalogItem } from "../../types";

interface GoogleFontsPanelProps {
  onPreview: (
    font: GoogleFontCatalogItem,
    weight: number,
    style: string
  ) => Promise<void>;
  onApply: (
    font: GoogleFontCatalogItem,
    weight: number,
    style: string,
    target: "selected" | "headings" | "page"
  ) => Promise<void>;
}

const CATEGORIES = [
  ["all", "All"],
  ["sans-serif", "Sans"],
  ["serif", "Serif"],
  ["display", "Display"],
  ["handwriting", "Handwriting"],
  ["monospace", "Mono"]
] as const;

const SUBSETS = [
  ["all", "All languages"],
  ["arabic", "Arabic"],
  ["latin", "Latin"],
  ["cyrillic", "Cyrillic"],
  ["devanagari", "Devanagari"],
  ["japanese", "Japanese"],
  ["korean", "Korean"],
  ["thai", "Thai"]
] as const;

const ARABIC_CATEGORY_LABELS: Record<string, string> = {
  all: "الكل",
  "sans-serif": "Sans",
  serif: "Serif",
  display: "عناوين",
  handwriting: "يدوي",
  monospace: "أحادي"
};

const ARABIC_SUBSET_LABELS: Record<string, string> = {
  all: "كل اللغات",
  arabic: "العربية",
  latin: "اللاتينية",
  cyrillic: "السيريلية",
  devanagari: "الديفاناغارية",
  japanese: "اليابانية",
  korean: "الكورية",
  thai: "التايلندية"
};

function nearestWeight(weights: number[]): number {
  return [...weights].sort((a, b) => Math.abs(a - 400) - Math.abs(b - 400))[0] ?? 400;
}

export function GoogleFontsPanel({ onPreview, onApply }: GoogleFontsPanelProps) {
  const settings = useEditorStore((state) => state.settings);
  const selectedElement = useEditorStore((state) => state.selected);
  const isArabic = settings.locale === "ar";
  const [initialRecentFonts] = useState(() => settings.recentFonts);
  const [catalog, setCatalog] = useState<GoogleFontCatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const [category, setCategory] = useState("all");
  const [subset, setSubset] = useState(settings.locale === "ar" ? "arabic" : "all");
  const [selectedFont, setSelectedFont] = useState<GoogleFontCatalogItem | null>(null);
  const [weight, setWeight] = useState(400);
  const [style, setStyle] = useState("normal");
  const [previewText, setPreviewText] = useState(
    settings.locale === "ar"
      ? "صمّم تجربتك بخط يليق بها"
      : "Design a better reading experience"
  );
  const [visibleCount, setVisibleCount] = useState(60);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadBundledGoogleFontsCatalog()
      .then((fonts) => {
        setCatalog(fonts);
        const recent = initialRecentFonts
          .map((family) => fonts.find((font) => font.family === family))
          .find(Boolean);
        if (recent) {
          setSelectedFont(recent);
          setWeight(nearestWeight(recent.weights));
          setStyle(recent.styles.includes("normal") ? "normal" : recent.styles[0]);
        }
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : isArabic
              ? "تعذّر تحميل مكتبة الخطوط."
              : "Font catalog failed to load."
        )
      )
      .finally(() => setLoading(false));
  }, [initialRecentFonts, isArabic]);

  const filteredFonts = useMemo(() => {
    const recentRank = new Map(
      settings.recentFonts.map((family, index) => [family, index])
    );
    return catalog
      .filter(
        (font) =>
          (category === "all" || font.category === category) &&
          (subset === "all" || font.subsets.includes(subset)) &&
          (!deferredQuery ||
            font.family.toLowerCase().includes(deferredQuery) ||
            font.id.includes(deferredQuery))
      )
      .sort((a, b) => {
        const aRank = recentRank.get(a.family) ?? Number.MAX_SAFE_INTEGER;
        const bRank = recentRank.get(b.family) ?? Number.MAX_SAFE_INTEGER;
        return aRank - bRank || a.family.localeCompare(b.family);
      });
  }, [catalog, category, deferredQuery, settings.recentFonts, subset]);

  useEffect(() => setVisibleCount(60), [category, deferredQuery, subset]);

  const chooseFont = async (font: GoogleFontCatalogItem) => {
    const nextWeight = nearestWeight(font.weights);
    const nextStyle = font.styles.includes("normal") ? "normal" : font.styles[0];
    setSelectedFont(font);
    setWeight(nextWeight);
    setStyle(nextStyle);
    setError("");
    try {
      await onPreview(font, nextWeight, nextStyle);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : isArabic
            ? "تعذّرت معاينة الخط."
            : "Font preview failed."
      );
    }
  };

  const changeVariant = async (nextWeight: number, nextStyle: string) => {
    setWeight(nextWeight);
    setStyle(nextStyle);
    setError("");
    try {
      if (selectedFont) await onPreview(selectedFont, nextWeight, nextStyle);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : isArabic
            ? "تعذّر تحميل وزن الخط."
            : "Font variant failed to load."
      );
    }
  };

  const apply = async (target: "selected" | "headings" | "page") => {
    if (!selectedFont) return;
    setWorking(true);
    setError("");
    try {
      await onApply(selectedFont, weight, style, target);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : isArabic
            ? "تعذّر تطبيق الخط."
            : "Font could not be applied."
      );
    } finally {
      setWorking(false);
    }
  };

  if (loading) {
    return (
      <div className="vse-font-loading">
        <Loader2 size={22} />
        <strong>
          {isArabic ? "جارٍ تحميل جميع خطوط Google…" : "Loading all Google Fonts…"}
        </strong>
        <span>
          {isArabic
            ? "لا يُحمّل الكتالوج إلا عند فتح هذا التبويب."
            : "The catalog is loaded only when you open this tab."}
        </span>
      </div>
    );
  }

  return (
    <div className="vse-font-panel">
      <div className="vse-font-hero">
        <div>
          <span className="vse-font-hero-icon">
            <Type size={17} />
          </span>
          <div>
            <strong>{isArabic ? "مكتبة خطوط Google" : "Google Fonts Library"}</strong>
            <small>
              {isArabic
                ? `${catalog.length.toLocaleString("ar")} عائلة خطوط · فهرس محلي`
                : `${catalog.length.toLocaleString()} font families · locally indexed`}
            </small>
          </div>
        </div>
        <span className="vse-live-badge">
          <Sparkles size={10} /> {isArabic ? "كاملة" : "Complete"}
        </span>
      </div>

      <div className="vse-search-box vse-font-search">
        <Search size={14} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            isArabic ? "ابحث في أكثر من 1,900 خط…" : "Search 1,900+ font families…"
          }
          aria-label={isArabic ? "البحث في خطوط Google" : "Search Google Fonts"}
        />
      </div>

      <div className="vse-font-filters">
        <div className="vse-category-scroll">
          {CATEGORIES.map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={category === value ? "is-active" : ""}
              onClick={() => setCategory(value)}
            >
              {isArabic ? ARABIC_CATEGORY_LABELS[value] : label}
            </button>
          ))}
        </div>
        <label className="vse-subset-select">
          <WholeWord size={13} />
          <select value={subset} onChange={(event) => setSubset(event.target.value)}>
            {SUBSETS.map(([value, label]) => (
              <option key={value} value={value}>
                {isArabic ? ARABIC_SUBSET_LABELS[value] : label}
              </option>
            ))}
          </select>
          <ChevronDown size={12} />
        </label>
      </div>

      {settings.recentFonts.length > 0 && !query && (
        <div className="vse-recent-fonts">
          <span>{isArabic ? "المستخدمة مؤخرًا" : "Recent"}</span>
          {settings.recentFonts.slice(0, 5).map((family) => (
            <button
              type="button"
              key={family}
              onClick={() => {
                const font = catalog.find((item) => item.family === family);
                if (font) void chooseFont(font);
              }}
            >
              {family}
            </button>
          ))}
        </div>
      )}

      {selectedFont && (
        <section className="vse-font-preview-card">
          <div className="vse-font-preview-heading">
            <div>
              <strong>{selectedFont.family}</strong>
              <small>
                {selectedFont.category} · {selectedFont.subsets.length}{" "}
                {isArabic ? "لغة" : "languages"}
                {selectedFont.variable ? (isArabic ? " · متغير" : " · variable") : ""}
              </small>
            </div>
            <span>
              <Check size={12} /> {isArabic ? "محدد" : "Selected"}
            </span>
          </div>
          <textarea
            value={previewText}
            onChange={(event) => setPreviewText(event.target.value)}
            dir="auto"
            style={{
              fontFamily: `"${selectedFont.family}", ${selectedFont.category}`,
              fontWeight: weight,
              fontStyle: style
            }}
            aria-label={isArabic ? "نص معاينة الخط" : "Font preview text"}
          />
          <div className="vse-font-variants">
            <label>
              <span>{isArabic ? "الوزن" : "Weight"}</span>
              <select
                value={weight}
                onChange={(event) =>
                  void changeVariant(Number(event.target.value), style)
                }
              >
                {selectedFont.weights.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{isArabic ? "النمط" : "Style"}</span>
              <select
                value={style}
                onChange={(event) => void changeVariant(weight, event.target.value)}
              >
                {selectedFont.styles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="vse-font-apply-grid">
            <button
              type="button"
              className="primary"
              disabled={working || !selectedElement}
              onClick={() => void apply("selected")}
            >
              {working ? <Loader2 size={13} /> : <Type size={13} />}
              {isArabic ? "العنصر" : "Selected"}
            </button>
            <button
              type="button"
              disabled={working}
              onClick={() => void apply("headings")}
            >
              {isArabic ? "العناوين" : "Headings"}
            </button>
            <button type="button" disabled={working} onClick={() => void apply("page")}>
              {isArabic ? "كل الصفحة" : "Entire page"}
            </button>
          </div>
        </section>
      )}

      {error && <p className="vse-font-error">{error}</p>}

      <div className="vse-font-results-heading">
        <span>{isArabic ? "عائلات الخطوط" : "Font families"}</span>
        <strong>{filteredFonts.length.toLocaleString(isArabic ? "ar" : "en")}</strong>
      </div>
      <div className="vse-font-list">
        {filteredFonts.slice(0, visibleCount).map((font) => (
          <button
            type="button"
            key={font.id}
            className={selectedFont?.id === font.id ? "is-selected" : ""}
            onClick={() => void chooseFont(font)}
          >
            <span className="vse-font-monogram">{font.family.slice(0, 2)}</span>
            <span className="vse-font-info">
              <strong>{font.family}</strong>
              <small>
                {font.category} · {font.weights.length}{" "}
                {isArabic ? "وزن" : `weight${font.weights.length === 1 ? "" : "s"}`}
              </small>
            </span>
            <span className="vse-font-badges">
              {font.subsets.includes("arabic") && <i>AR</i>}
              {font.variable && <i>VF</i>}
            </span>
          </button>
        ))}
      </div>
      {visibleCount < filteredFonts.length && (
        <button
          type="button"
          className="vse-load-more"
          onClick={() => setVisibleCount((current) => current + 60)}
        >
          {isArabic ? "عرض 60 خطًا إضافيًا" : "Show 60 more fonts"}
        </button>
      )}
      {filteredFonts.length === 0 && (
        <div className="vse-no-fonts">
          <Type size={22} />
          <strong>{isArabic ? "لا توجد خطوط مطابقة" : "No matching fonts"}</strong>
          <span>
            {isArabic
              ? "جرّب تصنيفًا أو لغة أو عبارة بحث أخرى."
              : "Try another category, language, or search term."}
          </span>
        </div>
      )}
    </div>
  );
}
