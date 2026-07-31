import {
  ChevronLeft,
  ChevronRight,
  ChevronsUp,
  Copy,
  EyeOff,
  Pin,
  PinOff,
  RotateCcw
} from "lucide-react";
import { useEditorStore } from "../../store/editorStore";

export interface FloatingToolbarActions {
  copySelector: () => void;
  selectRelative: (relation: "parent" | "previous" | "next") => void;
}

export function FloatingToolbar({
  copySelector,
  selectRelative
}: FloatingToolbarActions) {
  const selected = useEditorStore((state) => state.selected);
  const pinned = useEditorStore((state) => state.pinned);
  const setPinned = useEditorStore((state) => state.setPinned);
  const update = useEditorStore((state) => state.updateDeclaration);
  const resetSelected = useEditorStore((state) => state.resetSelected);

  if (!selected) return null;

  const maxLeft = Math.max(8, window.innerWidth - 440);
  const left = Math.min(Math.max(8, selected.rect.left), maxLeft);
  const top = selected.rect.top > 50 ? selected.rect.top - 42 : selected.rect.bottom + 8;

  return (
    <div
      className="vse-floating-toolbar"
      style={{ left: `${left}px`, top: `${Math.max(8, top)}px` }}
      role="toolbar"
      aria-label="Selected element actions"
    >
      <span className="vse-element-pill">&lt;{selected.tagName}&gt;</span>
      <button type="button" title="Copy selector" onClick={copySelector}>
        <Copy size={14} />
      </button>
      <button
        type="button"
        title="Select parent"
        onClick={() => selectRelative("parent")}
      >
        <ChevronsUp size={14} />
      </button>
      <button
        type="button"
        title="Select previous sibling"
        onClick={() => selectRelative("previous")}
      >
        <ChevronLeft size={14} />
      </button>
      <button
        type="button"
        title="Select next sibling"
        onClick={() => selectRelative("next")}
      >
        <ChevronRight size={14} />
      </button>
      <button
        type="button"
        title="Hide element locally"
        onClick={() => update(selected.selector.selector, "display", "none")}
      >
        <EyeOff size={14} />
      </button>
      <button
        type="button"
        title="Reset element"
        onClick={() => resetSelected(selected.selector.selector)}
      >
        <RotateCcw size={14} />
      </button>
      <button
        type="button"
        title={pinned ? "Resume inspector" : "Pin selection"}
        onClick={() => setPinned(!pinned)}
      >
        {pinned ? <PinOff size={14} /> : <Pin size={14} />}
      </button>
    </div>
  );
}
