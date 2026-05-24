import type {
  AffineOperation,
  FractionalPoint,
  Lattice,
  LatticeType,
  Matrix2,
  TileOffset,
} from "../types";

export const EPSILON = 1e-6;

export const LATTICES: Record<LatticeType, Lattice> = {
  generic: { type: "generic", a: 1, b: 0.86, angle: 68 },
  rectangular: { type: "rectangular", a: 1.18, b: 0.82, angle: 90 },
  square: { type: "square", a: 1, b: 1, angle: 90 },
  hexagonal: { type: "hexagonal", a: 1, b: 1, angle: 60 },
};

export const IDENTITY: Matrix2 = { a: 1, b: 0, c: 0, d: 1 };

export function mod1(value: number): number {
  const result = value - Math.floor(value);
  return result > 1 - EPSILON || result < EPSILON ? 0 : result;
}

export function roundCoordinate(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

export function normalizePoint(point: FractionalPoint): FractionalPoint {
  return { u: mod1(point.u), v: mod1(point.v) };
}

export function splitPoint(point: FractionalPoint): {
  point: FractionalPoint;
  tile: TileOffset;
} {
  const u = Math.floor(point.u + EPSILON);
  const v = Math.floor(point.v + EPSILON);
  return {
    point: normalizePoint(point),
    tile: { u, v },
  };
}

export function addPoint(
  left: FractionalPoint,
  right: FractionalPoint | TileOffset,
): FractionalPoint {
  return { u: left.u + right.u, v: left.v + right.v };
}

export function subtractPoint(
  left: FractionalPoint,
  right: FractionalPoint | TileOffset,
): FractionalPoint {
  return { u: left.u - right.u, v: left.v - right.v };
}

export function scalePoint(point: FractionalPoint, value: number): FractionalPoint {
  return { u: point.u * value, v: point.v * value };
}

export function fractionalToWorld(point: FractionalPoint, lattice: Lattice): FractionalPoint {
  const radians = (lattice.angle * Math.PI) / 180;
  return {
    u: point.u * lattice.a + point.v * lattice.b * Math.cos(radians),
    v: point.v * lattice.b * Math.sin(radians),
  };
}

export function multiplyMatrix(left: Matrix2, right: Matrix2): Matrix2 {
  return {
    a: left.a * right.a + left.b * right.c,
    b: left.a * right.b + left.b * right.d,
    c: left.c * right.a + left.d * right.c,
    d: left.c * right.b + left.d * right.d,
  };
}

export function matrixPoint(matrix: Matrix2, point: FractionalPoint): FractionalPoint {
  return {
    u: matrix.a * point.u + matrix.b * point.v,
    v: matrix.c * point.u + matrix.d * point.v,
  };
}

export function applyOperation(
  operation: AffineOperation,
  point: FractionalPoint,
): FractionalPoint {
  return addPoint(matrixPoint(operation.matrix, point), operation.shift);
}

export function composeOperations(
  left: AffineOperation,
  right: AffineOperation,
): AffineOperation {
  return {
    matrix: multiplyMatrix(left.matrix, right.matrix),
    shift: normalizePoint(addPoint(matrixPoint(left.matrix, right.shift), left.shift)),
  };
}

export function determinant(matrix: Matrix2): number {
  return matrix.a * matrix.d - matrix.b * matrix.c;
}

export function matricesEqual(left: Matrix2, right: Matrix2): boolean {
  return (
    Math.abs(left.a - right.a) < EPSILON &&
    Math.abs(left.b - right.b) < EPSILON &&
    Math.abs(left.c - right.c) < EPSILON &&
    Math.abs(left.d - right.d) < EPSILON
  );
}

export function pointsEqual(left: FractionalPoint, right: FractionalPoint): boolean {
  const a = normalizePoint(left);
  const b = normalizePoint(right);
  return Math.abs(a.u - b.u) < EPSILON && Math.abs(a.v - b.v) < EPSILON;
}

export function operationKey(operation: AffineOperation): string {
  const { matrix, shift } = operation;
  const t = normalizePoint(shift);
  return [matrix.a, matrix.b, matrix.c, matrix.d, roundCoordinate(t.u), roundCoordinate(t.v)].join(
    ",",
  );
}

export function signedArea(points: FractionalPoint[], lattice: Lattice): number {
  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = fractionalToWorld(points[index], lattice);
    const next = fractionalToWorld(points[(index + 1) % points.length], lattice);
    area += current.u * next.v - next.u * current.v;
  }
  return area / 2;
}

export function polygonCentroid(points: FractionalPoint[]): FractionalPoint {
  let doubleArea = 0;
  let u = 0;
  let v = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const cross = current.u * next.v - next.u * current.v;
    doubleArea += cross;
    u += (current.u + next.u) * cross;
    v += (current.v + next.v) * cross;
  }
  if (Math.abs(doubleArea) < EPSILON) {
    const sum = points.reduce(
      (total, point) => addPoint(total, point),
      { u: 0, v: 0 },
    );
    return scalePoint(sum, 1 / points.length);
  }
  return { u: u / (3 * doubleArea), v: v / (3 * doubleArea) };
}

export function pointInPolygon(point: FractionalPoint, polygon: FractionalPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const current = polygon[i];
    const previous = polygon[j];
    const intersects =
      current.v > point.v !== previous.v > point.v &&
      point.u <
        ((previous.u - current.u) * (point.v - current.v)) /
          (previous.v - current.v + Number.EPSILON) +
          current.u;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

export function formatPoint(point: FractionalPoint): string {
  return `(${point.u.toFixed(3)}, ${point.v.toFixed(3)})`;
}
