import type { CellDocument, FractionalPoint, LatticeType, PeriodicFace } from "../types";
import { applyOperation, normalizePoint } from "../math/lattice";
import { extractFaces, findFaceAtPoint } from "../math/periodicGraph";
import { computeSymmetry } from "../math/symmetry";
import { WALLPAPER_GROUPS, buildBlankDocument, operationClosure } from "./wallpaperGroups";

export interface ExplorerFamily {
  id: LatticeType;
  title: string;
  accent: string;
}

export interface ExplorerGraphNode {
  symbol: string;
  label: string;
  x: number;
  y: number;
}

export interface ExplorerGraphEdge {
  from: string;
  to: string;
}

export interface ExplorerWalkStep {
  symbol: string;
  family: LatticeType;
  chapter: string;
  narrative: string;
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
    accent: "#d66853",
  },
  {
    id: "square",
    title: "Square lattice",
    accent: "#1f7185",
  },
  {
    id: "rectangular",
    title: "Rectangular lattice",
    accent: "#c68e2d",
  },
  {
    id: "generic",
    title: "Generic lattice",
    accent: "#557d76",
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
  { symbol: "p1", label: "p1", x: 50, y: 5 },
  { symbol: "p2", label: "p2", x: 21, y: 18 },
  { symbol: "pg", label: "p1g1", x: 51, y: 18 },
  { symbol: "p3", label: "p3", x: 84, y: 19 },
  { symbol: "p4", label: "p4", x: 9, y: 38 },
  { symbol: "pgg", label: "p2gg", x: 26, y: 38 },
  { symbol: "pm", label: "p1m1", x: 46, y: 31 },
  { symbol: "cm", label: "c1m1", x: 61, y: 31 },
  { symbol: "pmg", label: "p2mg", x: 39, y: 53 },
  { symbol: "p3m1", label: "p3m1", x: 69, y: 53 },
  { symbol: "p31m", label: "p31m", x: 84, y: 53 },
  { symbol: "pmm", label: "p2mm", x: 14, y: 70 },
  { symbol: "cmm", label: "c2mm", x: 35, y: 70 },
  { symbol: "p6", label: "p6", x: 94, y: 77 },
  { symbol: "p4g", label: "p4gm", x: 11, y: 85 },
  { symbol: "p4m", label: "p4mm", x: 7, y: 96 },
  { symbol: "p6m", label: "p6mm", x: 72, y: 96 },
];

// The visual hierarchy follows the supplied standard-symbol reference sheet. Connections
// indicate represented subgroup paths; finite-index same-type copies remain suppressed.
export const EXPLORER_GRAPH_EDGES: ExplorerGraphEdge[] = [
  { from: "p1", to: "p2" },
  { from: "p1", to: "pg" },
  { from: "p1", to: "p3" },
  { from: "p2", to: "p4" },
  { from: "p2", to: "pgg" },
  { from: "p2", to: "pmg" },
  { from: "pg", to: "pgg" },
  { from: "pg", to: "pm" },
  { from: "pg", to: "cm" },
  { from: "pm", to: "cm" },
  { from: "pm", to: "pmg" },
  { from: "pm", to: "p3m1" },
  { from: "pm", to: "p31m" },
  { from: "cm", to: "pmg" },
  { from: "cm", to: "p3m1" },
  { from: "cm", to: "p31m" },
  { from: "p3", to: "p3m1" },
  { from: "p3", to: "p31m" },
  { from: "p3", to: "p6" },
  { from: "p4", to: "p4g" },
  { from: "p4", to: "p4m" },
  { from: "pgg", to: "pmg" },
  { from: "pgg", to: "p4g" },
  { from: "pmg", to: "pmm" },
  { from: "pmg", to: "cmm" },
  { from: "pmm", to: "cmm" },
  { from: "pmm", to: "p4g" },
  { from: "pmm", to: "p4m" },
  { from: "cmm", to: "p4g" },
  { from: "cmm", to: "p4m" },
  { from: "p4g", to: "p4m" },
  { from: "p3m1", to: "p6m" },
  { from: "p31m", to: "p6m" },
  { from: "p6", to: "p6m" },
  { from: "pmm", to: "p6m" },
  { from: "cmm", to: "p6m" },
];

export const FEATURED_WALK: ExplorerWalkStep[] = [
  {
    symbol: "p6m",
    family: "hexagonal",
    chapter: "Hexagonal descent",
    narrative: "Begin at p6mm: six-fold rotations and mirrors lock the color field.",
  },
  {
    symbol: "p6",
    family: "hexagonal",
    chapter: "Hexagonal descent",
    narrative: "Mirrors dissolve while the six-fold rotational lattice stays fixed.",
  },
  {
    symbol: "p3",
    family: "hexagonal",
    chapter: "Hexagonal descent",
    narrative: "A color shift leaves only the three-fold rotational subgroup.",
  },
  {
    symbol: "p1",
    family: "hexagonal",
    chapter: "Hexagonal descent",
    narrative: "At p1, coloring is unconstrained and the hexagonal cell is still visible.",
  },
  {
    symbol: "p1",
    family: "square",
    chapter: "Lattice homotopy",
    narrative: "Within p1, edges contract and regrow as the lattice becomes square.",
  },
  {
    symbol: "p2",
    family: "square",
    chapter: "Four-fold ascent",
    narrative: "Half-turn relations appear by smooth recoloring on the square mesh.",
  },
  {
    symbol: "p4",
    family: "square",
    chapter: "Four-fold ascent",
    narrative: "Quarter-turn color orbits establish the p4 branch.",
  },
  {
    symbol: "p4m",
    family: "square",
    chapter: "Four-fold ascent",
    narrative: "The path arrives at p4mm with four-fold mirrors fully restored.",
  },
  {
    symbol: "p4g",
    family: "square",
    chapter: "Alternate descent",
    narrative: "The return follows the alternate p4gm branch while the square lattice remains.",
  },
  {
    symbol: "p4",
    family: "square",
    chapter: "Alternate descent",
    narrative: "Glide-reflection constraints fade, returning to four-fold rotation.",
  },
  {
    symbol: "p2",
    family: "square",
    chapter: "Alternate descent",
    narrative: "Only half-turn symmetry remains before complete color freedom.",
  },
  {
    symbol: "p1",
    family: "square",
    chapter: "Alternate descent",
    narrative: "The walk closes at p1, ready for another route through the hierarchy.",
  },
];

interface ExplorerDecorationSeed {
  point: FractionalPoint;
  color: string;
}

const ACCENT_COLOR = "#d66853";
const SECONDARY_ACCENT_COLOR = "#1f7185";
const FIELD_COLOR = "#fbf9f2";
const HEXAGONAL_SEED = { u: 4 / 15, v: 1 / 15 };
const SQUARE_SEED = { u: 1 / 4, v: 1 / 8 };

// These sparse witnesses are verified by computeSymmetry below. A stage paints only
// enough nonempty complete target-group orbits to remain visible and prevent
// classification as a larger group.
const EXPLORER_DECORATIONS: Record<LatticeType, Record<string, ExplorerDecorationSeed[]>> = {
  generic: {
    p2: [{ point: { u: 1 / 8, v: 0 }, color: ACCENT_COLOR }],
    p1: [
      { point: { u: 1 / 8, v: 0 }, color: ACCENT_COLOR },
      { point: { u: 3 / 8, v: 0 }, color: SECONDARY_ACCENT_COLOR },
    ],
  },
  rectangular: {
    cmm: [{ point: { u: 1 / 8, v: 0 }, color: ACCENT_COLOR }],
    pmm: [{ point: { u: 1 / 8, v: 0 }, color: ACCENT_COLOR }],
    pmg: [{ point: { u: 1 / 8, v: 0 }, color: ACCENT_COLOR }],
    pgg: [
      { point: { u: 1 / 8, v: 0 }, color: ACCENT_COLOR },
      { point: { u: 0, v: 1 / 8 }, color: SECONDARY_ACCENT_COLOR },
    ],
    cm: [
      { point: { u: 1 / 8, v: 0 }, color: ACCENT_COLOR },
      { point: { u: 3 / 8, v: 0 }, color: SECONDARY_ACCENT_COLOR },
    ],
    pm: [
      { point: { u: 1 / 8, v: 0 }, color: ACCENT_COLOR },
      { point: { u: 3 / 8, v: 0 }, color: SECONDARY_ACCENT_COLOR },
    ],
    pg: [
      { point: { u: 1 / 8, v: 0 }, color: ACCENT_COLOR },
      { point: { u: 0, v: 1 / 8 }, color: SECONDARY_ACCENT_COLOR },
    ],
    p2: [
      { point: { u: 1 / 8, v: 0 }, color: ACCENT_COLOR },
      { point: SQUARE_SEED, color: SECONDARY_ACCENT_COLOR },
    ],
    p1: [
      { point: { u: 1 / 8, v: 0 }, color: ACCENT_COLOR },
      { point: { u: 0, v: 1 / 8 }, color: SECONDARY_ACCENT_COLOR },
    ],
  },
  square: {
    p4m: [{ point: { u: 1 / 8, v: 0 }, color: ACCENT_COLOR }],
    p4g: [{ point: SQUARE_SEED, color: ACCENT_COLOR }],
    p4: [{ point: SQUARE_SEED, color: ACCENT_COLOR }],
    p2: [{ point: SQUARE_SEED, color: ACCENT_COLOR }],
    p1: [
      { point: SQUARE_SEED, color: ACCENT_COLOR },
      { point: { u: 1 / 8, v: 0 }, color: SECONDARY_ACCENT_COLOR },
    ],
  },
  hexagonal: {
    p6m: [{ point: { u: 1 / 3, v: 1 / 3 }, color: ACCENT_COLOR }],
    p6: [{ point: HEXAGONAL_SEED, color: ACCENT_COLOR }],
    p3m1: [{ point: HEXAGONAL_SEED, color: ACCENT_COLOR }],
    p31m: [{ point: HEXAGONAL_SEED, color: ACCENT_COLOR }],
    p3: [{ point: HEXAGONAL_SEED, color: ACCENT_COLOR }],
    p2: [{ point: HEXAGONAL_SEED, color: ACCENT_COLOR }],
    p1: [
      { point: HEXAGONAL_SEED, color: ACCENT_COLOR },
      { point: { u: 1 / 15, v: 1 / 15 }, color: SECONDARY_ACCENT_COLOR },
    ],
  },
};

const IMMERSIVE_STAGE_CACHE = new Map<string, ImmersiveStage>();

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
  const assigned = new Map(faces.map((face) => [face.signature, FIELD_COLOR]));
  const operations = operationClosure(group.operations);
  const decorations = EXPLORER_DECORATIONS[family][symbol];
  if (!decorations) {
    throw new Error(`Missing explorer witness definition for ${family}:${symbol}`);
  }
  for (const decoration of decorations) {
    const face = findFaceAtPoint(faces, decoration.point);
    if (!face) {
      throw new Error(`Missing explorer witness face for ${family}:${symbol}`);
    }
    assignOrbit(face, faces, operations, decoration.color, assigned);
  }

  const document: CellDocument = {
    ...source,
    name: `${symbol} minimal witness field on ${family} lattice`,
    presetGroup: symbol,
    faceColors: [...assigned].map(([signature, color]) => ({ signature, color })),
  };
  const computedSymbol = computeSymmetry(document).symbol;
  if (computedSymbol !== symbol) {
    throw new Error(
      `Explorer witness for ${family}:${symbol} classified as ${computedSymbol}`,
    );
  }
  const stage = {
    document,
    orbitCount: decorations.length,
    computedSymbol,
    enriched: true,
  };
  IMMERSIVE_STAGE_CACHE.set(cacheKey, stage);
  return stage;
}
