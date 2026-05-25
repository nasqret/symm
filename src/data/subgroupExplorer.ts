import type { CellDocument, LatticeType, PeriodicFace } from "../types";
import { applyOperation, normalizePoint } from "../math/lattice";
import { extractFaces, findFaceAtPoint } from "../math/periodicGraph";
import { computeSymmetry } from "../math/symmetry";
import { WALLPAPER_GROUPS, buildPresetDocument, operationClosure } from "./wallpaperGroups";

export interface ExplorerStage {
  symbol: string;
  description: string;
}

export interface ExplorerBranch {
  id: string;
  title: string;
  accent: string;
  glow: string;
  stages: ExplorerStage[];
}

export interface ExplorerGraphNode {
  symbol: string;
  x: number;
  y: number;
}

export interface ExplorerGraphEdge {
  branchId: string;
  from: string;
  to: string;
}

export interface ImmersiveStage {
  document: CellDocument;
  orbitCount: number;
  computedSymbol: string;
  enriched: boolean;
}

export const EXPLORER_BRANCHES: ExplorerBranch[] = [
  {
    id: "hexagonal",
    title: "Hexagonal descent",
    accent: "#ff4fa3",
    glow: "rgba(255, 79, 163, 0.62)",
    stages: [
      { symbol: "p6m", description: "six-fold rotations with mirrors" },
      { symbol: "p6", description: "rotations remain as mirrors disappear" },
      { symbol: "p3", description: "three-fold rotational subgroup" },
      { symbol: "p1", description: "translations alone" },
    ],
  },
  {
    id: "square",
    title: "Square descent",
    accent: "#00e6ff",
    glow: "rgba(0, 230, 255, 0.62)",
    stages: [
      { symbol: "p4m", description: "four-fold rotations with mirrors" },
      { symbol: "p4", description: "four-fold rotational subgroup" },
      { symbol: "p2", description: "half-turn subgroup" },
      { symbol: "p1", description: "translations alone" },
    ],
  },
  {
    id: "rectangular",
    title: "Rectangular descent",
    accent: "#ffb400",
    glow: "rgba(255, 180, 0, 0.62)",
    stages: [
      { symbol: "cmm", description: "centered mirrors and half-turns" },
      { symbol: "pmm", description: "primitive perpendicular mirrors" },
      { symbol: "pm", description: "one mirror family remains" },
      { symbol: "p1", description: "translations alone" },
    ],
  },
];

export const EXPLORER_GRAPH_NODES: ExplorerGraphNode[] = [
  { symbol: "p6m", x: 18, y: 10 },
  { symbol: "p6", x: 18, y: 34 },
  { symbol: "p3", x: 18, y: 58 },
  { symbol: "p4m", x: 50, y: 10 },
  { symbol: "p4", x: 50, y: 34 },
  { symbol: "p2", x: 50, y: 58 },
  { symbol: "cmm", x: 82, y: 10 },
  { symbol: "pmm", x: 82, y: 34 },
  { symbol: "pm", x: 82, y: 58 },
  { symbol: "p1", x: 50, y: 88 },
];

export const EXPLORER_GRAPH_EDGES: ExplorerGraphEdge[] = EXPLORER_BRANCHES.flatMap((branch) =>
  branch.stages.slice(1).map((stage, index) => ({
    branchId: branch.id,
    from: branch.stages[index].symbol,
    to: stage.symbol,
  })),
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

export function buildImmersiveStage(symbol: string): ImmersiveStage {
  const cached = IMMERSIVE_STAGE_CACHE.get(symbol);
  if (cached) {
    return cached;
  }
  const source = buildPresetDocument(symbol);
  const group = WALLPAPER_GROUPS.find((entry) => entry.symbol === symbol);
  if (!group) {
    const stage = {
      document: source,
      orbitCount: 0,
      computedSymbol: computeSymmetry(source).symbol,
      enriched: false,
    };
    IMMERSIVE_STAGE_CACHE.set(symbol, stage);
    return stage;
  }

  const faces = extractFaces(source);
  const assigned = new Map<string, string>();
  const operations = operationClosure(group.operations);
  let orbitCount = 0;

  for (const face of faces) {
    if (!assigned.has(face.signature)) {
      assignOrbit(
        face,
        faces,
        operations,
        chromaticColor(orbitCount, source.lattice.type),
        assigned,
      );
      orbitCount += 1;
    }
  }

  const candidate: CellDocument = {
    ...source,
    name: `${symbol} chromatic field`,
    faceColors: [...assigned].map(([signature, color]) => ({ signature, color })),
  };
  const computedSymbol = computeSymmetry(candidate).symbol;
  if (computedSymbol !== symbol) {
    const stage = {
      document: source,
      orbitCount: 0,
      computedSymbol: computeSymmetry(source).symbol,
      enriched: false,
    };
    IMMERSIVE_STAGE_CACHE.set(symbol, stage);
    return stage;
  }

  const stage = {
    document: candidate,
    orbitCount,
    computedSymbol,
    enriched: true,
  };
  IMMERSIVE_STAGE_CACHE.set(symbol, stage);
  return stage;
}
