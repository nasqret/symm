export type LatticeType = "generic" | "rectangular" | "square" | "hexagonal";

export type EditorTool = "select" | "vertex" | "edge" | "color";

export interface FractionalPoint {
  u: number;
  v: number;
}

export interface TileOffset {
  u: number;
  v: number;
}

export interface Lattice {
  type: LatticeType;
  a: number;
  b: number;
  angle: number;
}

export interface MotifVertex extends FractionalPoint {
  id: string;
}

export interface PeriodicEdge {
  id: string;
  from: string;
  to: string;
  shift: TileOffset;
}

export interface FaceColor {
  signature: string;
  color: string;
}

export interface CellDocument {
  schemaVersion: 1;
  name: string;
  lattice: Lattice;
  vertices: MotifVertex[];
  edges: PeriodicEdge[];
  faceColors: FaceColor[];
  presetGroup?: string;
  modifiedAt: string;
}

export interface LiftedVertex {
  key: string;
  vertexId: string;
  tile: TileOffset;
  point: FractionalPoint;
}

export interface PeriodicFace {
  signature: string;
  points: FractionalPoint[];
  holes: FractionalPoint[][];
  centroid: FractionalPoint;
  samplePoint: FractionalPoint;
  area: number;
}

export interface Matrix2 {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface AffineOperation {
  matrix: Matrix2;
  shift: FractionalPoint;
  label?: string;
}

export type SymmetryElementKind =
  | "translation"
  | "centering"
  | "rotation"
  | "mirror"
  | "glide";

export interface SymmetryElement {
  id: string;
  label: string;
  kind: SymmetryElementKind;
  operation?: AffineOperation;
  vector?: FractionalPoint;
}

export interface WallpaperGroup {
  number: number;
  symbol: string;
  standardSymbol: string;
  latticeType: LatticeType;
  crystalClass: string;
  operations: AffineOperation[];
  feature: string;
  generators: string[];
}

export interface SymmetryResult {
  symbol: string;
  standardSymbol: string;
  generators: string[];
  elements: SymmetryElement[];
  accepted: AffineOperation[];
  rejectedCount: number;
  additionalTranslations: AffineOperation[];
}
