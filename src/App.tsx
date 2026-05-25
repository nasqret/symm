import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AffineOperation,
  CellDocument,
  EditorTool,
  FractionalPoint,
  SymmetryResult,
  TileOffset,
} from "./types";
import { buildPresetDocument, operationClosure } from "./data/wallpaperGroups";
import { extractFaces, faceColor, FACE_BACKGROUND_COLOR } from "./math/periodicGraph";
import { computeSymmetry } from "./math/symmetry";
import {
  addEdgeInOrbit,
  addVertexInOrbit,
  clearFaceColorInOrbit,
  colorFaceInOrbit,
  deleteEdgeInOrbit,
  deleteVertexInOrbit,
} from "./math/symmetryEditing";
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
import { useDisplaySettings } from "./state/useDisplaySettings";
import { Inspector, ToolPanel, EDITOR_PALETTE } from "./components/Panels";
import { ExplorationDemo } from "./components/ExplorationDemo";
import { PreviewWindow, STORAGE_KEY } from "./components/PreviewWindow";
import { UnitCellCanvas } from "./components/UnitCellCanvas";
import "./styles.css";

interface SymmetryLock {
  symbol: string;
  operations: AffineOperation[];
}

function createSymmetryLock(symmetry: SymmetryResult): SymmetryLock {
  return {
    symbol: symmetry.symbol,
    operations: operationClosure(
      symmetry.elements.flatMap((element) => (element.operation ? [element.operation] : [])),
    ),
  };
}

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
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const syncRoute = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  if (route === "#preview") {
    return <PreviewWindow />;
  }
  if (route === "#demo") {
    return <ExplorationDemo />;
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
  const [selectedSymmetryElementId, setSelectedSymmetryElementId] = useState<string | null>(null);
  const [symmetryLock, setSymmetryLock] = useState<SymmetryLock | null>(null);
  const [display, toggleDisplay] = useDisplaySettings();
  const fileInput = useRef<HTMLInputElement>(null);
  const faces = useMemo(() => extractFaces(document), [document]);
  const symmetry = useMemo(() => computeSymmetry(document), [document]);
  const selectedSymmetryElement =
    symmetry.elements.find((element) => element.id === selectedSymmetryElementId) ?? null;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
  }, [document]);

  useEffect(() => {
    if (
      selectedSymmetryElementId &&
      !symmetry.elements.some((element) => element.id === selectedSymmetryElementId)
    ) {
      setSelectedSymmetryElementId(null);
    }
  }, [selectedSymmetryElementId, symmetry.elements]);

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
          commit(
            symmetryLock
              ? deleteEdgeInOrbit(document, selectedEdgeId, selectedColor, symmetryLock.operations)
              : deleteEdge(document, selectedEdgeId, selectedColor),
          );
          setSelectedEdgeId(null);
          setNotice(
            symmetryLock
              ? `Edge orbit removed; ${symmetryLock.symbol} preservation active`
              : "Edge removed; selected color applied to the merged face",
          );
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
  }, [commit, document, redo, selectedColor, selectedEdgeId, symmetryLock, undo]);

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
    if (symmetryLock) {
      setSymmetryLock(createSymmetryLock(computeSymmetry(parsed)));
    }
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
          <button
            className="primary-action demo-action"
            type="button"
            onClick={() => window.open(`${window.location.pathname}#demo`, "tiling-demo")}
          >
            Explore Subgroups
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
          symmetryLock={symmetryLock?.symbol ?? null}
          showEdges={display.showEdges}
          showVertices={display.showVertices}
          onLatticeChange={(lattice) => {
            const changed = changeLattice(document, lattice);
            commit(changed);
            if (symmetryLock) {
              setSymmetryLock(createSymmetryLock(computeSymmetry(changed)));
            }
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
          onToggleSymmetryLock={() => {
            if (symmetryLock) {
              setSymmetryLock(null);
              setNotice("Symmetry-preserving propagation disabled");
            } else {
              setSymmetryLock(createSymmetryLock(symmetry));
              setNotice(`Edits will preserve ${symmetry.symbol} symmetry`);
            }
          }}
          onToggleEdges={() => toggleDisplay("showEdges")}
          onToggleVertices={() => toggleDisplay("showVertices")}
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
                  commit(
                    symmetryLock
                      ? deleteEdgeInOrbit(
                          document,
                          selectedEdgeId,
                          selectedColor,
                          symmetryLock.operations,
                        )
                      : deleteEdge(document, selectedEdgeId, selectedColor),
                  );
                  setSelectedEdgeId(null);
                  setNotice(
                    symmetryLock
                      ? `Edge orbit removed; ${symmetryLock.symbol} preservation active`
                      : "Edge removed; selected color applied to the merged face",
                  );
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
            selectedSymmetryElement={selectedSymmetryElement}
            showEdges={display.showEdges}
            showVertices={display.showVertices}
            onCoordinate={setPointer}
            onAddVertex={(point) => {
              commit(
                symmetryLock
                  ? addVertexInOrbit(document, point, symmetryLock.operations)
                  : addVertex(document, point),
              );
              setNotice(
                symmetryLock
                  ? `Vertex orbit added; ${symmetryLock.symbol} preservation active`
                  : "Vertex added modulo the lattice",
              );
            }}
            onSelectEdge={setSelectedEdgeId}
            onDeleteEdge={(edgeId) => {
              commit(
                symmetryLock
                  ? deleteEdgeInOrbit(document, edgeId, selectedColor, symmetryLock.operations)
                  : deleteEdge(document, edgeId, selectedColor),
              );
              setSelectedEdgeId(null);
              setNotice(
                symmetryLock
                  ? `Edge orbit removed; ${symmetryLock.symbol} preservation active`
                  : "Edge removed; selected color applied to the merged face",
              );
            }}
            onDeleteVertex={(vertexId) => {
              commit(
                symmetryLock
                  ? deleteVertexInOrbit(document, vertexId, selectedColor, symmetryLock.operations)
                  : deleteVertex(document, vertexId, selectedColor),
              );
              setSelectedEdgeId(null);
              setEdgeStart(null);
              setNotice(
                symmetryLock
                  ? `Vertex orbit removed; ${symmetryLock.symbol} preservation active`
                  : "Vertex removed; selected color applied to the merged face",
              );
            }}
            onVertexHit={(hit) => {
              if (!edgeStart) {
                setEdgeStart(hit);
                setNotice("Select an endpoint in any translated cell");
                return;
              }
              commit(
                symmetryLock
                  ? addEdgeInOrbit(document, edgeStart, hit, symmetryLock.operations)
                  : addEdge(document, edgeStart, hit),
              );
              setEdgeStart(null);
              setNotice(
                symmetryLock
                  ? `Edge orbit added; ${symmetryLock.symbol} preservation active`
                  : "Periodic edge added",
              );
            }}
            onColorFace={(face) => {
              if (faceColor(document, face.signature) !== FACE_BACKGROUND_COLOR) {
                commit(
                  symmetryLock
                    ? clearFaceColorInOrbit(document, face, symmetryLock.operations)
                    : clearFaceColor(document, face),
                );
                setNotice(
                  symmetryLock
                    ? `Face orbit cleared; ${symmetryLock.symbol} preservation active`
                    : "Face color cleared; symmetry recomputed",
                );
              } else {
                commit(
                  symmetryLock
                    ? colorFaceInOrbit(document, face, selectedColor, symmetryLock.operations)
                    : colorFace(document, face, selectedColor),
                );
                setNotice(
                  selectedColor === FACE_BACKGROUND_COLOR
                    ? "Face already has the background color"
                    : symmetryLock
                      ? `Face orbit colored; ${symmetryLock.symbol} preservation active`
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
          selectedSymmetryElementId={selectedSymmetryElementId}
          onSelectSymmetryElement={(elementId) =>
            setSelectedSymmetryElementId((current) =>
              current === elementId ? null : elementId,
            )
          }
          onLoadPreset={(symbol) => {
            const preset = buildPresetDocument(symbol);
            commit(preset);
            if (symmetryLock) {
              setSymmetryLock(createSymmetryLock(computeSymmetry(preset)));
            }
            setEdgeStart(null);
            setSelectedEdgeId(null);
            setNotice(`Loaded ${symbol} starting motif`);
          }}
        />
      </div>
    </div>
  );
}
