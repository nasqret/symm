import { useState } from "react";
import type { ReactNode } from "react";
import type {
  CellDocument,
  EditorTool,
  LatticeType,
  SymmetryResult,
} from "../types";
import { WALLPAPER_GROUPS } from "../data/wallpaperGroups";
import { FACE_BACKGROUND_COLOR } from "../math/periodicGraph";

export const EDITOR_PALETTE = [
  "#d66853",
  "#1f7185",
  "#e0ab45",
  "#547a6b",
  "#8c6c93",
  "#f5f1e8",
  "#242b2d",
];

interface ToolPanelProps {
  latticeType: LatticeType;
  tool: EditorTool;
  selectedColor: string;
  symmetryLock: string | null;
  showEdges: boolean;
  showVertices: boolean;
  onLatticeChange: (value: LatticeType) => void;
  onToolChange: (value: EditorTool) => void;
  onColorChange: (value: string) => void;
  onToggleSymmetryLock: () => void;
  onToggleEdges: () => void;
  onToggleVertices: () => void;
}

const TOOLS: { id: EditorTool; name: string; shortcut: string }[] = [
  { id: "select", name: "Select / delete", shortcut: "V" },
  { id: "vertex", name: "Add / remove vertex", shortcut: "P" },
  { id: "edge", name: "Connect edge", shortcut: "E" },
  { id: "color", name: "Color face", shortcut: "C" },
];

interface FoldSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

function FoldSection({ title, defaultOpen = false, children }: FoldSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details
      className="tool-fold"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <h2>{title}</h2>
        <span aria-hidden="true" />
      </summary>
      <div className="tool-fold-content">{children}</div>
    </details>
  );
}

export function ToolPanel({
  latticeType,
  tool,
  selectedColor,
  symmetryLock,
  showEdges,
  showVertices,
  onLatticeChange,
  onToolChange,
  onColorChange,
  onToggleSymmetryLock,
  onToggleEdges,
  onToggleVertices,
}: ToolPanelProps) {
  return (
    <aside className="panel tools-panel" aria-label="Editor tools">
      <FoldSection title="Lattice" defaultOpen>
        <div className="lattice-list">
          {(["generic", "square", "rectangular", "hexagonal"] as const).map((entry) => (
            <button
              className={entry === latticeType ? "select-button is-selected" : "select-button"}
              key={entry}
              type="button"
              onClick={() => onLatticeChange(entry)}
            >
              <span className={`lattice-icon lattice-icon--${entry}`} />
              {entry}
            </button>
          ))}
        </div>
      </FoldSection>
      <FoldSection title="Construct">
        <div className="tool-list">
          {TOOLS.map((entry) => (
            <button
              className={entry.id === tool ? "tool-button is-selected" : "tool-button"}
              key={entry.id}
              type="button"
              onClick={() => onToolChange(entry.id)}
            >
              <span>{entry.name}</span>
              <kbd>{entry.shortcut}</kbd>
            </button>
          ))}
        </div>
      </FoldSection>
      <FoldSection title="Face Color">
        <div className="palette" aria-label="Color palette">
          {EDITOR_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              className={color === selectedColor ? "swatch is-selected" : "swatch"}
              style={{ backgroundColor: color }}
              aria-label={
                color === FACE_BACKGROUND_COLOR ? "Select background color" : `Select ${color}`
              }
              onClick={() => onColorChange(color)}
            />
          ))}
        </div>
        <p className="help-text">
          Edges may terminate in a translated copy of a vertex. Use visible neighboring cells to
          draw boundary-crossing geometry.
        </p>
        <p className="help-text">
          In Add / remove vertex mode, place vertices on visible grid points and double-click an
          existing vertex to remove it. In Color face mode, click a filled face to clear it.
          Double-clicking an edge in Select / delete mode uses the selected swatch for the merged
          face.
        </p>
      </FoldSection>
      <FoldSection title="Display">
        <div className="visibility-list" role="group" aria-label="Visible motif layers">
          <button
            type="button"
            className={showEdges ? "visibility-button is-visible" : "visibility-button"}
            aria-pressed={showEdges}
            onClick={onToggleEdges}
          >
            <span>Edges</span>
            <strong>{showEdges ? "Shown" : "Hidden"}</strong>
          </button>
          <button
            type="button"
            className={showVertices ? "visibility-button is-visible" : "visibility-button"}
            aria-pressed={showVertices}
            onClick={onToggleVertices}
          >
            <span>Vertices</span>
            <strong>{showVertices ? "Shown" : "Hidden"}</strong>
          </button>
        </div>
        <p className="help-text">
          Hide both motif layers for a face-only pattern view. The same choices apply to preview
          exports.
        </p>
      </FoldSection>
      <FoldSection title="Symmetric Editing">
        <button
          type="button"
          className={symmetryLock ? "symmetry-lock is-selected" : "symmetry-lock"}
          aria-pressed={Boolean(symmetryLock)}
          onClick={onToggleSymmetryLock}
        >
          <span>Preserve symmetry</span>
          <strong>{symmetryLock ?? "Off"}</strong>
        </button>
        <p className="help-text">
          Motif and color edits propagate through the locked group operations; edits that would
          change the exact group are blocked.
        </p>
      </FoldSection>
    </aside>
  );
}

interface InspectorProps {
  document: CellDocument;
  symmetry: SymmetryResult;
  selectedSymmetryElementId: string | null;
  onSelectSymmetryElement: (elementId: string) => void;
  onLoadPreset: (symbol: string) => void;
}

export function Inspector({
  document,
  symmetry,
  selectedSymmetryElementId,
  onSelectSymmetryElement,
  onLoadPreset,
}: InspectorProps) {
  return (
    <aside className="panel inspector-panel" aria-label="Mathematical inspector">
      <section className="symmetry-block">
        <h2>Current Symmetry</h2>
        <div className="group-result">
          <strong>{symmetry.symbol}</strong>
          <span>{symmetry.standardSymbol}</span>
        </div>
        <div className="generator-list" aria-label="Visible symmetry elements">
          {symmetry.elements.map((element) => (
            <button
              type="button"
              key={element.id}
              className={
                element.id === selectedSymmetryElementId
                  ? "generator-button is-selected"
                  : "generator-button"
              }
              aria-pressed={element.id === selectedSymmetryElementId}
              onClick={() => onSelectSymmetryElement(element.id)}
            >
              <span>{element.kind}</span>
              <code>{element.label}</code>
            </button>
          ))}
        </div>
        <p className="minor">Select an element to display its geometric action in the tiling.</p>
        <p className="minor">
          {symmetry.accepted.length} accepted operations; {symmetry.rejectedCount} color/geometry
          conflicts tested.
        </p>
      </section>
      <section className="presets-block">
        <h2>17 Plane Groups</h2>
        <p className="minor preset-context">
          Canonical presets for the {document.lattice.type} lattice. Coloring can lower the
          detected symmetry further.
        </p>
        <div className="preset-grid">
          {WALLPAPER_GROUPS.map((group) => {
            const compatible = group.latticeType === document.lattice.type;
            return (
              <button
                type="button"
                key={group.symbol}
                className={
                  document.presetGroup === group.symbol ? "preset is-selected" : "preset"
                }
                disabled={!compatible}
                onClick={() => onLoadPreset(group.symbol)}
                title={
                  compatible
                    ? group.feature
                    : `Not a ${document.lattice.type} lattice preset.`
                }
              >
                {group.symbol}
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
