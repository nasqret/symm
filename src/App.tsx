import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AffineOperation,
  CellDocument,
  EditorTool,
  LatticeType,
  SymmetryResult,
  TileOffset,
} from "./types";
import {
  buildPresetDocument,
  operationClosure,
  WALLPAPER_GROUPS,
} from "./data/wallpaperGroups";
import { faceColor, FACE_BACKGROUND_COLOR } from "./math/periodicGraph";
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
import { AboutPage, MobileExplorerDisabled, StartOverlay } from "./components/InformationViews";
import { PreviewWindow, STORAGE_KEY } from "./components/PreviewWindow";
import { UnitCellCanvas } from "./components/UnitCellCanvas";
import "./styles.css";

const INTRO_DISMISSED_KEY = "unit-cell-designer.intro-dismissed.v1";
const MOBILE_EDITOR_QUERY = "(max-width: 680px)";
const LATTICE_TYPES: readonly LatticeType[] = [
  "generic",
  "square",
  "rectangular",
  "hexagonal",
];

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

function useMobileEditorMode(): boolean {
  const [mobileMode, setMobileMode] = useState(() =>
    window.matchMedia(MOBILE_EDITOR_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_EDITOR_QUERY);
    const syncMode = () => setMobileMode(media.matches);
    syncMode();
    media.addEventListener("change", syncMode);
    return () => media.removeEventListener("change", syncMode);
  }, []);

  return mobileMode;
}

export default function App() {
  const [route, setRoute] = useState(window.location.hash);
  const mobileMode = useMobileEditorMode();

  useEffect(() => {
    const syncRoute = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  if (route === "#preview") {
    return <PreviewWindow mobileMode={mobileMode} />;
  }
  if (route === "#demo") {
    return mobileMode ? <MobileExplorerDisabled /> : <ExplorationDemo />;
  }
  if (route === "#about") {
    return <AboutPage />;
  }
  return <Editor mobileMode={mobileMode} />;
}

function Editor({ mobileMode }: { mobileMode: boolean }) {
  const [initialDocument] = useState(loadInitialDocument);
  const { document, canUndo, canRedo, commit, replace, undo, redo } = useDocumentHistory(
    initialDocument,
  );
  const [tool, setTool] = useState<EditorTool>("color");
  const [selectedColor, setSelectedColor] = useState(EDITOR_PALETTE[0]);
  const [edgeStart, setEdgeStart] = useState<{
    vertexId: string;
    tile: TileOffset;
  } | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("Preserve symmetry active; autosaved locally");
  const [selectedSymmetryElementId, setSelectedSymmetryElementId] = useState<string | null>(null);
  const [symmetryLock, setSymmetryLock] = useState<SymmetryLock | null>(() =>
    createSymmetryLock(computeSymmetry(initialDocument)),
  );
  const [showStartOverlay, setShowStartOverlay] = useState(
    () => window.localStorage.getItem(INTRO_DISMISSED_KEY) !== "true",
  );
  const [mobileMenuVisible, setMobileMenuVisible] = useState(true);
  const [mobilePanelsVisible, setMobilePanelsVisible] = useState(true);
  const [showMobileSymmetryGenerators, setShowMobileSymmetryGenerators] = useState(false);
  const [display, toggleDisplay] = useDisplaySettings(mobileMode);
  const fileInput = useRef<HTMLInputElement>(null);
  const symmetry = useMemo(() => computeSymmetry(document), [document]);
  const selectedSymmetryElement =
    symmetry.elements.find((element) => element.id === selectedSymmetryElementId) ?? null;
  const mobileCanvasControlsVisible =
    mobileMode && !mobilePanelsVisible && !mobileMenuVisible;
  const compatiblePresetGroups = WALLPAPER_GROUPS.filter(
    (group) => group.latticeType === document.lattice.type,
  );
  const selectedPresetGroup = compatiblePresetGroups.some(
    (group) => group.symbol === document.presetGroup,
  )
    ? document.presetGroup
    : "";
  const visibleSymmetryElements =
    mobileCanvasControlsVisible && showMobileSymmetryGenerators
      ? symmetry.elements
      : selectedSymmetryElement
        ? [selectedSymmetryElement]
        : [];
  const dismissStartOverlay = useCallback(() => {
    window.localStorage.setItem(INTRO_DISMISSED_KEY, "true");
    setShowStartOverlay(false);
  }, []);
  const openAbout = useCallback(() => {
    window.open(`${window.location.pathname}#about`, "unit-cell-about");
  }, []);
  const selectPaletteColor = useCallback((color: string, message?: string) => {
    setSelectedColor(color);
    setTool("color");
    if (message) {
      setNotice(message);
    }
  }, []);
  const cyclePaletteColor = useCallback(
    (direction: -1 | 1) => {
      const currentIndex = Math.max(0, EDITOR_PALETTE.indexOf(selectedColor));
      const nextIndex =
        (currentIndex + direction + EDITOR_PALETTE.length) % EDITOR_PALETTE.length;
      selectPaletteColor(
        EDITOR_PALETTE[nextIndex],
        `Swipe ${direction === 1 ? "up" : "down"}: paint color ${nextIndex + 1} of ${EDITOR_PALETTE.length} selected`,
      );
    },
    [selectPaletteColor, selectedColor],
  );

  const commitEdit = useCallback(
    (changed: CellDocument, standardNotice: string, lockedNotice: string): boolean => {
      if (symmetryLock) {
        const result = computeSymmetry(changed).symbol;
        if (result !== symmetryLock.symbol) {
          setNotice(
            `Edit blocked: Preserve symmetry is locked to ${symmetryLock.symbol}; this change would produce ${result}.`,
          );
          return false;
        }
      }
      commit(changed);
      setNotice(symmetryLock ? lockedNotice : standardNotice);
      return true;
    },
    [commit, symmetryLock],
  );

  const changeEditorLattice = (lattice: LatticeType) => {
    const changed = changeLattice(document, lattice);
    commit(changed);
    if (symmetryLock) {
      setSymmetryLock(createSymmetryLock(computeSymmetry(changed)));
    }
    setSelectedSymmetryElementId(null);
    setShowMobileSymmetryGenerators(false);
    setNotice(`New ${lattice} lattice cell`);
  };

  const loadPreset = (symbol: string) => {
    const preset = buildPresetDocument(symbol);
    commit(preset);
    if (symmetryLock) {
      setSymmetryLock(createSymmetryLock(computeSymmetry(preset)));
    }
    setEdgeStart(null);
    setSelectedEdgeId(null);
    setSelectedSymmetryElementId(null);
    setShowMobileSymmetryGenerators(false);
    setNotice(`Loaded ${symbol} starting motif`);
  };

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
  }, [document]);

  useEffect(() => {
    if (mobileMode) {
      setTool("color");
      setSelectedEdgeId(null);
      setEdgeStart(null);
    } else {
      setMobileMenuVisible(true);
      setMobilePanelsVisible(true);
    }
  }, [mobileMode]);

  useEffect(() => {
    if (
      selectedSymmetryElementId &&
      !symmetry.elements.some((element) => element.id === selectedSymmetryElementId)
    ) {
      setSelectedSymmetryElementId(null);
    }
  }, [selectedSymmetryElementId, symmetry.elements]);

  useEffect(() => {
    if (mobileCanvasControlsVisible) {
      setSelectedSymmetryElementId(null);
    } else {
      setShowMobileSymmetryGenerators(false);
    }
  }, [mobileCanvasControlsVisible]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (showStartOverlay) {
        return;
      }
      const command = event.metaKey || event.ctrlKey;
      const target = event.target as HTMLElement;
      const textEntry =
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
      if (command && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      const colorIndex = Number(event.key) - 1;
      if (
        !command &&
        !event.altKey &&
        !textEntry &&
        colorIndex >= 0 &&
        colorIndex < EDITOR_PALETTE.length
      ) {
        event.preventDefault();
        selectPaletteColor(
          EDITOR_PALETTE[colorIndex],
          `Keyboard: paint color ${colorIndex + 1} of ${EDITOR_PALETTE.length} selected`,
        );
        return;
      }
      if (!mobileMode && (event.key === "Delete" || event.key === "Backspace") && selectedEdgeId) {
        if (!["INPUT", "TEXTAREA"].includes(target.tagName)) {
          const accepted = commitEdit(
            symmetryLock
              ? deleteEdgeInOrbit(document, selectedEdgeId, selectedColor, symmetryLock.operations)
              : deleteEdge(document, selectedEdgeId, selectedColor),
            "Edge removed; selected color applied to the merged face",
            `Edge orbit removed; ${symmetryLock?.symbol} preservation active`,
          );
          if (accepted) {
            setSelectedEdgeId(null);
          }
        }
      }
      const shortcuts: Record<string, EditorTool> = {
        v: "select",
        p: "vertex",
        e: "edge",
        c: "color",
      };
      if (!mobileMode && !command && shortcuts[event.key.toLowerCase()]) {
        setTool(shortcuts[event.key.toLowerCase()]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    commitEdit,
    document,
    redo,
    selectPaletteColor,
    selectedColor,
    selectedEdgeId,
    showStartOverlay,
    symmetryLock,
    mobileMode,
    undo,
  ]);

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

  const shellClassName = [
    "app-shell",
    mobileMode ? "is-mobile-editor" : "",
    mobileMode && !mobilePanelsVisible ? "mobile-panels-hidden" : "",
    mobileMode && !mobileMenuVisible ? "mobile-menu-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClassName}>
      {!mobileMode || mobileMenuVisible ? (
        <header className="app-header">
          <div className="brand">
            <span className="brand-mark" />
            <div>
              <h1>Unit Cell Designer</h1>
              <p>{document.name}</p>
            </div>
          </div>
          {mobileMode ? (
            <button
              className="mobile-menu-hide"
              type="button"
              aria-label="Hide Unit Cell Designer menu"
              onClick={() => setMobileMenuVisible(false)}
            >
              Hide
            </button>
          ) : null}
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
            <span className="separator" />
            <button type="button" onClick={() => setShowStartOverlay(true)}>
              Guide
            </button>
            <button type="button" onClick={openAbout}>
              About
            </button>
            <button
              className="primary-action"
              type="button"
              onClick={() => window.open(`${window.location.pathname}#preview`, "tiling-preview")}
            >
              Open Tiling Preview
            </button>
            {!mobileMode && (
              <button
                className="primary-action demo-action"
                type="button"
                onClick={() => window.open(`${window.location.pathname}#demo`, "tiling-demo")}
              >
                Explore Subgroups
              </button>
            )}
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
      ) : null}
      {mobileMode ? (
        <div className="mobile-control-rail">
          <div className="mobile-studio-bar">
            <strong>Touch color studio</strong>
            <button
              type="button"
              aria-expanded={mobilePanelsVisible}
              aria-controls="mobile-color-panels mobile-analysis-panels"
              onClick={() => setMobilePanelsVisible((visible) => !visible)}
            >
              {mobilePanelsVisible ? "Hide panels" : "Show panels"}
            </button>
          </div>
          {!mobileMenuVisible ? (
            <button
              type="button"
              className="mobile-menu-reveal"
              aria-label="Show Unit Cell Designer menu"
              onClick={() => setMobileMenuVisible(true)}
            >
              <span className="brand-mark" aria-hidden="true" />
              <span>Menu</span>
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="editor-grid">
        {!mobileMode || mobilePanelsVisible ? (
          <ToolPanel
            mobileMode={mobileMode}
            latticeType={document.lattice.type}
            tool={tool}
            selectedColor={selectedColor}
            symmetryLock={symmetryLock?.symbol ?? null}
            showEdges={display.showEdges}
            showVertices={display.showVertices}
            onLatticeChange={(lattice) => {
              changeEditorLattice(lattice);
            }}
            onToolChange={(nextTool) => {
              if (!mobileMode) {
                setTool(nextTool);
                setEdgeStart(null);
              }
            }}
            onColorChange={(color) => selectPaletteColor(color)}
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
        ) : null}
        <main className="workspace">
          {!mobileMode ? (
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
                    const accepted = commitEdit(
                      symmetryLock
                        ? deleteEdgeInOrbit(
                            document,
                            selectedEdgeId,
                            selectedColor,
                            symmetryLock.operations,
                          )
                        : deleteEdge(document, selectedEdgeId, selectedColor),
                      "Edge removed; selected color applied to the merged face",
                      `Edge orbit removed; ${symmetryLock?.symbol} preservation active`,
                    );
                    if (accepted) {
                      setSelectedEdgeId(null);
                    }
                  }}
                >
                  Delete selected edge
                </button>
              )}
            </div>
          ) : null}
          <div className="canvas-stage">
            {mobileCanvasControlsVisible ? (
              <div className="mobile-canvas-controls" aria-label="Quick tiling controls">
                <div className="mobile-canvas-selectors">
                  <label>
                    <span>Lattice</span>
                    <select
                      aria-label="Lattice"
                      value={document.lattice.type}
                      onChange={(event) =>
                        changeEditorLattice(event.target.value as LatticeType)
                      }
                    >
                      {LATTICE_TYPES.map((lattice) => (
                        <option key={lattice} value={lattice}>
                          {lattice}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Group symmetry</span>
                    <select
                      aria-label="Group symmetry"
                      value={selectedPresetGroup}
                      onChange={(event) => {
                        if (event.target.value) {
                          loadPreset(event.target.value);
                        }
                      }}
                    >
                      <option value="">Choose group</option>
                      {compatiblePresetGroups.map((group) => (
                        <option key={group.symbol} value={group.symbol}>
                          {group.symbol}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  className={`mobile-symmetry-toggle${
                    showMobileSymmetryGenerators ? " is-active" : ""
                  }`}
                  aria-pressed={showMobileSymmetryGenerators}
                  onClick={() => {
                    setSelectedSymmetryElementId(null);
                    setShowMobileSymmetryGenerators((visible) => !visible);
                  }}
                >
                  <span>Current symmetry</span>
                  <strong>{symmetry.symbol}</strong>
                  <small>
                    {showMobileSymmetryGenerators ? "hide generators" : "show generators"}
                  </small>
                </button>
              </div>
            ) : null}
            <UnitCellCanvas
              document={document}
              tool={mobileMode ? "color" : tool}
              edgeStart={mobileMode ? null : edgeStart}
              selectedEdgeId={mobileMode ? null : selectedEdgeId}
              selectedSymmetryElements={visibleSymmetryElements}
              showEdges={display.showEdges}
              showVertices={display.showVertices}
              enablePinchZoom={mobileMode}
              colorRollColors={mobileMode ? EDITOR_PALETTE : undefined}
              selectedColor={selectedColor}
              onCycleColor={cyclePaletteColor}
              onAddVertex={(point) => {
                if (mobileMode) {
                  return;
                }
                commitEdit(
                  symmetryLock
                    ? addVertexInOrbit(document, point, symmetryLock.operations)
                    : addVertex(document, point),
                  "Vertex added modulo the lattice",
                  `Vertex orbit added; ${symmetryLock?.symbol} preservation active`,
                );
              }}
              onSelectEdge={(edgeId) => {
                if (!mobileMode) {
                  setSelectedEdgeId(edgeId);
                }
              }}
              onDeleteEdge={(edgeId) => {
                if (mobileMode) {
                  return;
                }
                const accepted = commitEdit(
                  symmetryLock
                    ? deleteEdgeInOrbit(document, edgeId, selectedColor, symmetryLock.operations)
                    : deleteEdge(document, edgeId, selectedColor),
                  "Edge removed; selected color applied to the merged face",
                  `Edge orbit removed; ${symmetryLock?.symbol} preservation active`,
                );
                if (accepted) {
                  setSelectedEdgeId(null);
                }
              }}
              onDeleteVertex={(vertexId) => {
                if (mobileMode) {
                  return;
                }
                const accepted = commitEdit(
                  symmetryLock
                    ? deleteVertexInOrbit(document, vertexId, selectedColor, symmetryLock.operations)
                    : deleteVertex(document, vertexId, selectedColor),
                  "Vertex removed; selected color applied to the merged face",
                  `Vertex orbit removed; ${symmetryLock?.symbol} preservation active`,
                );
                if (accepted) {
                  setSelectedEdgeId(null);
                  setEdgeStart(null);
                }
              }}
              onVertexHit={(hit) => {
                if (mobileMode) {
                  return;
                }
                if (!edgeStart) {
                  setEdgeStart(hit);
                  setNotice("Select an endpoint in any translated cell");
                  return;
                }
                const accepted = commitEdit(
                  symmetryLock
                    ? addEdgeInOrbit(document, edgeStart, hit, symmetryLock.operations)
                    : addEdge(document, edgeStart, hit),
                  "Periodic edge added",
                  `Edge orbit added; ${symmetryLock?.symbol} preservation active`,
                );
                if (accepted) {
                  setEdgeStart(null);
                }
              }}
              onColorFace={(face) => {
                if (faceColor(document, face.signature) !== FACE_BACKGROUND_COLOR) {
                  commitEdit(
                    symmetryLock
                      ? clearFaceColorInOrbit(document, face, symmetryLock.operations)
                      : clearFaceColor(document, face),
                    "Face color cleared; symmetry recomputed",
                    `Face orbit cleared; ${symmetryLock?.symbol} preservation active`,
                  );
                } else {
                  commitEdit(
                    symmetryLock
                      ? colorFaceInOrbit(document, face, selectedColor, symmetryLock.operations)
                      : colorFace(document, face, selectedColor),
                    "Face color updated; symmetry recomputed",
                    selectedColor === FACE_BACKGROUND_COLOR
                      ? "Face already has the background color"
                      : `Face orbit colored; ${symmetryLock?.symbol} preservation active`,
                  );
                }
              }}
              onRollColorFace={(face, color) => {
                selectPaletteColor(color);
                if (faceColor(document, face.signature) === color) {
                  setNotice("Color roller: face already uses this color");
                  return;
                }
                if (color === FACE_BACKGROUND_COLOR) {
                  commitEdit(
                    symmetryLock
                      ? clearFaceColorInOrbit(document, face, symmetryLock.operations)
                      : clearFaceColor(document, face),
                    "Color roller cleared the face",
                    `Color roller cleared the face orbit; ${symmetryLock?.symbol} preservation active`,
                  );
                  return;
                }
                commitEdit(
                  symmetryLock
                    ? colorFaceInOrbit(document, face, color, symmetryLock.operations)
                    : colorFace(document, face, color),
                  "Color roller applied the selected face color",
                  `Color roller applied the face orbit; ${symmetryLock?.symbol} preservation active`,
                );
              }}
            />
          </div>
          {!mobileMode ? (
            <footer className="workspace-status">
              <span>
                active tool <strong>{tool}</strong>
              </span>
              <span>{notice}</span>
            </footer>
          ) : null}
        </main>
        {!mobileMode || mobilePanelsVisible ? (
          <Inspector
            mobileMode={mobileMode}
            document={document}
            symmetry={symmetry}
            selectedSymmetryElementId={selectedSymmetryElementId}
            onSelectSymmetryElement={(elementId) =>
              setSelectedSymmetryElementId((current) =>
                current === elementId ? null : elementId,
              )
            }
            onLoadPreset={loadPreset}
          />
        ) : null}
      </div>
      {showStartOverlay && (
        <StartOverlay
          mobileMode={mobileMode}
          onClose={dismissStartOverlay}
          onOpenAbout={openAbout}
        />
      )}
    </div>
  );
}
