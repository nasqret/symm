import { useEffect, useState } from "react";

export interface DisplaySettings {
  showEdges: boolean;
  showVertices: boolean;
}

export const DISPLAY_SETTINGS_KEY = "unit-cell-designer.display.v1";
export const MOBILE_DISPLAY_SETTINGS_KEY = "unit-cell-designer.display.mobile.v1";

type DisplayScope = "desktop" | "mobile";

const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  showEdges: true,
  showVertices: true,
};

const DEFAULT_MOBILE_DISPLAY_SETTINGS: DisplaySettings = {
  showEdges: false,
  showVertices: false,
};

function storageKeyFor(scope: DisplayScope): string {
  return scope === "mobile" ? MOBILE_DISPLAY_SETTINGS_KEY : DISPLAY_SETTINGS_KEY;
}

function defaultSettingsFor(scope: DisplayScope): DisplaySettings {
  return scope === "mobile" ? DEFAULT_MOBILE_DISPLAY_SETTINGS : DEFAULT_DISPLAY_SETTINGS;
}

function readDisplaySettings(scope: DisplayScope): DisplaySettings {
  const storageKey = storageKeyFor(scope);
  const stored = window.localStorage.getItem(storageKey);
  if (!stored) {
    return defaultSettingsFor(scope);
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
    window.localStorage.removeItem(storageKey);
  }
  return defaultSettingsFor(scope);
}

export function useDisplaySettings(mobileMode = false): [
  DisplaySettings,
  (layer: keyof DisplaySettings) => void,
] {
  const scope: DisplayScope = mobileMode ? "mobile" : "desktop";
  const [settingsByScope, setSettingsByScope] = useState<Record<DisplayScope, DisplaySettings>>(
    () => ({
      desktop: readDisplaySettings("desktop"),
      mobile: readDisplaySettings("mobile"),
    }),
  );
  const settings = settingsByScope[scope];

  useEffect(() => {
    window.localStorage.setItem(storageKeyFor(scope), JSON.stringify(settings));
  }, [scope, settings]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === DISPLAY_SETTINGS_KEY) {
        setSettingsByScope((current) => ({
          ...current,
          desktop: readDisplaySettings("desktop"),
        }));
      }
      if (event.key === MOBILE_DISPLAY_SETTINGS_KEY) {
        setSettingsByScope((current) => ({
          ...current,
          mobile: readDisplaySettings("mobile"),
        }));
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const toggleLayer = (layer: keyof DisplaySettings) => {
    setSettingsByScope((current) => ({
      ...current,
      [scope]: {
        ...current[scope],
        [layer]: !current[scope][layer],
      },
    }));
  };

  return [settings, toggleLayer];
}
