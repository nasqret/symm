import { useEffect, useMemo, useRef, useState } from "react";
import type { CellDocument, EditorTool, FractionalPoint, TileOffset } from "./types";
import { buildPresetDocument } from "./data/wallpaperGroups";
import { extractFaces, faceColor, FACE_BACKGROUND_COLOR } from "./math/periodicGraph";
import { computeSymmetry } from "./math/symmetry";
import {
  addEdge,
  addVertex,
  changeLattice,
  clearFaceColor,
  colorFace,
  deleteEdge,
  deleteVertex,
} from "./state/mutations";
import { useDocumentHistory } from "./state/useDocumentHistory";
import { Inspector, ToolPanel, EDITOR_PALETTE } from "./components/Panels";
import { PreviewWindow, STORAGE_KEY } from "./components/PreviewWindow";
import { UnitCellCanvas } from "./components/UnitCellCanvas";
import "./styles.css";

function loadInitialDocument(): CellDocument {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as CellDocument;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
  return buildPresetDocument("p4m");
}

function isCellDocument(value: unknown): value is CellDocument {
  if (!value || typeof value !== "object") {
    return false;
  }
  const document = value as Partial<CellDocument>;
  return (
    document.schemaVersion === 1 &&
    Boolean(document.lattice) &&
    Array.isArray(document.vertices) &&
    Array.isArray(document.edges) &&
    Array.isArray(document.faceColors)
  );
}

export default function App() {
  if (window.location.hash === "#preview") {
    return <PreviewWindow />;
  }
  return <Editor />;
}

function Editor() {
  const { document, canUndo, canRedo, commit, replace, undo, redo } = useDocumentHistory(
    loadInitialDocument(),
  );
  const [tool, setTool] = useState<EditorTool>("select");
  const [selectedColor, setSelectedColor] = useState(EDITOR_PALETTE[0]);
  const [edgeStart, setEdgeStart] = useState<{
    vertexId: string;
    tile: TileOffset;
  } | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [pointer, setPointer] = useState<FractionalPoint | null>(null);
  const [notice, setNotice] = useState<string>("Autosaved locally");
  const fileInput = useRef<HTMLInputElement>(null);
  const faces = useMemo(() => extractFaces(document), [document]);
  const symmetry = useMemo(() => computeSymmetry(document), [document]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
  }, [document]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const command = event.metaKey || event.ctrlKey;
      if (command && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedEdgeId) {
        const target = event.target as HTMLElement;
        if (!["INPUT", "TEXTAREA"].includes(target.tagName)) {
          commit(deleteEdge(document, selectedEdgeId, selectedColor));
          setSelectedEdgeId(null);
          setNotice("Edge removed; selected color applied to the merged face");
        }
      }
      const shortcuts: Record<string, EditorTool> = {
        v: "select",
        p: "vertex",
        e: "edge",
        c: "color",
      };
      if (!command && shortcuts[event.key.toLowerCase()]) {
        setTool(shortcuts[event.key.toLowerCase()]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commit, document, redo, selectedColor, selectedEdgeId, undo]);

  const saveDocument = () => {
    const contents = JSON.stringify(document, null, 2);
    const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${document.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("JSON state exported");
  };

  const loadFile = async (file: File) => {
    const parsed: unknown = JSON.parse(await file.text());
    if (!isCellDocument(parsed)) {
      throw new Error("This file is not a Unit Cell Designer v1 document.");
    }
    replace(parsed);
    setNotice(`Loaded ${file.name}`);
    setSelectedEdgeId(null);
    setEdgeStart(null);
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" />
          <div>
            <h1>Unit Cell Designer</h1>
            <p>{document.name}</p>
          </div>
        </div>
        <nav className="header-actions" aria-label="Document actions">
          <button type="button" onClick={saveDocument}>
            Save JSON
          </button>
          <button type="button" onClick={() => fileInput.current?.click()}>
            Load
          </button>
          <span className="separator" />
          <button type="button" onClick={undo} disabled={!canUndo}>
            Undo
          </button>
          <button type="button" onClick={redo} disabled={!canRedo}>
            Redo
          </button>
          <button
            className="primary-action"
            type="button"
            onClick={() => window.open(`${window.location.pathname}#preview`, "tiling-preview")}
          >
            Open Tiling Preview
          </button>
        </nav>
        <input
          ref={fileInput}
          hidden
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              loadFile(file).catch((error: unknown) => {
                setNotice(error instanceof Error ? error.message : "Could not load document");
              });
            }
            event.target.value = "";
          }}
        />
      </header>
      <div className="editor-grid">
        <ToolPanel
          latticeType={document.lattice.type}
          tool={tool}
          selectedColor={selectedColor}
          onLatticeChange={(lattice) => {
            commit(changeLattice(document, lattice));
            setNotice(`New ${lattice} lattice cell`);
          }}
          onToolChange={(nextTool) => {
            setTool(nextTool);
            setEdgeStart(null);
          }}
          onColorChange={(color) => {
            setSelectedColor(color);
            setTool("color");
          }}
        />
        <main className="workspace">
          <div className="workspace-heading">
            <div>
              <h2>Fundamental Cell</h2>
              <p>Neighbors are live translations; connect across them to cross a boundary.</p>
            </div>
            {selectedEdgeId && (
              <button
                type="button"
                className="delete-action"
                onClick={() => {
                  commit(deleteEdge(document, selectedEdgeId, selectedColor));
                  setSelectedEdgeId(null);
                  setNotice("Edge removed; selected color applied to the merged face");
                }}
              >
                Delete selected edge
              </button>
            )}
          </div>
          <UnitCellCanvas
            document={document}
            tool={tool}
            edgeStart={edgeStart}
            selectedEdgeId={selectedEdgeId}
            onCoordinate={setPointer}
            onAddVertex={(point) => {
              commit(addVertex(document, point));
              setNotice("Vertex added modulo the lattice");
            }}
            onSelectEdge={setSelectedEdgeId}
            onDeleteEdge={(edgeId) => {
              commit(deleteEdge(document, edgeId, selectedColor));
              setSelectedEdgeId(null);
              setNotice("Edge removed; selected color applied to the merged face");
            }}
            onDeleteVertex={(vertexId) => {
              commit(deleteVertex(document, vertexId, selectedColor));
              setSelectedEdgeId(null);
              setEdgeStart(null);
              setNotice("Vertex removed; selected color applied to the merged face");
            }}
            onVertexHit={(hit) => {
              if (!edgeStart) {
                setEdgeStart(hit);
                setNotice("Select an endpoint in any translated cell");
                return;
              }
              commit(addEdge(document, edgeStart, hit));
              setEdgeStart(null);
              setNotice("Periodic edge added");
            }}
            onColorFace={(face) => {
              if (faceColor(document, face.signature) !== FACE_BACKGROUND_COLOR) {
                commit(clearFaceColor(document, face));
                setNotice("Face color cleared; symmetry recomputed");
              } else {
                commit(colorFace(document, face, selectedColor));
                setNotice(
                  selectedColor === FACE_BACKGROUND_COLOR
                    ? "Face already has the background color"
                    : "Face color updated; symmetry recomputed",
                );
              }
            }}
          />
          <footer className="workspace-status">
            <span>
              active tool <strong>{tool}</strong>
            </span>
            <span>{notice}</span>
          </footer>
        </main>
        <Inspector
          document={document}
          symmetry={symmetry}
          faces={faces}
          pointer={pointer}
          onLoadPreset={(symbol) => {
            commit(buildPresetDocument(symbol));
            setEdgeStart(null);
            setSelectedEdgeId(null);
            setNotice(`Loaded ${symbol} starting motif`);
          }}
        />
      </div>
    </div>
  );
}
