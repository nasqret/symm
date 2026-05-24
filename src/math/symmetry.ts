import type {
  AffineOperation,
  CellDocument,
  FractionalPoint,
  Matrix2,
  MotifVertex,
  PeriodicFace,
  SymmetryResult,
} from "../types";
import { WALLPAPER_GROUPS } from "../data/wallpaperGroups";
import {
  EPSILON,
  IDENTITY,
  addPoint,
  applyOperation,
  determinant,
  matricesEqual,
  matrixPoint,
  mod1,
  normalizePoint,
  pointsEqual,
  splitPoint,
} from "./lattice";
import { canonicalEdgeKey, extractFaces, faceColor, findFaceAtPoint } from "./periodicGraph";

const matrix = (a: number, b: number, c: number, d: number): Matrix2 => ({
  a,
  b,
  c,
  d,
});

const C2 = matrix(-1, 0, 0, -1);
const MX = matrix(1, 0, 0, -1);
const MY = matrix(-1, 0, 0, 1);
const C4 = matrix(0, -1, 1, 0);
const C4_INV = matrix(0, 1, -1, 0);
const DIAGONAL = matrix(0, 1, 1, 0);
const ANTIDIAGONAL = matrix(0, -1, -1, 0);
const C6 = matrix(0, -1, 1, 1);
const C6_INV = matrix(1, 1, -1, 0);
const C3 = matrix(-1, -1, 1, 0);
const C3_INV = matrix(0, 1, -1, -1);
const HEX_MIRROR_A = matrix(0, 1, 1, 0);
const HEX_MIRROR_B = matrix(1, 1, 0, -1);
const HEX_MIRROR_C = matrix(-1, 0, -1, 1);

function candidatesFor(document: CellDocument): Matrix2[] {
  switch (document.lattice.type) {
    case "generic":
      return [IDENTITY, C2];
    case "rectangular":
      return [IDENTITY, C2, MX, MY];
    case "square":
      return [IDENTITY, C2, C4, C4_INV, MX, MY, DIAGONAL, ANTIDIAGONAL];
    case "hexagonal":
      return [
        IDENTITY,
        C2,
        C3,
        C3_INV,
        C6,
        C6_INV,
        HEX_MIRROR_A,
        HEX_MIRROR_B,
        HEX_MIRROR_C,
        matrix(0, -1, -1, 0),
        matrix(-1, -1, 0, 1),
        matrix(1, 0, 1, -1),
      ];
  }
}

function locateVertex(
  document: CellDocument,
  point: FractionalPoint,
): { vertex: MotifVertex; tile: { u: number; v: number } } | undefined {
  const split = splitPoint(point);
  const vertex = document.vertices.find((entry) =>
    pointsEqual(entry, split.point),
  );
  return vertex ? { vertex, tile: split.tile } : undefined;
}

function validatesOperation(
  document: CellDocument,
  operation: AffineOperation,
  faces: PeriodicFace[],
): boolean {
  const edgeKeys = new Set(
    document.edges.map(({ from, to, shift }) => canonicalEdgeKey({ from, to, shift })),
  );
  for (const vertex of document.vertices) {
    if (!locateVertex(document, applyOperation(operation, vertex))) {
      return false;
    }
  }
  for (const edge of document.edges) {
    const from = document.vertices.find((vertex) => vertex.id === edge.from);
    const to = document.vertices.find((vertex) => vertex.id === edge.to);
    if (!from || !to) {
      return false;
    }
    const mappedFrom = locateVertex(document, applyOperation(operation, from));
    const mappedTo = locateVertex(
      document,
      applyOperation(operation, addPoint(to, edge.shift)),
    );
    if (!mappedFrom || !mappedTo) {
      return false;
    }
    const mappedKey = canonicalEdgeKey({
      from: mappedFrom.vertex.id,
      to: mappedTo.vertex.id,
      shift: {
        u: mappedTo.tile.u - mappedFrom.tile.u,
        v: mappedTo.tile.v - mappedFrom.tile.v,
      },
    });
    if (!edgeKeys.has(mappedKey)) {
      return false;
    }
  }
  for (const face of faces) {
    const target = findFaceAtPoint(faces, applyOperation(operation, face.centroid));
    if (!target || faceColor(document, target.signature) !== faceColor(document, face.signature)) {
      return false;
    }
  }
  return true;
}

function uniqueTranslations(
  document: CellDocument,
  pointMatrix: Matrix2,
): FractionalPoint[] {
  const first = document.vertices[0];
  if (!first) {
    return [{ u: 0, v: 0 }];
  }
  const mappedFirst = matrixPoint(pointMatrix, first);
  const shifts = document.vertices.map((target) =>
    normalizePoint({
      u: target.u - mappedFirst.u,
      v: target.v - mappedFirst.v,
    }),
  );
  shifts.push({ u: 0, v: 0 });
  return [...new Map(shifts.map((entry) => [`${entry.u},${entry.v}`, entry])).values()];
}

function fixedLineExists(operation: AffineOperation): boolean {
  if (determinant(operation.matrix) > 0) {
    return false;
  }
  const a = 1 - operation.matrix.a;
  const b = -operation.matrix.b;
  const c = -operation.matrix.c;
  const d = 1 - operation.matrix.d;
  for (let u = -1; u <= 1; u += 1) {
    for (let v = -1; v <= 1; v += 1) {
      const rhsU = operation.shift.u + u;
      const rhsV = operation.shift.v + v;
      if (Math.abs(a * d - b * c) > EPSILON) {
        return true;
      }
      if (
        Math.abs(a * rhsV - c * rhsU) < EPSILON &&
        Math.abs(b * rhsV - d * rhsU) < EPSILON
      ) {
        return true;
      }
    }
  }
  return false;
}

function rotationOrder(pointMatrix: Matrix2): number {
  if (determinant(pointMatrix) < 0) {
    return 0;
  }
  let power = IDENTITY;
  for (let order = 1; order <= 6; order += 1) {
    power = {
      a: power.a * pointMatrix.a + power.b * pointMatrix.c,
      b: power.a * pointMatrix.b + power.b * pointMatrix.d,
      c: power.c * pointMatrix.a + power.d * pointMatrix.c,
      d: power.c * pointMatrix.b + power.d * pointMatrix.d,
    };
    if (matricesEqual(power, IDENTITY)) {
      return order;
    }
  }
  return 1;
}

function hasMatrix(operations: AffineOperation[], wanted: Matrix2): boolean {
  return operations.some((operation) => matricesEqual(operation.matrix, wanted));
}

function hasFixedMatrix(operations: AffineOperation[], wanted: Matrix2): boolean {
  return operations.some(
    (operation) => matricesEqual(operation.matrix, wanted) && fixedLineExists(operation),
  );
}

function classify(document: CellDocument, accepted: AffineOperation[]): string {
  const pointOperations = accepted.filter(
    (operation) => !matricesEqual(operation.matrix, IDENTITY),
  );
  const translations = accepted.filter(
    (operation) =>
      matricesEqual(operation.matrix, IDENTITY) &&
      (!pointsEqual(operation.shift, { u: 0, v: 0 })),
  );
  const centered = translations.some(
    (entry) => Math.abs(mod1(entry.shift.u) - 0.5) < EPSILON && Math.abs(mod1(entry.shift.v) - 0.5) < EPSILON,
  );

  if (document.lattice.type === "generic") {
    return hasMatrix(pointOperations, C2) ? "p2" : "p1";
  }
  if (document.lattice.type === "rectangular") {
    const mirrorX = hasFixedMatrix(pointOperations, MX);
    const mirrorY = hasFixedMatrix(pointOperations, MY);
    const reflectionX = hasMatrix(pointOperations, MX);
    const reflectionY = hasMatrix(pointOperations, MY);
    if (centered && mirrorX && mirrorY) {
      return "cmm";
    }
    if (centered && (mirrorX || mirrorY)) {
      return "cm";
    }
    if (mirrorX && mirrorY) {
      return "pmm";
    }
    if ((mirrorX || mirrorY) && reflectionX && reflectionY) {
      return "pmg";
    }
    if (reflectionX && reflectionY && !mirrorX && !mirrorY) {
      return "pgg";
    }
    if (mirrorX || mirrorY) {
      return "pm";
    }
    if (reflectionX || reflectionY) {
      return "pg";
    }
    return hasMatrix(pointOperations, C2) ? "p2" : "p1";
  }
  if (document.lattice.type === "square") {
    const fourfold = hasMatrix(pointOperations, C4) || hasMatrix(pointOperations, C4_INV);
    if (!fourfold) {
      return hasMatrix(pointOperations, C2) ? "p2" : "p1";
    }
    const axialMirror = hasFixedMatrix(pointOperations, MX) || hasFixedMatrix(pointOperations, MY);
    const anyReflection = pointOperations.some((entry) => determinant(entry.matrix) < 0);
    if (axialMirror) {
      return "p4m";
    }
    return anyReflection ? "p4g" : "p4";
  }
  const sixfold = hasMatrix(pointOperations, C6) || hasMatrix(pointOperations, C6_INV);
  const threefold = hasMatrix(pointOperations, C3) || hasMatrix(pointOperations, C3_INV);
  const mirrorA = hasFixedMatrix(pointOperations, HEX_MIRROR_A);
  const anyMirror = pointOperations.some(
    (operation) => determinant(operation.matrix) < 0 && fixedLineExists(operation),
  );
  if (sixfold) {
    return anyMirror ? "p6m" : "p6";
  }
  if (threefold && anyMirror) {
    return mirrorA ? "p3m1" : "p31m";
  }
  return threefold ? "p3" : hasMatrix(pointOperations, C2) ? "p2" : "p1";
}

function describeOperation(operation: AffineOperation): string {
  if (matricesEqual(operation.matrix, IDENTITY)) {
    return `T(${operation.shift.u.toFixed(2)}, ${operation.shift.v.toFixed(2)})`;
  }
  const order = rotationOrder(operation.matrix);
  if (order > 1) {
    return `C${order} + (${operation.shift.u.toFixed(2)}, ${operation.shift.v.toFixed(2)})`;
  }
  const type = fixedLineExists(operation) ? "mirror" : "glide";
  return `${type} + (${operation.shift.u.toFixed(2)}, ${operation.shift.v.toFixed(2)})`;
}

export function computeSymmetry(document: CellDocument): SymmetryResult {
  const accepted: AffineOperation[] = [];
  const faces = extractFaces(document);
  let tested = 0;
  for (const pointMatrix of candidatesFor(document)) {
    for (const shift of uniqueTranslations(document, pointMatrix)) {
      tested += 1;
      const operation = { matrix: pointMatrix, shift };
      if (validatesOperation(document, operation, faces)) {
        accepted.push(operation);
      }
    }
  }
  const symbol = classify(document, accepted);
  const group = WALLPAPER_GROUPS.find((entry) => entry.symbol === symbol);
  const additionalTranslations = accepted.filter(
    (entry) =>
      matricesEqual(entry.matrix, IDENTITY) &&
      !pointsEqual(entry.shift, { u: 0, v: 0 }),
  );
  const nonIdentity = accepted.filter(
    (entry) => !matricesEqual(entry.matrix, IDENTITY),
  );
  const derivedGenerators = [
    "T(a) = (1, 0)",
    "T(b) = (0, 1)",
    ...additionalTranslations.slice(0, 1).map(describeOperation),
    ...nonIdentity.slice(0, 3).map(describeOperation),
  ];
  return {
    symbol,
    standardSymbol: group?.standardSymbol ?? symbol,
    generators: group?.generators ?? derivedGenerators,
    accepted,
    rejectedCount: Math.max(0, tested - accepted.length),
    additionalTranslations,
  };
}
