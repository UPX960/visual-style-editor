import { useEditorStore } from "../../store/editorStore";

const SIDES = ["top", "right", "bottom", "left"] as const;

interface BoxModelEditorProps {
  selector: string;
  computed: Record<string, string>;
}

export function BoxModelEditor({ selector, computed }: BoxModelEditorProps) {
  const breakpoint = useEditorStore((state) => state.breakpoint);
  const rules = useEditorStore((state) => state.rules);
  const update = useEditorStore((state) => state.updateDeclaration);
  const activeRule = rules.find(
    (rule) => rule.selector === selector && rule.breakpoint === breakpoint
  );

  const valueFor = (property: string) =>
    activeRule?.declarations[property] ?? computed[property] ?? "0px";

  return (
    <div className="vse-box-model" aria-label="Visual box model editor">
      <span className="vse-box-label margin-label">margin</span>
      {SIDES.map((side) => (
        <input
          key={`margin-${side}`}
          className={`margin-${side}`}
          value={valueFor(`margin-${side}`)}
          aria-label={`Margin ${side}`}
          onChange={(event) => update(selector, `margin-${side}`, event.target.value)}
        />
      ))}
      <div className="vse-padding-box">
        <span className="vse-box-label">padding</span>
        {SIDES.map((side) => (
          <input
            key={`padding-${side}`}
            className={`padding-${side}`}
            value={valueFor(`padding-${side}`)}
            aria-label={`Padding ${side}`}
            onChange={(event) => update(selector, `padding-${side}`, event.target.value)}
          />
        ))}
        <div className="vse-content-box">content</div>
      </div>
    </div>
  );
}
