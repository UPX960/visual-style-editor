export type PropertyControlType = "text" | "color" | "select" | "range" | "dimension";

export interface PropertyDefinition {
  property: string;
  label: string;
  type: PropertyControlType;
  options?: string[];
  units?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface PropertyGroupDefinition {
  id: string;
  label: string;
  properties: PropertyDefinition[];
}

const LENGTH_UNITS = ["px", "%", "em", "rem", "vw", "vh", "vmin", "vmax", "ch", "auto"];

const SIZE_UNITS = [...LENGTH_UNITS, "fit-content", "max-content", "min-content", "none"];

export const PROPERTY_GROUPS: PropertyGroupDefinition[] = [
  {
    id: "typography",
    label: "Typography",
    properties: [
      { property: "color", label: "Text color", type: "color" },
      {
        property: "font-family",
        label: "Font family",
        type: "text",
        placeholder: 'Inter, "Helvetica Neue", sans-serif'
      },
      {
        property: "font-size",
        label: "Font size",
        type: "dimension",
        units: LENGTH_UNITS,
        placeholder: "16px"
      },
      {
        property: "font-weight",
        label: "Weight",
        type: "select",
        options: ["", "100", "200", "300", "400", "500", "600", "700", "800", "900"]
      },
      {
        property: "font-style",
        label: "Style",
        type: "select",
        options: ["", "normal", "italic", "oblique"]
      },
      {
        property: "line-height",
        label: "Line height",
        type: "dimension",
        units: ["", "px", "%", "em", "rem"],
        placeholder: "1.5"
      },
      {
        property: "letter-spacing",
        label: "Letter spacing",
        type: "dimension",
        units: ["px", "em", "rem"],
        placeholder: "0px"
      },
      {
        property: "word-spacing",
        label: "Word spacing",
        type: "dimension",
        units: ["px", "em", "rem"],
        placeholder: "0px"
      },
      {
        property: "text-align",
        label: "Alignment",
        type: "select",
        options: ["", "start", "left", "center", "right", "end", "justify"]
      },
      {
        property: "text-transform",
        label: "Transform",
        type: "select",
        options: ["", "none", "uppercase", "lowercase", "capitalize", "full-width"]
      },
      {
        property: "text-decoration",
        label: "Decoration",
        type: "select",
        options: ["", "none", "underline", "line-through", "overline"]
      },
      {
        property: "text-decoration-thickness",
        label: "Decoration size",
        type: "dimension",
        units: ["px", "em", "%", "auto"],
        placeholder: "auto"
      },
      {
        property: "text-underline-offset",
        label: "Underline offset",
        type: "dimension",
        units: ["px", "em", "%", "auto"],
        placeholder: "auto"
      },
      {
        property: "text-indent",
        label: "Text indent",
        type: "dimension",
        units: LENGTH_UNITS,
        placeholder: "0px"
      },
      {
        property: "white-space",
        label: "White space",
        type: "select",
        options: ["", "normal", "nowrap", "pre", "pre-wrap", "pre-line", "break-spaces"]
      },
      {
        property: "word-break",
        label: "Word break",
        type: "select",
        options: ["", "normal", "break-all", "keep-all", "break-word"]
      },
      {
        property: "overflow-wrap",
        label: "Wrap",
        type: "select",
        options: ["", "normal", "break-word", "anywhere"]
      },
      {
        property: "text-overflow",
        label: "Overflow",
        type: "select",
        options: ["", "clip", "ellipsis"]
      },
      {
        property: "direction",
        label: "Direction",
        type: "select",
        options: ["", "ltr", "rtl"]
      },
      {
        property: "writing-mode",
        label: "Writing mode",
        type: "select",
        options: ["", "horizontal-tb", "vertical-rl", "vertical-lr"]
      },
      {
        property: "text-shadow",
        label: "Text shadow",
        type: "text",
        placeholder: "0 2px 12px rgba(0,0,0,.2)"
      }
    ]
  },
  {
    id: "background",
    label: "Background & gradients",
    properties: [
      { property: "background-color", label: "Background color", type: "color" },
      {
        property: "background-image",
        label: "Image or gradient",
        type: "text",
        placeholder: "url(https://…) or linear-gradient(…)"
      },
      {
        property: "background-size",
        label: "Size",
        type: "select",
        options: ["", "auto", "cover", "contain", "100% 100%"]
      },
      {
        property: "background-position",
        label: "Position",
        type: "select",
        options: [
          "",
          "center",
          "top",
          "top right",
          "right",
          "bottom right",
          "bottom",
          "bottom left",
          "left",
          "top left"
        ]
      },
      {
        property: "background-repeat",
        label: "Repeat",
        type: "select",
        options: ["", "repeat", "no-repeat", "repeat-x", "repeat-y", "space", "round"]
      },
      {
        property: "background-attachment",
        label: "Attachment",
        type: "select",
        options: ["", "scroll", "fixed", "local"]
      },
      {
        property: "background-clip",
        label: "Clip",
        type: "select",
        options: ["", "border-box", "padding-box", "content-box", "text"]
      },
      {
        property: "background-origin",
        label: "Origin",
        type: "select",
        options: ["", "border-box", "padding-box", "content-box"]
      },
      {
        property: "background-blend-mode",
        label: "Blend mode",
        type: "select",
        options: [
          "",
          "normal",
          "multiply",
          "screen",
          "overlay",
          "darken",
          "lighten",
          "color-dodge",
          "color-burn",
          "hard-light",
          "soft-light",
          "difference",
          "exclusion",
          "hue",
          "saturation",
          "color",
          "luminosity"
        ]
      }
    ]
  },
  {
    id: "spacing",
    label: "Spacing & box model",
    properties: [
      {
        property: "margin",
        label: "Margin shorthand",
        type: "text",
        placeholder: "12px auto 24px"
      },
      ...(["top", "right", "bottom", "left"] as const).map((side) => ({
        property: `margin-${side}`,
        label: `Margin ${side}`,
        type: "dimension" as const,
        units: LENGTH_UNITS,
        placeholder: "0px"
      })),
      {
        property: "padding",
        label: "Padding shorthand",
        type: "text",
        placeholder: "12px 20px"
      },
      ...(["top", "right", "bottom", "left"] as const).map((side) => ({
        property: `padding-${side}`,
        label: `Padding ${side}`,
        type: "dimension" as const,
        units: LENGTH_UNITS.filter((unit) => unit !== "auto"),
        placeholder: "0px"
      })),
      {
        property: "gap",
        label: "Gap",
        type: "dimension",
        units: LENGTH_UNITS.filter((unit) => unit !== "auto"),
        placeholder: "0px"
      },
      {
        property: "row-gap",
        label: "Row gap",
        type: "dimension",
        units: LENGTH_UNITS.filter((unit) => unit !== "auto"),
        placeholder: "0px"
      },
      {
        property: "column-gap",
        label: "Column gap",
        type: "dimension",
        units: LENGTH_UNITS.filter((unit) => unit !== "auto"),
        placeholder: "0px"
      }
    ]
  },
  {
    id: "dimensions",
    label: "Dimensions",
    properties: [
      { property: "width", label: "Width", type: "dimension", units: SIZE_UNITS },
      { property: "min-width", label: "Min width", type: "dimension", units: SIZE_UNITS },
      { property: "max-width", label: "Max width", type: "dimension", units: SIZE_UNITS },
      { property: "height", label: "Height", type: "dimension", units: SIZE_UNITS },
      {
        property: "min-height",
        label: "Min height",
        type: "dimension",
        units: SIZE_UNITS
      },
      {
        property: "max-height",
        label: "Max height",
        type: "dimension",
        units: SIZE_UNITS
      },
      {
        property: "aspect-ratio",
        label: "Aspect ratio",
        type: "text",
        placeholder: "16 / 9"
      },
      {
        property: "box-sizing",
        label: "Box sizing",
        type: "select",
        options: ["", "border-box", "content-box"]
      }
    ]
  },
  {
    id: "borders",
    label: "Borders & outlines",
    properties: [
      {
        property: "border-width",
        label: "All widths",
        type: "dimension",
        units: ["px", "em", "rem"]
      },
      {
        property: "border-style",
        label: "All styles",
        type: "select",
        options: ["", "none", "solid", "dashed", "dotted", "double", "groove", "ridge"]
      },
      { property: "border-color", label: "All colors", type: "color" },
      {
        property: "border-radius",
        label: "All corners",
        type: "dimension",
        units: ["px", "%", "em", "rem"]
      },
      ...(["top-left", "top-right", "bottom-right", "bottom-left"] as const).map(
        (corner) => ({
          property: `border-${corner}-radius`,
          label: corner
            .split("-")
            .map((part) => part[0].toUpperCase() + part.slice(1))
            .join(" "),
          type: "dimension" as const,
          units: ["px", "%", "em", "rem"]
        })
      ),
      ...(["top", "right", "bottom", "left"] as const).flatMap((side) => [
        {
          property: `border-${side}-width`,
          label: `${side[0].toUpperCase() + side.slice(1)} width`,
          type: "dimension" as const,
          units: ["px", "em", "rem"]
        },
        {
          property: `border-${side}-style`,
          label: `${side[0].toUpperCase() + side.slice(1)} style`,
          type: "select" as const,
          options: ["", "none", "solid", "dashed", "dotted", "double"]
        },
        {
          property: `border-${side}-color`,
          label: `${side[0].toUpperCase() + side.slice(1)} color`,
          type: "color" as const
        }
      ]),
      {
        property: "outline",
        label: "Outline",
        type: "text",
        placeholder: "2px solid #6d5dfc"
      },
      {
        property: "outline-offset",
        label: "Outline offset",
        type: "dimension",
        units: ["px", "em", "rem"]
      }
    ]
  },
  {
    id: "layout",
    label: "Layout & position",
    properties: [
      {
        property: "display",
        label: "Display",
        type: "select",
        options: [
          "",
          "block",
          "inline",
          "inline-block",
          "flow-root",
          "flex",
          "inline-flex",
          "grid",
          "inline-grid",
          "contents",
          "none"
        ]
      },
      {
        property: "position",
        label: "Position",
        type: "select",
        options: ["", "static", "relative", "absolute", "fixed", "sticky"]
      },
      ...(["top", "right", "bottom", "left"] as const).map((side) => ({
        property: side,
        label: side[0].toUpperCase() + side.slice(1),
        type: "dimension" as const,
        units: LENGTH_UNITS,
        placeholder: "auto"
      })),
      { property: "inset", label: "Inset", type: "text", placeholder: "0 auto auto 0" },
      { property: "z-index", label: "Z-index", type: "text", placeholder: "auto" },
      {
        property: "overflow",
        label: "Overflow",
        type: "select",
        options: ["", "visible", "hidden", "auto", "scroll", "clip"]
      },
      {
        property: "overflow-x",
        label: "Overflow X",
        type: "select",
        options: ["", "visible", "hidden", "auto", "scroll", "clip"]
      },
      {
        property: "overflow-y",
        label: "Overflow Y",
        type: "select",
        options: ["", "visible", "hidden", "auto", "scroll", "clip"]
      },
      {
        property: "visibility",
        label: "Visibility",
        type: "select",
        options: ["", "visible", "hidden", "collapse"]
      },
      {
        property: "float",
        label: "Float",
        type: "select",
        options: ["", "none", "left", "right", "inline-start", "inline-end"]
      },
      {
        property: "clear",
        label: "Clear",
        type: "select",
        options: ["", "none", "left", "right", "both", "inline-start", "inline-end"]
      },
      {
        property: "isolation",
        label: "Isolation",
        type: "select",
        options: ["", "auto", "isolate"]
      },
      {
        property: "object-fit",
        label: "Object fit",
        type: "select",
        options: ["", "fill", "contain", "cover", "none", "scale-down"]
      },
      {
        property: "object-position",
        label: "Object position",
        type: "text",
        placeholder: "50% 50%"
      }
    ]
  },
  {
    id: "flexbox",
    label: "Flexbox",
    properties: [
      {
        property: "flex-direction",
        label: "Direction",
        type: "select",
        options: ["", "row", "row-reverse", "column", "column-reverse"]
      },
      {
        property: "flex-wrap",
        label: "Wrap",
        type: "select",
        options: ["", "nowrap", "wrap", "wrap-reverse"]
      },
      {
        property: "justify-content",
        label: "Justify",
        type: "select",
        options: [
          "",
          "flex-start",
          "center",
          "flex-end",
          "space-between",
          "space-around",
          "space-evenly"
        ]
      },
      {
        property: "align-items",
        label: "Align items",
        type: "select",
        options: ["", "stretch", "flex-start", "center", "flex-end", "baseline"]
      },
      {
        property: "align-content",
        label: "Align content",
        type: "select",
        options: [
          "",
          "normal",
          "stretch",
          "flex-start",
          "center",
          "flex-end",
          "space-between",
          "space-around",
          "space-evenly"
        ]
      },
      {
        property: "align-self",
        label: "Align self",
        type: "select",
        options: ["", "auto", "stretch", "flex-start", "center", "flex-end", "baseline"]
      },
      { property: "flex-grow", label: "Grow", type: "text", placeholder: "0" },
      { property: "flex-shrink", label: "Shrink", type: "text", placeholder: "1" },
      {
        property: "flex-basis",
        label: "Basis",
        type: "dimension",
        units: SIZE_UNITS,
        placeholder: "auto"
      },
      { property: "order", label: "Order", type: "text", placeholder: "0" }
    ]
  },
  {
    id: "grid",
    label: "CSS Grid",
    properties: [
      {
        property: "grid-template-columns",
        label: "Columns",
        type: "text",
        placeholder: "repeat(3, minmax(0, 1fr))"
      },
      {
        property: "grid-template-rows",
        label: "Rows",
        type: "text",
        placeholder: "auto 1fr auto"
      },
      {
        property: "grid-column",
        label: "Grid column",
        type: "text",
        placeholder: "1 / -1"
      },
      { property: "grid-row", label: "Grid row", type: "text", placeholder: "auto" },
      {
        property: "grid-auto-flow",
        label: "Auto flow",
        type: "select",
        options: ["", "row", "column", "dense", "row dense", "column dense"]
      },
      {
        property: "grid-auto-columns",
        label: "Auto columns",
        type: "text",
        placeholder: "minmax(0, 1fr)"
      },
      {
        property: "grid-auto-rows",
        label: "Auto rows",
        type: "text",
        placeholder: "auto"
      },
      {
        property: "justify-items",
        label: "Justify items",
        type: "select",
        options: ["", "normal", "stretch", "start", "center", "end"]
      },
      {
        property: "place-items",
        label: "Place items",
        type: "select",
        options: ["", "stretch", "start", "center", "end"]
      },
      {
        property: "place-content",
        label: "Place content",
        type: "select",
        options: ["", "normal", "stretch", "start", "center", "end", "space-between"]
      }
    ]
  },
  {
    id: "effects",
    label: "Effects & transform",
    properties: [
      {
        property: "opacity",
        label: "Opacity",
        type: "range",
        min: 0,
        max: 1,
        step: 0.01
      },
      {
        property: "box-shadow",
        label: "Box shadow",
        type: "text",
        placeholder: "0 12px 30px rgba(0,0,0,.2)"
      },
      {
        property: "filter",
        label: "Filter",
        type: "text",
        placeholder: "blur(2px) saturate(1.2)"
      },
      {
        property: "backdrop-filter",
        label: "Backdrop filter",
        type: "text",
        placeholder: "blur(12px)"
      },
      {
        property: "mix-blend-mode",
        label: "Blend mode",
        type: "select",
        options: [
          "",
          "normal",
          "multiply",
          "screen",
          "overlay",
          "darken",
          "lighten",
          "difference",
          "exclusion"
        ]
      },
      {
        property: "transform",
        label: "Transform",
        type: "text",
        placeholder: "translateX(0) rotate(0deg) scale(1)"
      },
      {
        property: "translate",
        label: "Translate",
        type: "text",
        placeholder: "0px 0px"
      },
      { property: "rotate", label: "Rotate", type: "text", placeholder: "0deg" },
      { property: "scale", label: "Scale", type: "text", placeholder: "1" },
      {
        property: "transform-origin",
        label: "Origin",
        type: "text",
        placeholder: "center center"
      },
      {
        property: "perspective",
        label: "Perspective",
        type: "dimension",
        units: ["px", "em", "rem", "none"]
      },
      {
        property: "cursor",
        label: "Cursor",
        type: "select",
        options: [
          "",
          "auto",
          "default",
          "pointer",
          "grab",
          "grabbing",
          "move",
          "text",
          "not-allowed"
        ]
      },
      {
        property: "pointer-events",
        label: "Pointer events",
        type: "select",
        options: ["", "auto", "none"]
      }
    ]
  },
  {
    id: "lists",
    label: "Lists",
    properties: [
      {
        property: "list-style-type",
        label: "Marker type",
        type: "select",
        options: [
          "",
          "none",
          "disc",
          "circle",
          "square",
          "decimal",
          "decimal-leading-zero",
          "lower-alpha",
          "upper-alpha",
          "lower-roman",
          "upper-roman"
        ]
      },
      {
        property: "list-style-position",
        label: "Marker position",
        type: "select",
        options: ["", "inside", "outside"]
      },
      {
        property: "list-style-image",
        label: "Marker image",
        type: "text",
        placeholder: "url(https://…)"
      }
    ]
  },
  {
    id: "motion",
    label: "Transitions & behavior",
    properties: [
      {
        property: "transition-property",
        label: "Transition property",
        type: "text",
        placeholder: "color, transform"
      },
      {
        property: "transition-duration",
        label: "Duration",
        type: "dimension",
        units: ["ms", "s"],
        placeholder: "200ms"
      },
      {
        property: "transition-timing-function",
        label: "Easing",
        type: "select",
        options: ["", "ease", "linear", "ease-in", "ease-out", "ease-in-out"]
      },
      {
        property: "transition-delay",
        label: "Delay",
        type: "dimension",
        units: ["ms", "s"],
        placeholder: "0ms"
      },
      {
        property: "user-select",
        label: "User select",
        type: "select",
        options: ["", "auto", "none", "text", "all"]
      },
      {
        property: "resize",
        label: "Native resize",
        type: "select",
        options: ["", "none", "both", "horizontal", "vertical", "block", "inline"]
      }
    ]
  }
];
