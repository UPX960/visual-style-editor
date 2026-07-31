import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PropertyDefinition } from "../propertyDefinitions";

interface PropertyControlProps {
  definition: PropertyDefinition;
  computedValue: string;
  overrideValue: string;
  onChange: (value: string) => boolean;
}

function rgbToHex(value: string): string {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  const match = value.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (!match) return "#000000";
  return `#${[match[1], match[2], match[3]]
    .map((channel) => Number(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function detectedUnit(value: string, units: string[]): string {
  const trimmed = value.trim();
  const exact = units.find((unit) => trimmed === unit);
  if (exact !== undefined) return exact;
  return (
    [...units]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
      .find((unit) => trimmed.endsWith(unit)) ?? "custom"
  );
}

function replaceUnit(value: string, unit: string): string {
  if (unit === "custom") return value;
  if (["auto", "none", "fit-content", "max-content", "min-content"].includes(unit)) {
    return unit;
  }
  const numeric = value.trim().match(/^-?\d*\.?\d+/)?.[0] ?? "0";
  return `${numeric}${unit}`;
}

export function PropertyControl({
  definition,
  computedValue,
  overrideValue,
  onChange
}: PropertyControlProps) {
  const displayedValue = overrideValue || computedValue;
  const [draft, setDraft] = useState(displayedValue);
  const [invalid, setInvalid] = useState(false);
  const colorValue = useMemo(() => rgbToHex(displayedValue), [displayedValue]);

  useEffect(() => {
    setDraft(displayedValue);
    setInvalid(false);
  }, [displayedValue]);

  const commit = (value: string) => {
    setDraft(value);
    setInvalid(!onChange(value));
  };

  const commonProps = {
    "aria-label": definition.label,
    title: overrideValue ? `Override: ${overrideValue}` : `Computed: ${computedValue}`
  };

  return (
    <div className={`vse-control ${overrideValue ? "is-overridden" : ""}`}>
      <div className="vse-control-heading">
        <label htmlFor={`vse-${definition.property}`}>{definition.label}</label>
        <div className="vse-control-meta">
          {overrideValue && <span className="vse-override-dot" title="Overridden" />}
          {overrideValue && (
            <button
              type="button"
              className="vse-icon-button tiny"
              onClick={() => commit("")}
              aria-label={`Reset ${definition.label}`}
              title="Reset property"
            >
              <RotateCcw size={12} />
            </button>
          )}
        </div>
      </div>

      {definition.type === "select" ? (
        <select
          {...commonProps}
          id={`vse-${definition.property}`}
          value={overrideValue}
          onChange={(event) => commit(event.target.value)}
        >
          <option value="">Computed · {computedValue || "unset"}</option>
          {definition.options?.filter(Boolean).map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      ) : definition.type === "color" ? (
        <div className="vse-color-row">
          <input
            {...commonProps}
            type="color"
            value={colorValue}
            onChange={(event) => commit(event.target.value)}
            aria-label={`${definition.label} picker`}
          />
          <input
            id={`vse-${definition.property}`}
            value={draft}
            placeholder={computedValue}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit(event.currentTarget.value);
            }}
          />
        </div>
      ) : definition.type === "range" ? (
        <div className="vse-range-row">
          <input
            {...commonProps}
            id={`vse-${definition.property}`}
            type="range"
            min={definition.min}
            max={definition.max}
            step={definition.step}
            value={
              Number.parseFloat(overrideValue || computedValue) || definition.min || 0
            }
            onChange={(event) => commit(event.target.value)}
          />
          <input
            type="number"
            min={definition.min}
            max={definition.max}
            step={definition.step}
            value={
              Number.parseFloat(overrideValue || computedValue) || definition.min || 0
            }
            onChange={(event) => commit(event.target.value)}
            aria-label={`${definition.label} value`}
          />
        </div>
      ) : definition.type === "dimension" ? (
        <div className="vse-dimension-row">
          <input
            {...commonProps}
            id={`vse-${definition.property}`}
            className={invalid ? "is-invalid" : ""}
            value={draft}
            placeholder={definition.placeholder || computedValue || "0px"}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit(event.currentTarget.value);
            }}
          />
          <select
            aria-label={`${definition.label} unit`}
            value={detectedUnit(draft, definition.units ?? [])}
            onChange={(event) => commit(replaceUnit(draft, event.target.value))}
          >
            <option value="custom">—</option>
            {definition.units?.map((unit) => (
              <option key={unit || "unitless"} value={unit}>
                {unit || "×"}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input
          {...commonProps}
          id={`vse-${definition.property}`}
          className={invalid ? "is-invalid" : ""}
          value={draft}
          placeholder={definition.placeholder || computedValue || "unset"}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commit(event.currentTarget.value);
          }}
        />
      )}
      {invalid && <p className="vse-field-error">Invalid or unsafe CSS value</p>}
    </div>
  );
}
