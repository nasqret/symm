import { useEffect, useState } from "react";

export interface DisplaySettings {
  showEdges: boolean;
  showVertices: boolean;
}

export const DISPLAY_SETTINGS_KEY = "unit-cell-designer.display.v1";

const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  showEdges: true,
  showVertices: true,
};

function readDisplaySettings(): DisplaySettings {
  const stored = window.localStorage.getItem(DISPLAY_SETTINGS_KEY);
  if (!stored) {
    return DEFAULT_DISPLAY_SETTINGS;
  }
  try {
    const parsed = JSON.parse(stored) as Partial<DisplaySettings>;
    if (typeof parsed.showEdges === "boolean" && typeof parsed.showVertices === "boolean") {
      return {
        showEdges: parsed.showEdges,
        showVertices: parsed.showVertices,
      };
    }
  } catch {
    window.localStorage.removeItem(DISPLAY_SETTINGS_KEY);
  }
  return DEFAULT_DISPLAY_SETTINGS;
}

export function useDisplaySettings(): [
  DisplaySettings,
  (layer: keyof DisplaySettings) => void,
] {
  const [settings, setSettings] = useState(readDisplaySettings);

  useEffect(() => {
    window.localStorage.setItem(DISPLAY_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === DISPLAY_SETTINGS_KEY) {
        setSettings(readDisplaySettings());
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const toggleLayer = (layer: keyof DisplaySettings) => {
    setSettings((current) => ({ ...current, [layer]: !current[layer] }));
  };

  return [settings, toggleLayer];
}
