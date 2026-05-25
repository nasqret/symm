import { useEffect, useMemo, useRef, useState } from "react";
import type { CellDocument } from "../types";
import { buildPresetDocument } from "../data/wallpaperGroups";
import { computeSymmetry } from "../math/symmetry";
import {
  exportTilingPng,
  exportTilingSvg,
  pngDimensions,
  type PngResolution,
} from "../utils/tilingExport";
import { useDisplaySettings } from "../state/useDisplaySettings";
import { UnitCellCanvas } from "./UnitCellCanvas";

export const STORAGE_KEY = "unit-cell-designer.document.v1";

function readStoredDocument(): CellDocument {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return buildPresetDocument("p4m");
  }
  try {
    return JSON.parse(stored) as CellDocument;
  } catch {
    return buildPresetDocument("p4m");
  }
}

export function PreviewWindow({ mobileMode = false }: { mobileMode?: boolean }) {
  const [document, setDocument] = useState(readStoredDocument);
  const [ambient, setAmbient] = useState(false);
  const [notice, setNotice] = useState("Ready to export");
  const [display, toggleDisplay] = useDisplaySettings(mobileMode);
  const drawing = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setDocument(JSON.parse(event.newValue) as CellDocument);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const symmetry = useMemo(() => computeSymmetry(document), [document]);
  const pageClassName = [
    "preview-page",
    ambient ? "is-ambient" : "",
    mobileMode ? "is-mobile-preview" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const getSvg = (): SVGSVGElement | null =>
    drawing.current?.querySelector<SVGSVGElement>("svg") ?? null;

  const saveSvg = () => {
    const svg = getSvg();
    if (!svg) {
      return;
    }
    exportTilingSvg(svg, document.name);
    setNotice("SVG tiling exported");
  };

  const savePng = async (resolution: PngResolution) => {
    const svg = getSvg();
    if (!svg) {
      return;
    }
    try {
      await exportTilingPng(svg, document.name, resolution);
      setNotice(`${resolution} PNG exported at ${pngDimensions(resolution)}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "PNG export failed");
    }
  };

  return (
    <main className={pageClassName}>
      {ambient && mobileMode ? (
        <header className="mobile-ambient-header">
          <div className="mobile-ambient-title">
            <span>{document.name}</span>
            <strong>{symmetry.symbol}</strong>
          </div>
          <button type="button" onClick={() => setAmbient((active) => !active)}>
            Exit ambient
          </button>
        </header>
      ) : (
        <header className="preview-header">
          <div className="preview-title">
            <h1>{document.name}</h1>
            <p>Live periodic tiling preview</p>
          </div>
          <div className="preview-group">
            <span>colored symmetry</span>
            <strong>{symmetry.symbol}</strong>
          </div>
          <nav className="preview-actions" aria-label="Tiling export and presentation actions">
            <button type="button" onClick={() => setAmbient((active) => !active)}>
              {ambient ? "Exit ambient" : "Ambient mode"}
            </button>
            {!mobileMode ? (
              <button
                type="button"
                onClick={() => window.open(`${window.location.pathname}#demo`, "tiling-demo")}
              >
                Explore subgroups
              </button>
            ) : null}
            <div className="presentation-layers" role="group" aria-label="Visible tiling layers">
              <span>Layers</span>
              <button
                type="button"
                className={display.showEdges ? "is-selected" : ""}
                aria-pressed={display.showEdges}
                onClick={() => toggleDisplay("showEdges")}
              >
                Edges
              </button>
              <button
                type="button"
                className={display.showVertices ? "is-selected" : ""}
                aria-pressed={display.showVertices}
                onClick={() => toggleDisplay("showVertices")}
              >
                Vertices
              </button>
            </div>
            <button type="button" onClick={saveSvg}>
              Export SVG
            </button>
            <div className="png-actions" role="group" aria-label="Export PNG resolution">
              <span>PNG</span>
              {(["low", "medium", "high"] as PngResolution[]).map((resolution) => (
                <button
                  key={resolution}
                  type="button"
                  aria-label={`Export PNG ${resolution} resolution`}
                  title={`${resolution} ${pngDimensions(resolution)}`}
                  onClick={() => void savePng(resolution)}
                >
                  {resolution}
                </button>
              ))}
            </div>
          </nav>
        </header>
      )}
      <div className="preview-canvas-frame" ref={drawing}>
        <UnitCellCanvas
          document={document}
          preview
          enablePinchZoom={mobileMode}
          showEdges={display.showEdges}
          showVertices={display.showVertices}
        />
      </div>
      <p className="preview-notice" aria-live="polite">
        {notice}
      </p>
    </main>
  );
}
