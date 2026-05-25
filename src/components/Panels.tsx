import type {
  CellDocument,
  EditorTool,
  FractionalPoint,
  LatticeType,
  PeriodicFace,
  SymmetryResult,
} from "../types";
import { WALLPAPER_GROUPS } from "../data/wallpaperGroups";
import { faceColor, FACE_BACKGROUND_COLOR } from "../math/periodicGraph";

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
      <section>
        <h2>Lattice</h2>
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
      </section>
      <section>
        <h2>Construct</h2>
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
      </section>
      <section>
        <h2>Face Color</h2>
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
      </section>
      <section>
        <h2>Display</h2>
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
      </section>
      <section>
        <h2>Symmetric Editing</h2>
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
          When enabled, motif and color edits propagate through the locked group operations.
        </p>
      </section>
    </aside>
  );
}

interface InspectorProps {
  document: CellDocument;
  symmetry: SymmetryResult;
  faces: PeriodicFace[];
  pointer: FractionalPoint | null;
  selectedSymmetryElementId: string | null;
  onSelectSymmetryElement: (elementId: string) => void;
  onLoadPreset: (symbol: string) => void;
}

export function Inspector({
  document,
  symmetry,
  faces,
  pointer,
  selectedSymmetryElementId,
  onSelectSymmetryElement,
  onLoadPreset,
}: InspectorProps) {
  const euler = document.vertices.length - document.edges.length + faces.length;
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
      <section className="cw-block">
        <h2>CW Complex</h2>
        <div className="cw-counts">
          <div>
            <strong>{document.vertices.length}</strong>
            <span>0-cells</span>
          </div>
          <div>
            <strong>{document.edges.length}</strong>
            <span>1-cells</span>
          </div>
          <div>
            <strong>{faces.length}</strong>
            <span>2-cells</span>
          </div>
        </div>
        <p className={euler === 0 ? "euler valid" : "euler warning"}>
          Euler check on torus: V - E + F = {euler}
        </p>
        <div className="face-list">
          {faces.slice(0, 6).map((face, index) => (
            <div key={face.signature}>
              <span
                className="face-chip"
                style={{ backgroundColor: faceColor(document, face.signature) }}
              />
              <span>face {index + 1}</span>
              <code>
                ({face.centroid.u.toFixed(2)}, {face.centroid.v.toFixed(2)})
              </code>
            </div>
          ))}
          {faces.length > 6 && <p className="minor">+ {faces.length - 6} additional faces</p>}
        </div>
      </section>
      <section className="presets-block">
        <h2>17 Plane Groups</h2>
        <div className="preset-grid">
          {WALLPAPER_GROUPS.map((group) => (
            <button
              type="button"
              key={group.symbol}
              className={document.presetGroup === group.symbol ? "preset is-selected" : "preset"}
              onClick={() => onLoadPreset(group.symbol)}
              title={group.feature}
            >
              {group.symbol}
            </button>
          ))}
        </div>
      </section>
      <footer className="coordinate-readout">
        fractional cursor{" "}
        <code>
          {pointer ? `${pointer.u.toFixed(3)}, ${pointer.v.toFixed(3)}` : "-, -"}
        </code>
      </footer>
    </aside>
  );
}
