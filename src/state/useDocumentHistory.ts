import { useCallback, useState } from "react";
import type { CellDocument } from "../types";

interface DocumentHistory {
  past: CellDocument[];
  present: CellDocument;
  future: CellDocument[];
}

export function useDocumentHistory(initial: CellDocument): {
  document: CellDocument;
  canUndo: boolean;
  canRedo: boolean;
  commit: (next: CellDocument) => void;
  replace: (next: CellDocument) => void;
  undo: () => void;
  redo: () => void;
} {
  const [history, setHistory] = useState<DocumentHistory>({
    past: [],
    present: initial,
    future: [],
  });

  const commit = useCallback((next: CellDocument) => {
    setHistory((current) => {
      if (current.present === next) {
        return current;
      }
      return {
        past: [...current.past, current.present].slice(-100),
        present: next,
        future: [],
      };
    });
  }, []);

  const replace = useCallback((next: CellDocument) => {
    setHistory({ past: [], present: next, future: [] });
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      const previous = current.past[current.past.length - 1];
      if (!previous) {
        return current;
      }
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      const next = current.future[0];
      if (!next) {
        return current;
      }
      return {
        past: [...current.past, current.present],
        present: next,
        future: current.future.slice(1),
      };
    });
  }, []);

  return {
    document: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    commit,
    replace,
    undo,
    redo,
  };
}
