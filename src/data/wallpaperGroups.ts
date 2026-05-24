import type {
  AffineOperation,
  CellDocument,
  FractionalPoint,
  LatticeType,
  MotifVertex,
  PeriodicEdge,
  WallpaperGroup,
} from "../types";
import { extractFaces, findFaceAtPoint, canonicalEdgeKey } from "../math/periodicGraph";
import {
  IDENTITY,
  LATTICES,
  applyOperation,
  composeOperations,
  mod1,
  normalizePoint,
  operationKey,
  splitPoint,
} from "../math/lattice";

const operation = (
  a: number,
  b: number,
  c: number,
  d: number,
  u = 0,
  v = 0,
  label?: string,
): AffineOperation => ({
  matrix: { a, b, c, d },
  shift: { u, v },
  label,
});

const c2 = operation(-1, 0, 0, -1, 0, 0, "half-turn");
const mx = operation(1, 0, 0, -1, 0, 0, "horizontal mirror");
const my = operation(-1, 0, 0, 1, 0, 0, "vertical mirror");
const gx = operation(1, 0, 0, -1, 0.5, 0, "horizontal glide");
const gy = operation(-1, 0, 0, 1, 0, 0.5, "vertical glide");
const center = operation(1, 0, 0, 1, 0.5, 0.5, "centering translation");
const c4 = operation(0, -1, 1, 0, 0, 0, "quarter-turn");
const diagonalShiftMirror = operation(0, 1, 1, 0, 0.5, 0.5, "shifted diagonal mirror");
const c3 = operation(-1, -1, 1, 0, 0, 0, "third-turn");
const c6 = operation(0, -1, 1, 1, 0, 0, "sixth-turn");
const hexMirrorA = operation(0, 1, 1, 0, 0, 0, "mirror family A");
const hexMirrorB = operation(1, 1, 0, -1, 0, 0, "mirror family B");

export const WALLPAPER_GROUPS: WallpaperGroup[] = [
  {
    number: 1,
    symbol: "p1",
    standardSymbol: "p1",
    latticeType: "generic",
    crystalClass: "1",
    operations: [],
    feature: "Translations only; no required point symmetry.",
    generators: ["T(a)", "T(b)"],
  },
  {
    number: 2,
    symbol: "p2",
    standardSymbol: "p2",
    latticeType: "generic",
    crystalClass: "2",
    operations: [c2],
    feature: "Two-fold rotation centers without mirrors.",
    generators: ["T(a)", "T(b)", "C2"],
  },
  {
    number: 3,
    symbol: "pm",
    standardSymbol: "p1m1",
    latticeType: "rectangular",
    crystalClass: "m",
    operations: [mx],
    feature: "Parallel mirror lines.",
    generators: ["T(a)", "T(b)", "m"],
  },
  {
    number: 4,
    symbol: "pg",
    standardSymbol: "p1g1",
    latticeType: "rectangular",
    crystalClass: "m",
    operations: [gx],
    feature: "Parallel glide-reflection axes without mirrors.",
    generators: ["T(a)", "T(b)", "g"],
  },
  {
    number: 5,
    symbol: "cm",
    standardSymbol: "c1m1",
    latticeType: "rectangular",
    crystalClass: "m",
    operations: [mx, center],
    feature: "Centered rectangular mirror arrangement.",
    generators: ["T(a)", "T(b)", "m", "centering"],
  },
  {
    number: 6,
    symbol: "pmm",
    standardSymbol: "p2mm",
    latticeType: "rectangular",
    crystalClass: "2mm",
    operations: [mx, my],
    feature: "Perpendicular mirrors and two-fold centers.",
    generators: ["T(a)", "T(b)", "m(x)", "m(y)"],
  },
  {
    number: 7,
    symbol: "pmg",
    standardSymbol: "p2mg",
    latticeType: "rectangular",
    crystalClass: "2mm",
    operations: [mx, gy],
    feature: "Mirror lines in one direction and glides in the other.",
    generators: ["T(a)", "T(b)", "m", "g"],
  },
  {
    number: 8,
    symbol: "pgg",
    standardSymbol: "p2gg",
    latticeType: "rectangular",
    crystalClass: "2mm",
    operations: [gx, gy],
    feature: "Two directions of glide axes with two-fold centers.",
    generators: ["T(a)", "T(b)", "g(x)", "g(y)"],
  },
  {
    number: 9,
    symbol: "cmm",
    standardSymbol: "c2mm",
    latticeType: "rectangular",
    crystalClass: "2mm",
    operations: [mx, my, center],
    feature: "Centered rectangular lattice with perpendicular mirrors.",
    generators: ["T(a)", "T(b)", "m(x)", "m(y)", "centering"],
  },
  {
    number: 10,
    symbol: "p4",
    standardSymbol: "p4",
    latticeType: "square",
    crystalClass: "4",
    operations: [c4],
    feature: "Four-fold rotation centers without mirrors.",
    generators: ["T(a)", "T(b)", "C4"],
  },
  {
    number: 11,
    symbol: "p4m",
    standardSymbol: "p4mm",
    latticeType: "square",
    crystalClass: "4mm",
    operations: [c4, mx],
    feature: "Four-fold centers with axial and diagonal mirrors.",
    generators: ["T(a)", "T(b)", "C4", "m"],
  },
  {
    number: 12,
    symbol: "p4g",
    standardSymbol: "p4gm",
    latticeType: "square",
    crystalClass: "4mm",
    operations: [c4, diagonalShiftMirror],
    feature: "Four-fold centers with shifted reflection/glide arrangement.",
    generators: ["T(a)", "T(b)", "C4", "g/m"],
  },
  {
    number: 13,
    symbol: "p3",
    standardSymbol: "p3",
    latticeType: "hexagonal",
    crystalClass: "3",
    operations: [c3],
    feature: "Three-fold rotations on a hexagonal lattice.",
    generators: ["T(a)", "T(b)", "C3"],
  },
  {
    number: 14,
    symbol: "p3m1",
    standardSymbol: "p3m1",
    latticeType: "hexagonal",
    crystalClass: "3m",
    operations: [c3, hexMirrorA],
    feature: "Three-fold centers lying on mirror intersections.",
    generators: ["T(a)", "T(b)", "C3", "m(A)"],
  },
  {
    number: 15,
    symbol: "p31m",
    standardSymbol: "p31m",
    latticeType: "hexagonal",
    crystalClass: "3m",
    operations: [c3, hexMirrorB],
    feature: "Three-fold centers with the alternate mirror arrangement.",
    generators: ["T(a)", "T(b)", "C3", "m(B)"],
  },
  {
    number: 16,
    symbol: "p6",
    standardSymbol: "p6",
    latticeType: "hexagonal",
    crystalClass: "6",
    operations: [c6],
    feature: "Six-fold and three-fold rotations without mirrors.",
    generators: ["T(a)", "T(b)", "C6"],
  },
  {
    number: 17,
    symbol: "p6m",
    standardSymbol: "p6mm",
    latticeType: "hexagonal",
    crystalClass: "6mm",
    operations: [c6, hexMirrorA],
    feature: "Six-fold rotations combined with mirror lines.",
    generators: ["T(a)", "T(b)", "C6", "m"],
  },
];

const PRESET_COLORS = [
  "#d66853",
  "#1f7185",
  "#e0ab45",
  "#547a6b",
  "#8c6c93",
  "#ca8f72",
  "#4d88a5",
  "#c59c42",
  "#90624f",
  "#6d877a",
  "#b66f82",
  "#5872a0",
  "#df9260",
  "#708b42",
  "#936aa7",
  "#3f817e",
  "#c96b41",
  "#447492",
  "#b48b36",
  "#626f68",
];

function keyForCoordinate(value: number): string {
  return String(Math.round(mod1(value) * 10000)).padStart(4, "0");
}

function buildMesh(latticeType: LatticeType): {
  vertices: MotifVertex[];
  edges: PeriodicEdge[];
} {
  const vertices = new Map<string, MotifVertex>();
  const edges = new Map<string, PeriodicEdge>();
  const ensureVertex = (point: FractionalPoint): { id: string; tile: { u: number; v: number } } => {
    const canonical = splitPoint(point);
    const id = `v_${keyForCoordinate(canonical.point.u)}_${keyForCoordinate(canonical.point.v)}`;
    if (!vertices.has(id)) {
      vertices.set(id, { id, ...canonical.point });
    }
    return { id, tile: canonical.tile };
  };
  const addSegment = (fromPoint: FractionalPoint, toPoint: FractionalPoint): void => {
    const from = ensureVertex(fromPoint);
    const to = ensureVertex(toPoint);
    const entry = {
      from: from.id,
      to: to.id,
      shift: { u: to.tile.u - from.tile.u, v: to.tile.v - from.tile.v },
    };
    const key = canonicalEdgeKey(entry);
    if (!edges.has(key)) {
      edges.set(key, { id: `e_${edges.size + 1}`, ...entry });
    }
  };

  if (latticeType === "hexagonal") {
    const divisions = 5;
    for (let u = 0; u < divisions; u += 1) {
      for (let v = 0; v < divisions; v += 1) {
        const origin = { u: u / divisions, v: v / divisions };
        const east = { u: (u + 1) / divisions, v: v / divisions };
        const north = { u: u / divisions, v: (v + 1) / divisions };
        const diagonal = { u: (u + 1) / divisions, v: (v + 1) / divisions };
        addSegment(origin, east);
        addSegment(origin, north);
        addSegment(east, north);
        addSegment(east, diagonal);
        addSegment(north, diagonal);
      }
    }
  } else {
    const divisions = 4;
    for (let u = 0; u < divisions; u += 1) {
      for (let v = 0; v < divisions; v += 1) {
        const cornerA = { u: u / divisions, v: v / divisions };
        const cornerB = { u: (u + 1) / divisions, v: v / divisions };
        const cornerC = { u: (u + 1) / divisions, v: (v + 1) / divisions };
        const cornerD = { u: u / divisions, v: (v + 1) / divisions };
        const centerPoint = { u: (u + 0.5) / divisions, v: (v + 0.5) / divisions };
        addSegment(cornerA, centerPoint);
        addSegment(cornerB, centerPoint);
        addSegment(cornerC, centerPoint);
        addSegment(cornerD, centerPoint);
      }
    }
  }
  return { vertices: [...vertices.values()], edges: [...edges.values()] };
}

function operationClosure(generators: AffineOperation[]): AffineOperation[] {
  const identity: AffineOperation = { matrix: IDENTITY, shift: { u: 0, v: 0 } };
  const operations = new Map([[operationKey(identity), identity]]);
  let changed = true;
  while (changed && operations.size < 48) {
    changed = false;
    for (const left of [...operations.values()]) {
      for (const right of generators) {
        const composed = composeOperations(left, right);
        const key = operationKey(composed);
        if (!operations.has(key)) {
          operations.set(key, composed);
          changed = true;
        }
      }
    }
  }
  return [...operations.values()];
}

export function buildPresetDocument(symbol: string): CellDocument {
  const group = WALLPAPER_GROUPS.find((entry) => entry.symbol === symbol) ?? WALLPAPER_GROUPS[0];
  const mesh = buildMesh(group.latticeType);
  const base: CellDocument = {
    schemaVersion: 1,
    name: `${group.symbol} generating motif`,
    lattice: { ...LATTICES[group.latticeType] },
    vertices: mesh.vertices,
    edges: mesh.edges,
    faceColors: [],
    presetGroup: group.symbol,
    modifiedAt: new Date().toISOString(),
  };
  const faces = extractFaces(base);
  const closure = operationClosure(group.operations);
  const assigned = new Map<string, string>();
  let colorIndex = 0;
  for (const face of faces) {
    if (assigned.has(face.signature)) {
      continue;
    }
    const color =
      PRESET_COLORS[colorIndex] ??
      `hsl(${Math.round((colorIndex * 137.508 + 19) % 360)} ${48 + (colorIndex % 4) * 5}% ${
        58 + (colorIndex % 3) * 5
      }%)`;
    colorIndex += 1;
    assigned.set(face.signature, color);
    for (const symmetry of closure) {
      const target = findFaceAtPoint(faces, normalizePoint(applyOperation(symmetry, face.centroid)));
      if (target) {
        assigned.set(target.signature, color);
      }
    }
  }
  return {
    ...base,
    faceColors: [...assigned.entries()].map(([signature, color]) => ({ signature, color })),
  };
}

export function buildBlankDocument(latticeType: LatticeType): CellDocument {
  const mesh = buildMesh(latticeType);
  return {
    schemaVersion: 1,
    name: `${latticeType} working cell`,
    lattice: { ...LATTICES[latticeType] },
    vertices: mesh.vertices,
    edges: mesh.edges,
    faceColors: [],
    modifiedAt: new Date().toISOString(),
  };
}

export function lookupGroup(symbol: string): WallpaperGroup | undefined {
  return WALLPAPER_GROUPS.find((group) => group.symbol === symbol);
}
