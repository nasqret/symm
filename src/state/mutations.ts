import type {
  CellDocument,
  FractionalPoint,
  LatticeType,
  PeriodicFace,
  TileOffset,
} from "../types";
import { buildBlankDocument } from "../data/wallpaperGroups";
import { mod1, normalizePoint, pointsEqual } from "../math/lattice";
import { canonicalEdgeKey } from "../math/periodicGraph";

function stamped(document: CellDocument): CellDocument {
  return {
    ...document,
    presetGroup: undefined,
    modifiedAt: new Date().toISOString(),
  };
}

function nextId(prefix: string, ids: string[]): string {
  let index = ids.length + 1;
  while (ids.includes(`${prefix}_${index}`)) {
    index += 1;
  }
  return `${prefix}_${index}`;
}

function snap(value: number): number {
  return mod1(Math.round(value * 24) / 24);
}

export function changeLattice(_document: CellDocument, latticeType: LatticeType): CellDocument {
  return buildBlankDocument(latticeType);
}

export function addVertex(document: CellDocument, point: FractionalPoint): CellDocument {
  const canonical = normalizePoint({ u: snap(point.u), v: snap(point.v) });
  if (document.vertices.some((vertex) => pointsEqual(vertex, canonical))) {
    return document;
  }
  return stamped({
    ...document,
    vertices: [
      ...document.vertices,
      {
        id: nextId(
          "v",
          document.vertices.map((vertex) => vertex.id),
        ),
        ...canonical,
      },
    ],
  });
}

export function addEdge(
  document: CellDocument,
  from: { vertexId: string; tile: TileOffset },
  to: { vertexId: string; tile: TileOffset },
): CellDocument {
  const edge = {
    from: from.vertexId,
    to: to.vertexId,
    shift: { u: to.tile.u - from.tile.u, v: to.tile.v - from.tile.v },
  };
  const key = canonicalEdgeKey(edge);
  if (
    (from.vertexId === to.vertexId && edge.shift.u === 0 && edge.shift.v === 0) ||
    document.edges.some((entry) => canonicalEdgeKey(entry) === key)
  ) {
    return document;
  }
  return stamped({
    ...document,
    edges: [
      ...document.edges,
      {
        id: nextId(
          "e",
          document.edges.map((entry) => entry.id),
        ),
        ...edge,
      },
    ],
  });
}

export function deleteEdge(document: CellDocument, edgeId: string): CellDocument {
  return stamped({
    ...document,
    edges: document.edges.filter((edge) => edge.id !== edgeId),
  });
}

export function colorFace(
  document: CellDocument,
  face: PeriodicFace,
  color: string,
): CellDocument {
  return stamped({
    ...document,
    faceColors: [
      ...document.faceColors.filter((entry) => entry.signature !== face.signature),
      { signature: face.signature, color },
    ],
  });
}
