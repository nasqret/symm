import type { CellDocument, LatticeType, PeriodicFace } from "../types";
import { applyOperation, normalizePoint } from "../math/lattice";
import { extractFaces, findFaceAtPoint } from "../math/periodicGraph";
import { computeSymmetry } from "../math/symmetry";
import { WALLPAPER_GROUPS, buildBlankDocument, operationClosure } from "./wallpaperGroups";

export interface ExplorerFamily {
  id: LatticeType;
  title: string;
  accent: string;
  glow: string;
  tour: string[];
}

export interface ExplorerGraphNode {
  symbol: string;
  x: number;
  y: number;
}

export interface ExplorerGraphEdge {
  from: string;
  to: string;
  index: number;
}

export interface ImmersiveStage {
  document: CellDocument;
  orbitCount: number;
  computedSymbol: string;
  enriched: boolean;
}

export const EXPLORER_FAMILIES: ExplorerFamily[] = [
  {
    id: "hexagonal",
    title: "Hexagonal lattice",
    accent: "#ff4fa3",
    glow: "rgba(255, 79, 163, 0.62)",
    tour: ["p6m", "p6", "p3", "p1"],
  },
  {
    id: "square",
    title: "Square lattice",
    accent: "#00e6ff",
    glow: "rgba(0, 230, 255, 0.62)",
    tour: ["p4m", "p4", "p2", "p1"],
  },
  {
    id: "rectangular",
    title: "Rectangular lattice",
    accent: "#ffb400",
    glow: "rgba(255, 180, 0, 0.62)",
    tour: ["cmm", "pmm", "pm", "p1"],
  },
  {
    id: "generic",
    title: "Generic lattice",
    accent: "#9d80ff",
    glow: "rgba(157, 128, 255, 0.62)",
    tour: ["p2", "p1"],
  },
];

const FAMILY_SYMBOLS: Record<LatticeType, string[]> = {
  generic: ["p2", "p1"],
  rectangular: ["cmm", "pmm", "pmg", "pgg", "cm", "pm", "pg", "p2", "p1"],
  square: ["p4m", "p4g", "p4", "p2", "p1"],
  hexagonal: ["p6m", "p6", "p3m1", "p31m", "p3", "p2", "p1"],
};

export function supportsFamilySymbol(family: LatticeType, symbol: string): boolean {
  return FAMILY_SYMBOLS[family].includes(symbol);
}

export function primaryFamilyForSymbol(symbol: string): LatticeType {
  return WALLPAPER_GROUPS.find((group) => group.symbol === symbol)?.latticeType ?? "generic";
}

export const EXPLORER_GRAPH_NODES: ExplorerGraphNode[] = [
  { symbol: "p6m", x: 10, y: 9 },
  { symbol: "p4m", x: 38, y: 9 },
  { symbol: "p4g", x: 55, y: 9 },
  { symbol: "cmm", x: 82, y: 9 },
  { symbol: "p6", x: 6, y: 29 },
  { symbol: "p3m1", x: 18, y: 29 },
  { symbol: "p31m", x: 29, y: 29 },
  { symbol: "p4", x: 46, y: 29 },
  { symbol: "pmm", x: 63, y: 29 },
  { symbol: "pmg", x: 77, y: 29 },
  { symbol: "pgg", x: 91, y: 29 },
  { symbol: "p3", x: 18, y: 51 },
  { symbol: "cm", x: 61, y: 51 },
  { symbol: "pm", x: 76, y: 51 },
  { symbol: "pg", x: 91, y: 51 },
  { symbol: "p2", x: 43, y: 67 },
  { symbol: "p1", x: 50, y: 91 },
];

// Type-level subgroup indices from the standard 17 wallpaper-group relation table.
// Self-type finite-index subgroups are omitted from this visualization.
const TYPE_RELATIONS: Record<string, Array<[string, number]>> = {
  p2: [["p1", 2]],
  pg: [["p1", 2]],
  pm: [["p1", 2], ["pg", 2], ["cm", 2]],
  cm: [["p1", 2], ["pg", 2], ["pm", 2]],
  pgg: [["p1", 4], ["p2", 2], ["pg", 2]],
  pmg: [["p1", 4], ["p2", 2], ["pg", 2], ["pm", 2], ["cm", 4], ["pgg", 2]],
  pmm: [
    ["p1", 4],
    ["p2", 2],
    ["pg", 4],
    ["pm", 2],
    ["cm", 4],
    ["pgg", 4],
    ["pmg", 2],
    ["cmm", 2],
  ],
  cmm: [
    ["p1", 4],
    ["p2", 2],
    ["pg", 4],
    ["pm", 4],
    ["cm", 2],
    ["pgg", 2],
    ["pmg", 2],
    ["pmm", 2],
  ],
  p4: [["p1", 4], ["p2", 2]],
  p4g: [
    ["p1", 8],
    ["p2", 4],
    ["pg", 4],
    ["pm", 8],
    ["cm", 4],
    ["pgg", 2],
    ["pmg", 4],
    ["pmm", 4],
    ["cmm", 2],
    ["p4", 2],
  ],
  p4m: [
    ["p1", 8],
    ["p2", 4],
    ["pg", 8],
    ["pm", 4],
    ["cm", 4],
    ["pgg", 4],
    ["pmg", 4],
    ["pmm", 2],
    ["cmm", 2],
    ["p4", 2],
    ["p4g", 2],
  ],
  p3: [["p1", 3]],
  p3m1: [["p1", 6], ["pg", 6], ["pm", 6], ["cm", 3], ["p3", 2], ["p31m", 3]],
  p31m: [["p1", 6], ["pg", 6], ["pm", 6], ["cm", 3], ["p3", 2], ["p3m1", 3]],
  p6: [["p1", 6], ["p2", 3], ["p3", 2]],
  p6m: [
    ["p1", 12],
    ["p2", 6],
    ["pg", 12],
    ["pm", 12],
    ["cm", 6],
    ["pgg", 6],
    ["pmg", 6],
    ["pmm", 6],
    ["cmm", 3],
    ["p3", 4],
    ["p3m1", 2],
    ["p31m", 2],
    ["p6", 2],
  ],
};

export const EXPLORER_GRAPH_EDGES: ExplorerGraphEdge[] = Object.entries(TYPE_RELATIONS).flatMap(
  ([from, relations]) => relations.map(([to, index]) => ({ from, to, index })),
);

const HUE_ORIGINS: Record<LatticeType, number> = {
  generic: 302,
  rectangular: 22,
  square: 188,
  hexagonal: 324,
};

const IMMERSIVE_STAGE_CACHE = new Map<string, ImmersiveStage>();

function chromaticColor(index: number, latticeType: LatticeType): string {
  const hue = (HUE_ORIGINS[latticeType] + index * 137.508) % 360;
  const saturation = 92 + (index % 3) * 3;
  const lightness = [56, 48, 64, 52][index % 4];
  return `hsl(${hue.toFixed(1)}, ${saturation}%, ${lightness}%)`;
}

function assignOrbit(
  source: PeriodicFace,
  faces: PeriodicFace[],
  operations: ReturnType<typeof operationClosure>,
  color: string,
  assigned: Map<string, string>,
): void {
  assigned.set(source.signature, color);
  for (const operation of operations) {
    const target = findFaceAtPoint(
      faces,
      normalizePoint(applyOperation(operation, source.samplePoint)),
    );
    if (target) {
      assigned.set(target.signature, color);
    }
  }
}

export function buildImmersiveStage(symbol: string, family: LatticeType): ImmersiveStage {
  const cacheKey = `${family}:${symbol}`;
  const cached = IMMERSIVE_STAGE_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }
  if (!supportsFamilySymbol(family, symbol)) {
    throw new Error(`${symbol} cannot be represented on the ${family} explorer lattice`);
  }
  const group = WALLPAPER_GROUPS.find((entry) => entry.symbol === symbol);
  const source = buildBlankDocument(family);
  if (!group) {
    const stage = {
      document: source,
      orbitCount: 0,
      computedSymbol: computeSymmetry(source).symbol,
      enriched: false,
    };
    IMMERSIVE_STAGE_CACHE.set(cacheKey, stage);
    return stage;
  }

  const faces = extractFaces(source);
  const assigned = new Map<string, string>();
  const operations = operationClosure(group.operations);
  let orbitCount = 0;

  for (const face of faces) {
    if (!assigned.has(face.signature)) {
      assignOrbit(face, faces, operations, chromaticColor(orbitCount, family), assigned);
      orbitCount += 1;
    }
  }

  const document: CellDocument = {
    ...source,
    name: `${symbol} chromatic field on ${family} lattice`,
    presetGroup: symbol,
    faceColors: [...assigned].map(([signature, color]) => ({ signature, color })),
  };
  const computedSymbol = computeSymmetry(document).symbol;
  const stage = {
    document,
    orbitCount,
    computedSymbol,
    enriched: computedSymbol === symbol,
  };
  IMMERSIVE_STAGE_CACHE.set(cacheKey, stage);
  return stage;
}
