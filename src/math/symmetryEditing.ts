import type {
  AffineOperation,
  CellDocument,
  FractionalPoint,
  MotifVertex,
  PeriodicFace,
  TileOffset,
} from "../types";
import { addPoint, applyOperation, normalizePoint, pointsEqual, splitPoint } from "./lattice";
import { canonicalEdgeKey, extractFaces, findFaceAtPoint } from "./periodicGraph";
import { snapVertexToGrid } from "./vertexGrid";
import {
  addEdge,
  addVertex,
  clearFaceColor,
  colorFace,
  deleteEdge,
  deleteVertex,
} from "../state/mutations";

export interface VertexReference {
  vertexId: string;
  tile: TileOffset;
}

function uniquePoints(points: FractionalPoint[]): FractionalPoint[] {
  return points.reduce<FractionalPoint[]>((unique, point) => {
    const canonical = normalizePoint(point);
    if (!unique.some((entry) => pointsEqual(entry, canonical))) {
      unique.push(canonical);
    }
    return unique;
  }, []);
}

function orbitPoints(point: FractionalPoint, operations: AffineOperation[]): FractionalPoint[] {
  return uniquePoints(operations.map((operation) => applyOperation(operation, point)));
}

function locateVertex(document: CellDocument, point: FractionalPoint): VertexReference | undefined {
  const split = splitPoint(point);
  const vertex = document.vertices.find((entry) => pointsEqual(entry, split.point));
  return vertex ? { vertexId: vertex.id, tile: split.tile } : undefined;
}

function referencePoint(
  document: CellDocument,
  reference: VertexReference,
): FractionalPoint | undefined {
  const vertex = document.vertices.find((entry) => entry.id === reference.vertexId);
  return vertex ? addPoint(vertex, reference.tile) : undefined;
}

function edgeIdsInOrbit(
  document: CellDocument,
  edgeId: string,
  operations: AffineOperation[],
): string[] {
  const edge = document.edges.find((entry) => entry.id === edgeId);
  const from = edge && document.vertices.find((entry) => entry.id === edge.from);
  const to = edge && document.vertices.find((entry) => entry.id === edge.to);
  if (!edge || !from || !to) {
    return [];
  }
  const keys = new Set<string>();
  for (const operation of operations) {
    const mappedFrom = locateVertex(document, applyOperation(operation, from));
    const mappedTo = locateVertex(document, applyOperation(operation, addPoint(to, edge.shift)));
    if (!mappedFrom || !mappedTo) {
      continue;
    }
    keys.add(
      canonicalEdgeKey({
        from: mappedFrom.vertexId,
        to: mappedTo.vertexId,
        shift: {
          u: mappedTo.tile.u - mappedFrom.tile.u,
          v: mappedTo.tile.v - mappedFrom.tile.v,
        },
      }),
    );
  }
  return document.edges
    .filter((entry) => keys.has(canonicalEdgeKey(entry)))
    .map((entry) => entry.id);
}

function vertexIdsInOrbit(
  document: CellDocument,
  vertex: MotifVertex,
  operations: AffineOperation[],
): string[] {
  const ids = new Set<string>();
  for (const point of orbitPoints(vertex, operations)) {
    const mapped = document.vertices.find((entry) => pointsEqual(entry, point));
    if (mapped) {
      ids.add(mapped.id);
    }
  }
  return [...ids];
}

export function addVertexInOrbit(
  document: CellDocument,
  point: FractionalPoint,
  operations: AffineOperation[],
): CellDocument {
  const snapped = snapVertexToGrid(point, document.lattice.type);
  return orbitPoints(snapped, operations).reduce(
    (changed, target) => addVertex(changed, target),
    document,
  );
}

export function addEdgeInOrbit(
  document: CellDocument,
  from: VertexReference,
  to: VertexReference,
  operations: AffineOperation[],
): CellDocument {
  const fromPoint = referencePoint(document, from);
  const toPoint = referencePoint(document, to);
  if (!fromPoint || !toPoint) {
    return document;
  }
  return operations.reduce((changed, operation) => {
    const mappedFrom = locateVertex(changed, applyOperation(operation, fromPoint));
    const mappedTo = locateVertex(changed, applyOperation(operation, toPoint));
    return mappedFrom && mappedTo ? addEdge(changed, mappedFrom, mappedTo) : changed;
  }, document);
}

export function deleteEdgeInOrbit(
  document: CellDocument,
  edgeId: string,
  mergedFaceColor: string,
  operations: AffineOperation[],
): CellDocument {
  return edgeIdsInOrbit(document, edgeId, operations).reduce(
    (changed, targetId) => deleteEdge(changed, targetId, mergedFaceColor),
    document,
  );
}

export function deleteVertexInOrbit(
  document: CellDocument,
  vertexId: string,
  mergedFaceColor: string,
  operations: AffineOperation[],
): CellDocument {
  const vertex = document.vertices.find((entry) => entry.id === vertexId);
  if (!vertex) {
    return document;
  }
  return vertexIdsInOrbit(document, vertex, operations).reduce(
    (changed, targetId) => deleteVertex(changed, targetId, mergedFaceColor),
    document,
  );
}

function facesInOrbit(
  document: CellDocument,
  face: PeriodicFace,
  operations: AffineOperation[],
): PeriodicFace[] {
  const faces = extractFaces(document);
  const targets = new Map<string, PeriodicFace>();
  for (const operation of operations) {
    const target = findFaceAtPoint(
      faces,
      normalizePoint(applyOperation(operation, face.samplePoint)),
    );
    if (target) {
      targets.set(target.signature, target);
    }
  }
  return [...targets.values()];
}

export function colorFaceInOrbit(
  document: CellDocument,
  face: PeriodicFace,
  color: string,
  operations: AffineOperation[],
): CellDocument {
  return facesInOrbit(document, face, operations).reduce(
    (changed, target) => colorFace(changed, target, color),
    document,
  );
}

export function clearFaceColorInOrbit(
  document: CellDocument,
  face: PeriodicFace,
  operations: AffineOperation[],
): CellDocument {
  return facesInOrbit(document, face, operations).reduce(
    (changed, target) => clearFaceColor(changed, target),
    document,
  );
}
