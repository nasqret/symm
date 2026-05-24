import { useEffect, useMemo, useState } from "react";
import type { CellDocument } from "../types";
import { buildPresetDocument } from "../data/wallpaperGroups";
import { computeSymmetry } from "../math/symmetry";
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

export function PreviewWindow() {
  const [document, setDocument] = useState(readStoredDocument);
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
  return (
    <main className="preview-page">
      <header className="preview-header">
        <div>
          <h1>{document.name}</h1>
          <p>Live periodic tiling preview</p>
        </div>
        <div className="preview-group">
          <span>colored symmetry</span>
          <strong>{symmetry.symbol}</strong>
        </div>
      </header>
      <UnitCellCanvas document={document} preview />
    </main>
  );
}
